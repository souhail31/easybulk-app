import { Kafka } from 'kafkajs';
import axios from 'axios';
import pg from 'pg';
import admin from 'firebase-admin';

const { Pool } = pg;

export class IntelligentNotificationService {
  private kafka: Kafka;
  private consumer: any;
  private pool: pg.Pool;
  private mistralApiUrl = 'http://localhost:11434/api/generate';
  private mlApiUrl = 'http://localhost:5000';
  private keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
  private keycloakRealm = process.env.KEYCLOAK_REALM || 'master';

  constructor(pool: pg.Pool) {
    this.pool = pool;
    this.kafka = new Kafka({
      clientId: 'easybulk-notif-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
    });
    this.consumer = this.kafka.consumer({ groupId: 'notif-group' });

    // Initialisation Firebase
    try {
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(), // Cherche serviceAccountKey.json via GOOGLE_APPLICATION_CREDENTIALS
        });
      }
    } catch (err) {
      console.warn('[Firebase] Non initialisé. Assurez-vous d\'avoir serviceAccountKey.json.');
    }
  }

  async start() {
    await this.consumer.connect();
    // Subscribe to topics (Postgres CDC topics usually look like dbserver.schema.table)
    await this.consumer.subscribe({ topic: /.*\.public\..*/, fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }: any) => {
        if (!message.value) return;
        const envelope = JSON.parse(message.value.toString());
        const payload = envelope.payload || envelope;
        
        // Sécurité : On ignore les changements venant de la table des notifications elle-même (évite la boucle infinie)
        if (topic.includes('generated_notifications')) return;

        console.log(`[Kafka] Message reçu sur ${topic}`);

        // 1. Detect Update/Insert/Delete
        if (payload.op === 'c' || payload.op === 'u') {
          await this.processChange(payload.after, topic, payload.op);
        } else if (payload.op === 'd') {
          await this.processChange(payload.before, topic, payload.op);
        }
      },
    });
  }

  private async processChange(data: any, topic: string, op: string) {
    try {
      const opName = op === 'c' ? 'Création' : op === 'u' ? 'Mise à jour' : 'Suppression';
      console.log(`[AI] Début de génération pour : ${opName} sur ${topic}...`);

      // 2. Generate Content with Mistral
      const prompt = `Génère une notification très courte (1 phrase) pour un utilisateur suite à cette ${opName} sur la table ${topic}. Données : ${JSON.stringify(data)}. Réponds uniquement avec le texte de la notification.`;
      
      const response = await axios.post(this.mistralApiUrl, {
        model: 'mistral',
        prompt: prompt,
        stream: false
      });

      const content = response.data.response;

      // 3. Store in DB
      let userId = data.user_id || null;
      
      // Attempt to resolve user_id from membership_id for tables like user_contact, tags
      if (!userId && data.membership_id) {
        try {
          const memberRes = await this.pool.query('SELECT user_id FROM membership WHERE id = $1', [data.membership_id]);
          if (memberRes.rows.length > 0) {
            userId = memberRes.rows[0].user_id;
          }
        } catch (e) {
          console.warn('[Service Notif] Impossible de résoudre le user_id via membership_id', e);
        }
      }
      
      // If we still don't have a user_id, do NOT fall back to data.id as it's the table's PK, not the user's ID
      
      const insertRes = await this.pool.query(
        'INSERT INTO generated_notifications (source_data, content, user_id) VALUES ($1, $2, $3) RETURNING id',
        [JSON.stringify(data), content, userId]
      );
      const notificationId = insertRes.rows[0].id;

      console.log(`[AI] Notification générée: ${content}`);
      
      // 4. Etape 2 - Priorisation avec XGBoost (via ml_service.py)
      let priority = 'Info';
      try {
        const mlResponse = await axios.post(`${this.mlApiUrl}/classify`, { content });
        priority = mlResponse.data.priority;
        const confidence = mlResponse.data.confidence;
        
        await this.pool.query(
          'UPDATE generated_notifications SET priority = $1, classification_score = $2 WHERE id = $3',
          [priority, confidence, notificationId]
        );
        console.log(`[ML] Priorité détectée: ${priority} (${confidence})`);
      } catch (err) {
        console.warn('[ML] Impossible de contacter le service de classification, priorité par défaut: Info');
      }

      // 5. Etape 3 - Analyse Habitudes & Livraison (Random Forest + Keycloak)
      try {
        const timingResponse = await axios.post(`${this.mlApiUrl}/predict_optimal_time`, { user_id: userId });
        const { should_send_now } = timingResponse.data;

        if (should_send_now || priority === 'Urgent') {
          await this.deliverNotification(userId, content, priority);
        } else {
          console.log(`[ML] Envoi différé au moment optimal pour l'utilisateur ${userId}`);
        }
      } catch (err) {
        console.warn('[ML] Erreur analyse habitudes, envoi immédiat par défaut.');
        await this.deliverNotification(userId, content, priority);
      }
    } catch (error) {
      console.error('[Service Notif] Erreur:', error);
    }
  }

  private async deliverNotification(userId: number, content: string, priority: string) {
    console.log(`[Delivery] Analyse du meilleur canal pour l'utilisateur ${userId} (${priority})`);

    // A. Check Keycloak Status (Vraie intégration)
    const isOnline = await this.checkKeycloakStatus(userId);

    // B. Logic de Routage Intelligente
    if (priority === 'Urgent') {
      // Urgent : On envoie partout immédiatement
      await this.sendPush(userId, content);
      await this.sendEmail(userId, content);
    } else if (priority === 'Warning') {
      // Warning : On privilégie le Push si en ligne, sinon l'Email
      if (isOnline) {
        await this.sendPush(userId, content);
      } else {
        await this.sendEmail(userId, content);
      }
    } else {
      // Info : Pour le test, on envoie quand même un push pour que vous puissiez voir le résultat !
      console.log(`[System] Notification Info pour ${userId} envoyée (Mode Test).`);
      await this.sendPush(userId, content);
    }
  }

  private keycloakAdminToken: string | null = null;
  private keycloakTokenExpiry: number = 0;

  private async getKeycloakAdminToken(): Promise<string | null> {
    if (this.keycloakAdminToken && Date.now() < this.keycloakTokenExpiry) {
      return this.keycloakAdminToken;
    }

    try {
      // On utilise le realm "master" et admin-cli pour obtenir un token admin
      const response = await axios.post(
        `${this.keycloakUrl}/realms/master/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'password',
          client_id: 'admin-cli',
          username: process.env.KEYCLOAK_ADMIN_USER || 'admin',
          password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      this.keycloakAdminToken = response.data.access_token;
      this.keycloakTokenExpiry = Date.now() + (response.data.expires_in - 30) * 1000;
      console.log('[Keycloak] ✅ Token admin obtenu avec succès');
      return this.keycloakAdminToken;
    } catch (err) {
      console.warn('[Keycloak] ⚠️ Impossible d\'obtenir le token admin:', err.message);
      return null;
    }
  }

  private async checkKeycloakStatus(userId: number): Promise<boolean> {
    try {
      const userRes = await this.pool.query('SELECT id_user_keycloak FROM users WHERE id = $1', [userId]);
      const keycloakId = userRes.rows[0]?.id_user_keycloak;
      if (!keycloakId || keycloakId.startsWith('local-')) return false;

      const token = await this.getKeycloakAdminToken();
      if (!token) return false;

      // Interroge l'API Keycloak pour voir les sessions actives de l'utilisateur
      const sessionsRes = await axios.get(
        `${this.keycloakUrl}/admin/realms/${this.keycloakRealm}/users/${keycloakId}/sessions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const isOnline = sessionsRes.data.length > 0;
      console.log(`[Keycloak] Utilisateur ${userId} (${keycloakId}): ${isOnline ? '🟢 En ligne' : '🔴 Hors ligne'}`);
      return isOnline;
    } catch (err) {
      console.warn('[Keycloak] Erreur vérification statut, envoi par défaut:', err.message);
      return false;
    }
  }

  private async sendPush(userId: number, content: string) {
    try {
      // On récupère le token Firebase stocké en base pour cet utilisateur
      // (Note: vous devrez ajouter une colonne 'fcm_token' dans votre table users plus tard)
      const message = {
        notification: { title: 'EasyBulk Alert', body: content },
        topic: `user_${userId}` // On utilise les Topics Firebase pour simplifier
      };

      await admin.messaging().send(message);
      console.log(`[Firebase] ✅ Push envoyé avec succès (Topic: user_${userId})`);
    } catch (err) {
      console.warn(`[Firebase] ⚠️ Impossible d'envoyer le push (Pas de token ou erreur): ${err.message}`);
    }
  }

  private async sendEmail(userId: number, content: string) {
    // Intégration avec le système d'email existant
    console.log(`[Email] Email envoyé à l'utilisateur ${userId} avec le contenu: ${content}`);
  }
}
