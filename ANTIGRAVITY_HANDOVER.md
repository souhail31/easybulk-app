# Antigravity Handover & Setup Guide - EasyBulk V2

> **Instructions pour l'agent Antigravity :** Ce fichier est un document de passation de contexte. Si un utilisateur vous demande de continuer le projet EasyBulk, lisez ce fichier en priorité. Il contient l'état actuel de l'architecture, la procédure de démarrage, et le plan d'implémentation (V2) à exécuter.

---

## 📌 Contexte du Projet (EasyBulk)
EasyBulk est une plateforme SaaS (React + Tailwind "Stitch" UI) de gestion de campagnes SMS/Mailing. L'application dispose d'un backend monolithique (`server.ts`) connecté à **PostgreSQL**.
Le joyau du projet est son **Système de Notifications Intelligentes** basé sur l'IA et l'événementiel en temps réel :
1. **Debezium/Kafka** détecte les changements (CDC) dans PostgreSQL.
2. **Node.js** capte les événements Kafka.
3. **Mistral (Ollama)** génère un résumé textuel du changement.
4. **Python ML Service** (`ml_service.py`) classifie le texte (Urgent, Warning, Info).
5. **Node.js** achemine intelligemment la notification vers Firebase (Push) ou Email selon la priorité et le statut en ligne de l'utilisateur (via **Keycloak**).

---

## 🚀 Procédure de Lancement (Pour l'Ami / Développeur)
Pour que ce projet tourne sur votre PC, vous devez démarrer toute l'infrastructure sous-jacente. L'agent Antigravity peut vous aider à lancer ces commandes :

1. **Base de Données & Environnement**
   - Assurez-vous d'avoir un serveur PostgreSQL actif (ou via Neon).
   - Configurez le fichier `.env` avec la variable `DATABASE_URL`.
   - Si la base est vide, exécutez le fichier `schema.sql` pour créer les tables.

2. **Démarrer l'infrastructure Docker (Kafka, Debezium, Keycloak)**
   - Ouvrez *Docker Desktop*.
   - Lancez la commande : `docker-compose up -d`

3. **Démarrer l'IA Générative (Mistral)**
   - Installez [Ollama](https://ollama.com/) sur votre PC.
   - Lancez la commande : `ollama run mistral` (il écoutera sur le port 11434).

4. **Démarrer le Service Machine Learning (Python)**
   - Installez les dépendances : `pip install flask xgboost pandas scikit-learn`
   - Lancez le service : `python ml_service.py` (il écoutera sur le port 5000).

5. **Démarrer le serveur Web & API (Node.js)**
   - Lancez `npm install` puis `npm run dev` (démarre sur le port 3001).

---

## 🛠️ Plan d'Implémentation V2 (À exécuter par le nouvel Agent Antigravity)

L'architecture actuelle fonctionne, mais elle doit être améliorée pour supporter une charge de production. Voici les 5 tâches que le nouvel agent devra implémenter :

### Tâche 1 : Séparation API / Worker (Microservices)
Le fichier `server.ts` est surchargé. Il faut séparer l'API Web du traitement Kafka.
- Supprimer l'instanciation de `IntelligentNotificationService` dans `server.ts`.
- Créer un fichier `src/worker.ts` qui s'occupe de lancer la connexion DB et le service de notifications.
- Ajouter un script `"worker": "tsx src/worker.ts"` dans `package.json`.

### Tâche 2 : Fan-out - Distribution Intelligente (`user_null` fix)
Actuellement, modifier un groupe génère une notification `user_null`.
- Dans `src/services/notificationService.ts`, modifier la logique pour que, si une table globale (`groupe`, `organization`) est modifiée, le code fasse un `SELECT user_id FROM membership WHERE groupe_id = X`.
- Générer et insérer une notification individuelle pour chaque membre trouvé.

### Tâche 3 : Anonymisation des Données (RGPD)
- Avant d'envoyer le JSON de l'événement Kafka à Mistral, créer une fonction `anonymizePayload(data)`.
- Remplacer les champs sensibles (`email`, `phone_number`, `password_hash`) par des masques (ex: `***`).

### Tâche 4 : Micro-Batching (Anti-Spam Kafka)
- Dans `notificationService.ts`, changer la méthode `.run({ eachMessage: ... })` de KafkaJS pour utiliser `eachBatch`.
- Regrouper les modifications de la même table sur une fenêtre de quelques secondes, et envoyer une liste combinée à Mistral au lieu d'appeler l'IA pour chaque ligne de BDD modifiée.

### Tâche 5 : Dead Letter Queue (DLQ)
- Créer une table PostgreSQL `failed_notifications`.
- Si l'API d'Ollama ou de Python ML échoue ou est hors ligne, capturer l'erreur dans le bloc `catch` principal de `processChange()`.
- Enregistrer le payload dans `failed_notifications` pour ne perdre aucune modification.

---
> **Message au nouvel agent Antigravity :** *"Bonjour collègue ! Dès que l'utilisateur te demandera de commencer l'Architecture V2, tu devras suivre les 5 tâches ci-dessus."*
