import crypto from "crypto";
import express from "express";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";
import path from "path";
import pg from "pg";
import dotenv from "dotenv";
import { IntelligentNotificationService } from "./src/services/notificationService.js";

dotenv.config();

const { Pool } = pg;

type ContactApiRow = {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  tags: string[] | string | null;
  lastActive: string | Date | null;
};

type TemplateApiRow = {
  id: number;
  name: string;
  type: string | null;
  content: string | null;
  status: boolean;
};

type TemplateTypeConfig = {
  code: string;
  label: string;
};

type UserListRow = {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  groupName: string | null;
  status: string;
  recordType: "user" | "invitation";
};

type UserMetadataRoleRow = {
  id: number;
  name: string;
  value: string | null;
};

type UserMetadataGroupRow = {
  id: number;
  name: string;
  organizationId: number;
  organizationName: string;
};

type InvitationLookupRow = {
  membershipId: number;
  email: string;
  invitationName: string | null;
  roleId: number | null;
  roleLabel: string | null;
  groupId: number | null;
  groupName: string | null;
  organizationId: number;
  organizationName: string | null;
  expiresAt: string | Date | null;
};

type RoleConfig = {
  code: string;
  label: string;
};

type DeliveryResult = {
  mode: "smtp" | "preview";
  message: string;
  previewUrl: string | null;
};

function normalizeTags(tags: ContactApiRow["tags"]) {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function mapContactRow(row: ContactApiRow) {
  return {
    id: row.id,
    name: row.name?.trim() || row.phone,
    phone: row.phone,
    email: row.email?.trim() || "",
    tags: normalizeTags(row.tags),
    lastActive: row.lastActive ? new Date(row.lastActive).toISOString().slice(0, 10) : "",
  };
}

function mapTemplateRow(row: TemplateApiRow) {
  return {
    id: row.id,
    name: row.name,
    type: row.type || "Classique",
    content: row.content || "",
    status: Boolean(row.status),
  };
}

function getTemplateTypeConfig(rawType?: string): TemplateTypeConfig {
  const normalized = rawType?.trim().toLowerCase();

  if (normalized === "transactionnelle") {
    return { code: "TRANSACTIONNELLE", label: "Transactionnelle" };
  }

  return { code: "CLASSIQUE", label: "Classique" };
}

function getRoleConfig(rawRole?: string): RoleConfig {
  const normalized = rawRole?.trim().toLowerCase();

  if (normalized === "superadmin") {
    return { code: "SUPERADMIN", label: "Superadmin" };
  }

  if (normalized === "admin") {
    return { code: "ADMIN", label: "Admin" };
  }

  return { code: "AGENT", label: "Agent" };
}

function mapUserRow(row: UserListRow) {
  return {
    id: row.id,
    name: row.name?.trim() || row.email,
    email: row.email,
    role: row.role || "Sans role",
    group: row.groupName || "Aucun groupe",
    status: row.status,
    recordType: row.recordType,
  };
}

function buildBaseUrl(req: express.Request) {
  return `${req.protocol}://${req.get("host")}`;
}

function createPasswordHash(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function startServer() {
  const app = express();
  const PORT = 3001;

  // Database Connection
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

  app.use(express.json());

  async function runInvitationMigrations() {
    const queries = [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50)",
      "ALTER TABLE membership ALTER COLUMN user_id DROP NOT NULL",
      "ALTER TABLE membership ADD COLUMN IF NOT EXISTS invitation_email VARCHAR(255)",
      "ALTER TABLE membership ADD COLUMN IF NOT EXISTS invitation_name VARCHAR(255)",
      "ALTER TABLE membership ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(255)",
      "ALTER TABLE membership ADD COLUMN IF NOT EXISTS invitation_role_id INTEGER REFERENCES role(id)",
      "ALTER TABLE membership ADD COLUMN IF NOT EXISTS invitation_group_id INTEGER REFERENCES groupe(id)",
      "ALTER TABLE membership ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP",
      "ALTER TABLE membership ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMP",
      "ALTER TABLE membership ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMP",
      "ALTER TABLE groupe ADD COLUMN IF NOT EXISTS type VARCHAR(255) DEFAULT 'Classique'",
      "ALTER TABLE campagne ADD COLUMN IF NOT EXISTS groupe_id INTEGER REFERENCES groupe(id)",
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_membership_invitation_token ON membership (invitation_token) WHERE invitation_token IS NOT NULL",
      "CREATE INDEX IF NOT EXISTS idx_membership_invitation_email ON membership (LOWER(invitation_email)) WHERE invitation_email IS NOT NULL",
      "CREATE TABLE IF NOT EXISTS generated_notifications (id SERIAL PRIMARY KEY, source_data JSONB, content TEXT, priority VARCHAR(20), classification_score FLOAT, user_id INTEGER REFERENCES users(id), created_at TIMESTAMP DEFAULT NOW())",
    ];

    for (const query of queries) {
      await pool.query(query);
    }
  }

  async function ensureTemplateType(rawType?: string) {
    const { code, label } = getTemplateTypeConfig(rawType);
    const existing = await pool.query<{ code: string; value: string }>(
      `
      SELECT code, value
      FROM prm_campaign_type
      WHERE LOWER(code) = LOWER($1) OR LOWER(value) = LOWER($2)
      LIMIT 1
    `,
      [code, label]
    );

    if (existing.rows[0]) {
      return existing.rows[0].code;
    }

    const created = await pool.query<{ code: string }>(
      `
      INSERT INTO prm_campaign_type (code, value)
      VALUES ($1, $2)
      ON CONFLICT (code) DO UPDATE SET value = EXCLUDED.value
      RETURNING code
    `,
      [code, label]
    );

    return created.rows[0].code;
  }

  async function ensureStatus(code: string, value: string, type = "STATUS") {
    const existing = await pool.query<{ id: number }>(
      `
      SELECT id
      FROM prm_status
      WHERE LOWER(code) = LOWER($1)
      LIMIT 1
    `,
      [code]
    );

    if (existing.rows[0]) {
      return existing.rows[0].id;
    }

    const created = await pool.query<{ id: number }>(
      `
      INSERT INTO prm_status (code, value, type, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id
    `,
      [code, value, type]
    );

    return created.rows[0].id;
  }

  async function ensureRole(rawRole?: string) {
    const { code, label } = getRoleConfig(rawRole);
    const existing = await pool.query<{ id: number }>(
      `
      SELECT id
      FROM role
      WHERE LOWER(name) = LOWER($1) OR LOWER(COALESCE(value, '')) = LOWER($2)
      LIMIT 1
    `,
      [code, label]
    );

    if (existing.rows[0]) {
      return existing.rows[0].id;
    }

    const created = await pool.query<{ id: number }>(
      `
      INSERT INTO role (name, value)
      VALUES ($1, $2)
      RETURNING id
    `,
      [code, label]
    );

    return created.rows[0].id;
  }

  async function ensureOrganization() {
    const existing = await pool.query<{ id: number }>(`SELECT id FROM organization LIMIT 1`);
    if (existing.rows[0]) return existing.rows[0].id;
    
    const created = await pool.query<{ id: number }>(
      `INSERT INTO organization (name, description, quota) VALUES ('EasyBulk Global', 'Organisation par defaut', 100000) RETURNING id`
    );
    return created.rows[0].id;
  }

  async function ensureUserSetup() {
    await runInvitationMigrations();
    await ensureStatus("ACTIVE", "Actif");
    await ensureStatus("INVITED", "Invitation envoyee");
    await Promise.all([ensureRole("Agent"), ensureRole("Admin"), ensureRole("Superadmin")]);
    await ensureOrganization();
  }

  async function sendInvitationEmail({
    to,
    recipientName,
    roleLabel,
    groupName,
    invitationLink,
  }: {
    to: string;
    recipientName: string;
    roleLabel: string;
    groupName: string;
    invitationLink: string;
  }): Promise<DeliveryResult> {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM;
    const smtpSecure = process.env.SMTP_SECURE === "true";

    if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
      console.warn(`Invitation email preview for ${to}: ${invitationLink}`);
      return {
        mode: "preview",
        message: "SMTP non configure. Le lien d'invitation a ete genere en mode apercu.",
        previewUrl: invitationLink,
      };
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject: "Invitation EasyBulk",
      text: [
        `Bonjour ${recipientName},`,
        "",
        "Vous avez ete invite a rejoindre EasyBulk.",
        `Role: ${roleLabel}`,
        `Groupe: ${groupName}`,
        "",
        `Completez votre compte ici: ${invitationLink}`,
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
          <p>Bonjour ${recipientName},</p>
          <p>Vous avez ete invite a rejoindre <strong>EasyBulk</strong>.</p>
          <p><strong>Role:</strong> ${roleLabel}<br /><strong>Groupe:</strong> ${groupName}</p>
          <p>
            <a href="${invitationLink}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;">
              Completer mon compte
            </a>
          </p>
          <p>Si le bouton ne fonctionne pas, copiez ce lien:</p>
          <p><a href="${invitationLink}">${invitationLink}</a></p>
        </div>
      `,
    });

    return {
      mode: "smtp",
      message: "Invitation envoyee par email.",
      previewUrl: null,
    };
  }

  async function getInvitationByToken(token: string) {
    const result = await pool.query<InvitationLookupRow>(
      `
      SELECT
        m.id AS "membershipId",
        m.invitation_email AS email,
        m.invitation_name AS "invitationName",
        m.invitation_role_id AS "roleId",
        COALESCE(r.value, r.name) AS "roleLabel",
        m.invitation_group_id AS "groupId",
        g.name AS "groupName",
        m.organization_id AS "organizationId",
        o.name AS "organizationName",
        m.invitation_expires_at AS "expiresAt"
      FROM membership m
      JOIN organization o ON o.id = m.organization_id
      LEFT JOIN role r ON r.id = m.invitation_role_id
      LEFT JOIN groupe g ON g.id = m.invitation_group_id
      WHERE m.invitation_token = $1
        AND m.user_id IS NULL
        AND m.invitation_accepted_at IS NULL
      LIMIT 1
    `,
      [token]
    );

    return result.rows[0] || null;
  }

  await ensureUserSetup();

  // Start Intelligent Notification Service
  const notificationService = new IntelligentNotificationService(pool);
  notificationService.start().catch(err => {
    console.error("Failed to start Intelligent Notification Service:", err);
  });

  // Notifications Endpoints
  app.get("/api/notifications", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT id, content, priority, created_at, classification_score 
        FROM generated_notifications 
        ORDER BY created_at DESC 
        LIMIT 10
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // API Routes
  app.get("/api/health", async (req, res) => {
    try {
      const result = await pool.query("SELECT NOW()");
      res.json({ status: "ok", time: result.rows[0].now });
    } catch (err) {
      console.error("Database connection error:", err);
      res.status(500).json({ status: "error", message: "Database connection failed" });
    }
  });

  // Example route to get groups from DB
  // Example route to get groups from DB
  app.get("/api/db-status", async (req, res) => {
    try {
      const result = await pool.query("SELECT current_database(), current_user");
      res.json({ connected: true, db: result.rows[0].current_database, user: result.rows[0].current_user });
    } catch (err) {
      res.status(500).json({ connected: false, error: (err as Error).message });
    }
  });

  // Contacts Endpoints
  app.get("/api/contacts", async (req, res) => {
    try {
      const result = await pool.query<ContactApiRow>(`
        SELECT
          c.msisdn AS id,
          COALESCE(NULLIF(uc.attribute1, ''), c.msisdn) AS name,
          c.msisdn AS phone,
          COALESCE(uc.attribute2, '') AS email,
          COALESCE(string_to_array(NULLIF(uc.attribute3, ''), ','), ARRAY[]::text[]) AS tags,
          COALESCE(uc.date_modified, uc.date_created, NOW()) AS "lastActive"
        FROM contacts c
        LEFT JOIN LATERAL (
          SELECT attribute1, attribute2, attribute3, date_created, date_modified
          FROM user_contact
          WHERE contact_id = c.msisdn
          ORDER BY id DESC
          LIMIT 1
        ) uc ON TRUE
        ORDER BY COALESCE(uc.date_modified, uc.date_created, NOW()) DESC, c.msisdn DESC
      `);
      res.json(result.rows.map(mapContactRow));
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    const { name, phone, email, tags } = req.body;
    try {
      const tagList = Array.isArray(tags) ? tags.join(", ") : "";

      await pool.query(
        "INSERT INTO contacts (msisdn, country_code) VALUES ($1, NULL) ON CONFLICT (msisdn) DO NOTHING",
        [phone]
      );
      const result = await pool.query<ContactApiRow>(
        `
        INSERT INTO user_contact (contact_id, attribute1, attribute2, attribute3, date_created, date_modified)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING
          contact_id AS id,
          attribute1 AS name,
          contact_id AS phone,
          attribute2 AS email,
          attribute3 AS tags,
          date_modified AS "lastActive"
      `,
        [phone, name, email, tagList]
      );
      res.status(201).json(mapContactRow(result.rows[0]));
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/users/metadata", async (req, res) => {
    try {
      const [rolesResult, groupsResult] = await Promise.all([
        pool.query<UserMetadataRoleRow>(
          `
          SELECT id, name, value
          FROM role
          ORDER BY
            CASE UPPER(name)
              WHEN 'SUPERADMIN' THEN 1
              WHEN 'ADMIN' THEN 2
              ELSE 3
            END,
            id ASC
        `
        ),
        pool.query<UserMetadataGroupRow>(
          `
          SELECT
            g.id,
            g.name,
            g.organization_id AS "organizationId",
            COALESCE(o.name, '') AS "organizationName"
          FROM groupe g
          LEFT JOIN organization o ON o.id = g.organization_id
          ORDER BY g.name ASC
        `
        ),
      ]);

      res.json({
        roles: rolesResult.rows.map((role) => ({
          id: role.id,
          code: role.name,
          label: role.value || role.name,
        })),
        groups: groupsResult.rows,
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Auth Endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email et mot de passe requis." });
      }

      // Check if user exists
      const userRes = await pool.query(
        "SELECT id, email, first_name, last_name, password_hash FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(user_name) = LOWER($1) LIMIT 1",
        [email.trim()]
      );

      if (userRes.rows.length === 0) {
        return res.status(401).json({ error: "Identifiants incorrects." });
      }

      const user = userRes.rows[0];

      // If user has no password yet (never accepted invite)
      if (!user.password_hash) {
        return res.status(401).json({ error: "Compte non activé ou mot de passe manquant." });
      }

      // Verify password
      const [salt, key] = user.password_hash.split(":");
      const hashedBuffer = crypto.scryptSync(password, salt, 64);
      const keyBuffer = Buffer.from(key, "hex");
      const match = crypto.timingSafeEqual(hashedBuffer, keyBuffer);

      if (!match) {
        return res.status(401).json({ error: "Identifiants incorrects." });
      }

      // Login success, return basic user info
      res.json({
        id: user.id,
        email: user.email,
        name: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email,
        // Dynamically assign role based on email for testing purposes
        role: user.email.toLowerCase().includes('admin') ? "superadmin" : "agent" 
      });

    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Erreur serveur." });
    }
  });

  app.get("/api/auth/organizations", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ error: "UserId requis." });
      }

      // Fetch organizations where this user is a member
      const orgsRes = await pool.query(`
        SELECT o.id, o.name 
        FROM membership m
        JOIN organization o ON o.id = m.organization_id
        WHERE m.user_id = $1
      `, [userId]);

      res.json(orgsRes.rows);
    } catch (error) {
      console.error("Organizations fetch error:", error);
      res.status(500).json({ error: "Erreur serveur." });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const result = await pool.query<UserListRow>(
        `
        WITH accepted_users AS (
          SELECT
            CONCAT('user-', u.id)::text AS id,
            NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), '') AS name,
            u.email,
            NULLIF(STRING_AGG(DISTINCT COALESCE(r.value, r.name), ', '), '') AS role,
            NULLIF(STRING_AGG(DISTINCT g.name, ', '), '') AS "groupName",
            CASE
              WHEN BOOL_OR(UPPER(COALESCE(ps.code, '')) = 'ACTIVE') THEN 'Actif'
              ELSE 'Inactif'
            END AS status,
            'user'::text AS "recordType"
          FROM users u
          LEFT JOIN membership m ON m.user_id = u.id
          LEFT JOIN prm_status ps ON ps.id = m.status_id
          LEFT JOIN user_mission um ON um.membership_id = m.id
          LEFT JOIN role r ON r.id = um.role_id
          LEFT JOIN groupe g ON g.id = um.groupe_id
          GROUP BY u.id, u.first_name, u.last_name, u.email
        ),
        pending_invitations AS (
          SELECT
            CONCAT('invite-', m.id)::text AS id,
            m.invitation_name AS name,
            m.invitation_email AS email,
            COALESCE(r.value, r.name) AS role,
            g.name AS "groupName",
            'Invitation envoyee'::text AS status,
            'invitation'::text AS "recordType"
          FROM membership m
          LEFT JOIN role r ON r.id = m.invitation_role_id
          LEFT JOIN groupe g ON g.id = m.invitation_group_id
          WHERE m.user_id IS NULL
            AND m.invitation_token IS NOT NULL
            AND m.invitation_accepted_at IS NULL
        )
        SELECT *
        FROM (
          SELECT * FROM accepted_users
          UNION ALL
          SELECT * FROM pending_invitations
        ) user_rows
        ORDER BY LOWER(COALESCE(name, email)) ASC
      `
      );

      res.json(result.rows.map(mapUserRow));
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/invitations", async (req, res) => {
    const { name, email, role, groupId } = req.body as {
      name?: string;
      email?: string;
      role?: string;
      groupId?: number | string;
    };

    if (!name?.trim() || !email?.trim() || !groupId) {
      res.status(400).json({ error: "Nom, email et groupe sont obligatoires." });
      return;
    }

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const groupResult = await pool.query<{
        id: number;
        name: string;
        organizationId: number;
        organizationName: string | null;
      }>(
        `
        SELECT
          g.id,
          g.name,
          g.organization_id AS "organizationId",
          o.name AS "organizationName"
        FROM groupe g
        JOIN organization o ON o.id = g.organization_id
        WHERE g.id = $1
        LIMIT 1
      `,
        [Number(groupId)]
      );

      const group = groupResult.rows[0];
      if (!group) {
        res.status(404).json({ error: "Groupe introuvable." });
        return;
      }

      const [existingUser, existingInvite] = await Promise.all([
        pool.query<{ id: number }>("SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1", [trimmedEmail]),
        pool.query<{ id: number }>(
          `
          SELECT id
          FROM membership
          WHERE user_id IS NULL
            AND invitation_accepted_at IS NULL
            AND LOWER(invitation_email) = LOWER($1)
          LIMIT 1
        `,
          [trimmedEmail]
        ),
      ]);

      if (existingUser.rows[0]) {
        res.status(409).json({ error: "Un utilisateur existe deja avec cet email." });
        return;
      }

      if (existingInvite.rows[0]) {
        res.status(409).json({ error: "Une invitation en attente existe deja pour cet email." });
        return;
      }

      const invitedStatusId = await ensureStatus("INVITED", "Invitation envoyee");
      const roleId = await ensureRole(role);
      const token = crypto.randomBytes(32).toString("hex");

      const createdInvitation = await pool.query<{
        id: number;
        invitationName: string | null;
        invitationEmail: string;
        roleLabel: string | null;
        groupName: string | null;
      }>(
        `
        INSERT INTO membership (
          user_id,
          organization_id,
          status_id,
          invitation_email,
          invitation_name,
          invitation_token,
          invitation_role_id,
          invitation_group_id,
          invited_at,
          invitation_expires_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW() + INTERVAL '7 days')
        RETURNING
          id,
          invitation_name AS "invitationName",
          invitation_email AS "invitationEmail",
          (SELECT COALESCE(value, name) FROM role WHERE id = invitation_role_id) AS "roleLabel",
          (SELECT name FROM groupe WHERE id = invitation_group_id) AS "groupName"
      `,
        [null, group.organizationId, invitedStatusId, trimmedEmail, name.trim(), token, roleId, group.id]
      );

      const invitationLink = `${buildBaseUrl(req)}/invitation/${token}`;
      const delivery = await sendInvitationEmail({
        to: trimmedEmail,
        recipientName: name.trim(),
        roleLabel: createdInvitation.rows[0].roleLabel || getRoleConfig(role).label,
        groupName: createdInvitation.rows[0].groupName || group.name,
        invitationLink,
      });

      res.status(201).json({
        invitation: {
          id: `invite-${createdInvitation.rows[0].id}`,
          name: createdInvitation.rows[0].invitationName || trimmedEmail,
          email: createdInvitation.rows[0].invitationEmail,
          role: createdInvitation.rows[0].roleLabel || getRoleConfig(role).label,
          group: createdInvitation.rows[0].groupName || group.name,
          status: "Invitation envoyee",
          recordType: "invitation",
        },
        delivery,
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/invitations/:token", async (req, res) => {
    try {
      const invitation = await getInvitationByToken(req.params.token);

      if (!invitation) {
        res.status(404).json({ error: "Invitation introuvable." });
        return;
      }

      if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
        res.status(410).json({ error: "Cette invitation a expire." });
        return;
      }

      res.json({
        email: invitation.email,
        invitedName: invitation.invitationName || invitation.email,
        role: invitation.roleLabel || "Agent",
        group: invitation.groupName || "Aucun groupe",
        organization: invitation.organizationName || "",
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/invitations/:token/accept", async (req, res) => {
    const { firstName, lastName, userName, phoneNumber, password } = req.body as {
      firstName?: string;
      lastName?: string;
      userName?: string;
      phoneNumber?: string;
      password?: string;
    };

    if (!firstName?.trim() || !lastName?.trim() || !userName?.trim() || !password?.trim()) {
      res.status(400).json({ error: "Tous les champs obligatoires doivent etre renseignes." });
      return;
    }

    if (password.trim().length < 8) {
      res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caracteres." });
      return;
    }

    const client = await pool.connect();

    try {
      const invitation = await getInvitationByToken(req.params.token);

      if (!invitation) {
        res.status(404).json({ error: "Invitation introuvable." });
        return;
      }

      if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
        res.status(410).json({ error: "Cette invitation a expire." });
        return;
      }

      await client.query("BEGIN");

      const [existingEmail, existingUserName] = await Promise.all([
        client.query<{ id: number }>("SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1", [invitation.email]),
        client.query<{ id: number }>("SELECT id FROM users WHERE LOWER(user_name) = LOWER($1) LIMIT 1", [userName.trim()]),
      ]);

      if (existingEmail.rows[0]) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "Cet email est deja utilise." });
        return;
      }

      if (existingUserName.rows[0]) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "Ce nom d'utilisateur est deja utilise." });
        return;
      }

      const activeStatusId = await ensureStatus("ACTIVE", "Actif");
      const passwordHash = createPasswordHash(password.trim());

      const insertedUser = await client.query<{ id: number }>(
        `
        INSERT INTO users (
          user_name,
          first_name,
          last_name,
          email,
          phone_number,
          id_user_keycloak,
          is_local,
          password_hash,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, NOW(), NOW())
        RETURNING id
      `,
        [
          userName.trim(),
          firstName.trim(),
          lastName.trim(),
          invitation.email,
          phoneNumber?.trim() || null,
          `local-${crypto.randomUUID()}`,
          passwordHash,
        ]
      );

      await client.query(
        `
        UPDATE membership
        SET
          user_id = $1,
          status_id = $2,
          invitation_token = NULL,
          invitation_accepted_at = NOW()
        WHERE id = $3
      `,
        [insertedUser.rows[0].id, activeStatusId, invitation.membershipId]
      );

      if (invitation.roleId) {
        await client.query(
          `
          INSERT INTO user_mission (membership_id, groupe_id, role_id)
          VALUES ($1, $2, $3)
          ON CONFLICT (membership_id, groupe_id, role_id) DO NOTHING
        `,
          [invitation.membershipId, invitation.groupId, invitation.roleId]
        );
      }

      await client.query("COMMIT");

      res.status(201).json({
        message: "Invitation acceptee. Le compte a ete cree avec succes.",
      });
    } catch (err) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: (err as Error).message });
    } finally {
      client.release();
    }
  });

  app.put("/api/contacts/:id", async (req, res) => {
    const { name, phone, email, tags } = req.body;
    const currentPhone = req.params.id;
    const nextPhone = phone || currentPhone;
    const tagList = Array.isArray(tags) ? tags.join(", ") : "";
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        "INSERT INTO contacts (msisdn, country_code) VALUES ($1, NULL) ON CONFLICT (msisdn) DO NOTHING",
        [nextPhone]
      );

      if (nextPhone !== currentPhone) {
        await client.query("UPDATE user_contact SET contact_id = $1 WHERE contact_id = $2", [nextPhone, currentPhone]);
        await client.query("DELETE FROM contacts WHERE msisdn = $1", [currentPhone]);
      }

      let result = await client.query<ContactApiRow>(
        `
        UPDATE user_contact
        SET attribute1 = $1, attribute2 = $2, attribute3 = $3, date_modified = NOW()
        WHERE id = (
          SELECT id
          FROM user_contact
          WHERE contact_id = $4
          ORDER BY id DESC
          LIMIT 1
        )
        RETURNING
          contact_id AS id,
          attribute1 AS name,
          contact_id AS phone,
          attribute2 AS email,
          attribute3 AS tags,
          date_modified AS "lastActive"
      `,
        [name, email, tagList, nextPhone]
      );

      if (result.rows.length === 0) {
        result = await client.query<ContactApiRow>(
          `
          INSERT INTO user_contact (contact_id, attribute1, attribute2, attribute3, date_created, date_modified)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          RETURNING
            contact_id AS id,
            attribute1 AS name,
            contact_id AS phone,
            attribute2 AS email,
            attribute3 AS tags,
            date_modified AS "lastActive"
        `,
          [nextPhone, name, email, tagList]
        );
      }

      await client.query("COMMIT");
      res.json(mapContactRow(result.rows[0]));
    } catch (err) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: (err as Error).message });
    } finally {
      client.release();
    }
  });

  // Groups Update
  app.put("/api/groups/:id", async (req, res) => {
    const { name, description, budget, status, type, selectedUsers } = req.body;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const statusId = await ensureStatus(status === 'active' ? 'ACTIVE' : 'INACTIVE', status === 'active' ? 'Actif' : 'Inactif');
      
      const result = await client.query(
        "UPDATE groupe SET name = $1, description = $2, quota = $3, status_id = $4, type = $5, updated_at = NOW() WHERE id = $6 RETURNING *",
        [name, description, budget, statusId, type || 'Classique', req.params.id]
      );
      
      if (Array.isArray(selectedUsers)) {
         await client.query("DELETE FROM user_mission WHERE groupe_id = $1", [req.params.id]);
         if (selectedUsers.length > 0) {
           const orgId = await ensureOrganization();
           const agentRoleId = await ensureRole("Agent");
           for (const userId of selectedUsers) {
              let memberRes = await client.query("SELECT id FROM membership WHERE user_id = $1 AND organization_id = $2 LIMIT 1", [userId, orgId]);
              let membershipId;
              
              if (memberRes.rows.length === 0) {
                 const activeStatusId = await ensureStatus("ACTIVE", "Actif");
                 const newMember = await client.query(
                   "INSERT INTO membership (user_id, organization_id, status_id) VALUES ($1, $2, $3) RETURNING id",
                   [userId, orgId, activeStatusId]
                 );
                 membershipId = newMember.rows[0].id;
              } else {
                 membershipId = memberRes.rows[0].id;
              }
              
              await client.query(
                "INSERT INTO user_mission (membership_id, groupe_id, role_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
                [membershipId, req.params.id, agentRoleId]
              );
           }
         }
      }
      
      await client.query("COMMIT");
      res.json({
        ...result.rows[0],
        budget: result.rows[0].quota,
        users_count: Array.isArray(selectedUsers) ? selectedUsers.length : 0,
        status
      });
    } catch (err) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: (err as Error).message });
    } finally {
      client.release();
    }
  });

  // Templates Update
  app.put("/api/templates/:id", async (req, res) => {
    const { name, type, content, status } = req.body;
    try {
      const templateTypeCode = await ensureTemplateType(type);
      const result = await pool.query<TemplateApiRow>(
        `
        UPDATE modele
        SET libelle = $1, campaign_type = $2, message = $3, status = $4
        WHERE id = $5
        RETURNING
          id,
          libelle AS name,
          $6::text AS type,
          message AS content,
          status
      `,
        [name, templateTypeCode, content, status, req.params.id, getTemplateTypeConfig(type).label]
      );

      if (!result.rows[0]) {
        res.status(404).json({ error: "Modele introuvable" });
        return;
      }

      res.json(mapTemplateRow(result.rows[0]));
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Campaigns Update (e.g. status)
  app.put("/api/campaigns/:id", async (req, res) => {
    const { status } = req.body;
    try {
      const result = await pool.query(
        "UPDATE campaigns SET status = $1 WHERE id = $2 RETURNING *",
        [status, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/groups/:id", async (req, res) => {
    try {
      await pool.query("DELETE FROM user_mission WHERE groupe_id = $1", [req.params.id]);
      await pool.query("DELETE FROM groupe WHERE id = $1", [req.params.id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    try {
      await pool.query("DELETE FROM modele WHERE id = $1", [req.params.id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/campaigns/:id", async (req, res) => {
    try {
      await pool.query("DELETE FROM campagne WHERE id = $1", [req.params.id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Groups Endpoints
  app.get("/api/groups", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          g.id, 
          g.name, 
          g.description, 
          g.type, 
          g.quota AS budget, 
          ps.code AS status,
          (SELECT COUNT(*) FROM user_mission WHERE groupe_id = g.id) AS users_count
        FROM groupe g
        LEFT JOIN prm_status ps ON ps.id = g.status_id
        ORDER BY g.id DESC
      `);
      
      const mappedRows = result.rows.map(row => ({
        ...row,
        status: row.status?.toLowerCase() === 'active' ? 'active' : 'inactive'
      }));
      res.json(mappedRows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/groups", async (req, res) => {
    const { name, description, selectedUsers, type, budget, status } = req.body;
    const client = await pool.connect();
    
    try {
      await client.query("BEGIN");
      
      const statusId = await ensureStatus(status === 'active' ? 'ACTIVE' : 'INACTIVE', status === 'active' ? 'Actif' : 'Inactif');
      const orgId = await ensureOrganization();
      
      const result = await client.query(
        "INSERT INTO groupe (name, description, type, quota, status_id, organization_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *",
        [name, description, type || 'Classique', budget || 0, statusId, orgId]
      );
      
      const newGroupId = result.rows[0].id;
      
      if (Array.isArray(selectedUsers) && selectedUsers.length > 0) {
        const agentRoleId = await ensureRole("Agent");
        for (const userId of selectedUsers) {
          // Link user to group. A membership might need to be created if not exists, but for simplicity we assume the user has a membership,
          // or we create a basic membership and user_mission.
          // Check if membership exists for this user and organization
          let memberRes = await client.query("SELECT id FROM membership WHERE user_id = $1 AND organization_id = $2 LIMIT 1", [userId, orgId]);
          let membershipId;
          
          if (memberRes.rows.length === 0) {
             const activeStatusId = await ensureStatus("ACTIVE", "Actif");
             const newMember = await client.query(
               "INSERT INTO membership (user_id, organization_id, status_id) VALUES ($1, $2, $3) RETURNING id",
               [userId, orgId, activeStatusId]
             );
             membershipId = newMember.rows[0].id;
          } else {
             membershipId = memberRes.rows[0].id;
          }
          
          await client.query(
            "INSERT INTO user_mission (membership_id, groupe_id, role_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
            [membershipId, newGroupId, agentRoleId]
          );
        }
      }
      
      await client.query("COMMIT");
      res.status(201).json({
        ...result.rows[0],
        budget: result.rows[0].quota,
        users_count: Array.isArray(selectedUsers) ? selectedUsers.length : 0,
        status
      });
    } catch (err) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: (err as Error).message });
    } finally {
      client.release();
    }
  });

  // Templates Endpoints
  app.get("/api/templates", async (req, res) => {
    try {
      const result = await pool.query<TemplateApiRow>(`
        SELECT
          m.id,
          m.libelle AS name,
          COALESCE(pct.value, m.campaign_type) AS type,
          m.message AS content,
          m.status
        FROM modele m
        LEFT JOIN prm_campaign_type pct ON pct.code = m.campaign_type
        ORDER BY m.id DESC
      `);
      res.json(result.rows.map(mapTemplateRow));
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/templates", async (req, res) => {
    const { name, type, content, status } = req.body;
    try {
      const templateTypeCode = await ensureTemplateType(type);
      const result = await pool.query<TemplateApiRow>(
        `
        INSERT INTO modele (libelle, campaign_type, message, status, temporary)
        VALUES ($1, $2, $3, $4, FALSE)
        RETURNING
          id,
          libelle AS name,
          $5::text AS type,
          message AS content,
          status
      `,
        [name, templateTypeCode, content, status, getTemplateTypeConfig(type).label]
      );
      res.status(201).json(mapTemplateRow(result.rows[0]));
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Dashboard Endpoints
  app.get("/api/dashboard", async (req, res) => {
    try {
      // 1. Quota Restant (Sum of all organization quotas for now)
      const quotaResult = await pool.query("SELECT COALESCE(SUM(quota), 0) AS total_quota FROM organization");
      const quotaRestant = parseInt(quotaResult.rows[0].total_quota);

      // 2. Campagnes Actives (Status ACTIVE or IN PROGRESS)
      const activeCampResult = await pool.query(`
        SELECT COUNT(*) AS active_count 
        FROM campagne c
        JOIN prm_status ps ON ps.id = c.status_id
        WHERE ps.code IN ('ACTIVE', 'EN COURS')
      `);
      const campagnesActives = parseInt(activeCampResult.rows[0].active_count);

      // 3. Primary Stats (Sms envoyés, Total contacts, Budget consommé)
      const statsResult = await pool.query(`
        SELECT 
          COALESCE(SUM(count_contact), 0) AS sms_envoyes,
          COALESCE(SUM(budget_used), 0) AS budget_consomme
        FROM campagne
      `);
      const smsEnvoyes = parseInt(statsResult.rows[0].sms_envoyes);
      const budgetConsomme = parseInt(statsResult.rows[0].budget_consomme);

      const contactsResult = await pool.query("SELECT COUNT(*) AS total_contacts FROM contacts");
      const totalContacts = parseInt(contactsResult.rows[0].total_contacts);

      // Taux de livraison (Simulated based on successful campaigns or mock 96.4% if 0)
      const tauxLivraison = smsEnvoyes > 0 ? "96.4%" : "0%";

      // 4. Budget Distribution by Group
      const budgetDistResult = await pool.query(`
        SELECT g.name, COALESCE(SUM(c.budget_used), g.quota) AS value 
        FROM groupe g
        LEFT JOIN campagne c ON c.groupe_id = g.id
        GROUP BY g.name, g.quota
        HAVING COALESCE(SUM(c.budget_used), g.quota) > 0
      `);
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
      const budgetDistribution = budgetDistResult.rows.map((row, idx) => ({
        name: row.name,
        value: parseInt(row.value),
        color: colors[idx % colors.length]
      }));

      // 5. Daily Stats (Last 7 days mock or calculated)
      // Since it's complex to generate a full 7-day series in pure SQL without generate_series, 
      // we'll return a basic structure. Ideally, we'd query:
      const dailyStatsResult = await pool.query(`
        SELECT 
          TO_CHAR(date_debut, 'Dy') as day,
          COALESCE(SUM(count_contact), 0) as sent
        FROM campagne
        WHERE date_debut >= NOW() - INTERVAL '7 days'
        GROUP BY TO_CHAR(date_debut, 'Dy'), date_debut::date
        ORDER BY date_debut::date ASC
      `);
      
      let dailyStats = dailyStatsResult.rows.map(r => ({
        day: r.day,
        sent: parseInt(r.sent),
        delivered: Math.floor(parseInt(r.sent) * 0.95) // Fake delivery rate
      }));

      // If empty, provide a fallback structure
      if (dailyStats.length === 0) {
        dailyStats = [
          { day: 'Lun', sent: 0, delivered: 0 },
          { day: 'Mar', sent: 0, delivered: 0 },
          { day: 'Mer', sent: 0, delivered: 0 },
          { day: 'Jeu', sent: 0, delivered: 0 },
          { day: 'Ven', sent: 0, delivered: 0 },
          { day: 'Sam', sent: 0, delivered: 0 },
          { day: 'Dim', sent: 0, delivered: 0 },
        ];
      }

      res.json({
        topStats: {
          quotaRestant,
          campagnesActives
        },
        primaryStats: {
          smsEnvoyes,
          totalContacts,
          budgetConsomme,
          tauxLivraison
        },
        budgetDistribution,
        dailyStats
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Campaigns Endpoints
  app.get("/api/campaigns", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          c.id, 
          c.libelle AS name, 
          pct.value AS type, 
          ps.value AS status, 
          c.date_debut AS start_date, 
          c.count_contact AS contacts_count, 
          c.count_contact AS delivered_count, 
          g.name AS group_name
        FROM campagne c
        LEFT JOIN prm_status ps ON ps.id = c.status_id
        LEFT JOIN groupe g ON g.id = c.groupe_id
        LEFT JOIN modele m ON m.id = c.modele_id
        LEFT JOIN prm_campaign_type pct ON pct.code = m.campaign_type
        ORDER BY c.id DESC
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    const { name, type, status, start_date, contacts_count, delivered_count, group_id, modele_id } = req.body;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const statusId = await ensureStatus(
        status === 'Planifiée' ? 'SCHEDULED' : status === 'À valider' ? 'PENDING' : 'ACTIVE', 
        status
      );

      const result = await client.query(
        "INSERT INTO campagne (libelle, hash, status_id, date_debut, count_contact, groupe_id, modele_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *",
        [name, crypto.randomBytes(16).toString("hex"), statusId, start_date, contacts_count || 0, group_id || null, modele_id || null]
      );
      await client.query("COMMIT");
      
      // Return a mapped object so frontend can display immediately
      const inserted = result.rows[0];
      res.status(201).json({
        id: inserted.id,
        name: inserted.libelle,
        type: type,
        status: status,
        start_date: inserted.date_debut,
        contacts_count: inserted.count_contact,
        delivered_count: inserted.count_contact,
        group_name: '' // The frontend will refetch anyway
      });
    } catch (err) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: (err as Error).message });
    } finally {
      client.release();
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
