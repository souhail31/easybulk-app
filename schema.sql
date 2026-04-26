-- Easy Bulk Database Schema
-- Generated from basecomplet.txt metadata

CREATE TABLE prm_status (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) NOT NULL UNIQUE,
    value VARCHAR(255),
    type VARCHAR(255) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE prm_campaign_type (
    code VARCHAR(255) PRIMARY KEY,
    value VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE organization (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE,
    description VARCHAR(255),
    quota BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(50),
    id_user_keycloak VARCHAR(255) NOT NULL UNIQUE,
    is_local BOOLEAN DEFAULT TRUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE role (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    value VARCHAR(255)
);

CREATE TABLE membership (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    organization_id INTEGER NOT NULL REFERENCES organization(id),
    status_id INTEGER NOT NULL REFERENCES prm_status(id),
    invitation_email VARCHAR(255),
    invitation_name VARCHAR(255),
    invitation_token VARCHAR(255),
    invitation_role_id INTEGER REFERENCES role(id),
    invitation_group_id INTEGER REFERENCES groupe(id),
    invited_at TIMESTAMP,
    invitation_expires_at TIMESTAMP,
    invitation_accepted_at TIMESTAMP,
    CONSTRAINT uk_user_org UNIQUE (user_id, organization_id)
);

CREATE TABLE groupe (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    quota BIGINT NOT NULL DEFAULT 0,
    quota_free BIGINT DEFAULT 0,
    quota_loked BIGINT DEFAULT 0,
    admin_id INTEGER REFERENCES users(id),
    organization_id INTEGER NOT NULL REFERENCES organization(id),
    status_id INTEGER NOT NULL REFERENCES prm_status(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT uk_groupe_org UNIQUE (name, organization_id)
);

CREATE TABLE user_mission (
    id BIGSERIAL PRIMARY KEY,
    membership_id BIGINT NOT NULL REFERENCES membership(id),
    groupe_id INTEGER REFERENCES groupe(id),
    role_id INTEGER NOT NULL REFERENCES role(id),
    CONSTRAINT uk_mission UNIQUE (membership_id, groupe_id, role_id)
);

CREATE TABLE contacts (
    msisdn VARCHAR(255) PRIMARY KEY,
    country_code VARCHAR(255)
);

CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    label VARCHAR(255),
    color VARCHAR(255),
    membership_id BIGINT REFERENCES membership(id),
    CONSTRAINT uk_tag_member UNIQUE (label, membership_id)
);

CREATE TABLE user_contact (
    id BIGSERIAL PRIMARY KEY,
    contact_id VARCHAR(255) REFERENCES contacts(msisdn),
    membership_id BIGINT REFERENCES membership(id),
    attribute1 VARCHAR(255),
    attribute2 VARCHAR(255),
    attribute3 VARCHAR(255),
    date_created TIMESTAMP,
    date_modified TIMESTAMP,
    CONSTRAINT uk_contact_member UNIQUE (contact_id, membership_id)
);

CREATE TABLE user_contact_tags (
    user_contact_id BIGINT NOT NULL REFERENCES user_contact(id),
    tag_id BIGINT NOT NULL REFERENCES tags(id),
    PRIMARY KEY (user_contact_id, tag_id)
);

CREATE TABLE modele (
    id BIGSERIAL PRIMARY KEY,
    libelle VARCHAR(255) NOT NULL,
    message TEXT,
    campaign_type VARCHAR(255) REFERENCES prm_campaign_type(code),
    membership_id BIGINT REFERENCES membership(id),
    status BOOLEAN NOT NULL DEFAULT TRUE,
    temporary BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uk_modele_member UNIQUE (libelle, membership_id)
);

CREATE TABLE campaign_schedule (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) NOT NULL UNIQUE,
    day_start TIME NOT NULL,
    day_end TIME NOT NULL,
    weekend BOOLEAN DEFAULT FALSE
);

CREATE TABLE expediteur (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(255),
    status BOOLEAN NOT NULL DEFAULT TRUE,
    organization_id INTEGER NOT NULL REFERENCES organization(id)
);

CREATE TABLE campagne (
    id BIGSERIAL PRIMARY KEY,
    libelle VARCHAR(255),
    description VARCHAR(255),
    hash VARCHAR(255) NOT NULL,
    campaign_type_permission_id BIGINT,
    status_id INTEGER NOT NULL REFERENCES prm_status(id),
    user_id INTEGER REFERENCES users(id),
    modele_id BIGINT REFERENCES modele(id),
    expediteur_id BIGINT REFERENCES expediteur(id),
    schedule_id INTEGER REFERENCES campaign_schedule(id),
    date_debut TIMESTAMP WITH TIME ZONE,
    date_fin TIMESTAMP WITH TIME ZONE,
    count_contact BIGINT DEFAULT 0,
    budget_used BIGINT DEFAULT 0,
    cost BIGINT DEFAULT 0,
    dure_validite INTEGER,
    nbr_page INTEGER,
    me_only BOOLEAN DEFAULT FALSE,
    deactivated_by_group BOOLEAN DEFAULT FALSE,
    last_updated_status_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE campagne_contacts (
    campagne_id BIGINT NOT NULL REFERENCES campagne(id),
    contact_id BIGINT NOT NULL,
    PRIMARY KEY (campagne_id, contact_id)
);

CREATE TABLE user_keys (
    id BIGSERIAL PRIMARY KEY,
    key_name VARCHAR(255),
    key_value VARCHAR(255) UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    membership_id BIGINT REFERENCES membership(id),
    generated_date DATE,
    expiration_date DATE,
    last_time_used_date DATE,
    CONSTRAINT uk_key_member UNIQUE (key_name, membership_id)
);

CREATE TABLE budget_history (
    id SERIAL PRIMARY KEY,
    amount BIGINT,
    modification_date DATE,
    groupe_id INTEGER REFERENCES groupe(id),
    status_id INTEGER NOT NULL REFERENCES prm_status(id)
);
