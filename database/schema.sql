-- ============================================================
--  DRRO — Disaster Resource Response Optimizer
--  Database Schema — PostgreSQL (Supabase)
--  Run this entire file in: Supabase Dashboard → SQL Editor
--  Order: ENUMs → Trigger Function → Tables → Seed Data
-- ============================================================

-- ============================================================
-- STEP 1: ENUM TYPES
-- ============================================================

CREATE TYPE user_status        AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE disaster_type      AS ENUM ('FLOOD','EARTHQUAKE','CYCLONE','LANDSLIDE','WILDFIRE','OTHER');
CREATE TYPE disaster_status    AS ENUM ('ACTIVE','CONTAINED','RECOVERING','CLOSED');
CREATE TYPE accessibility_type AS ENUM ('ACCESSIBLE','DIFFICULT','BLOCKED');
CREATE TYPE fulfillment_status AS ENUM ('PENDING','PARTIAL','FULFILLED');
CREATE TYPE resource_category  AS ENUM ('FOOD','WATER','MEDICINE','EQUIPMENT','VEHICLE','PERSONNEL','SHELTER','OTHER');
CREATE TYPE center_status      AS ENUM ('ACTIVE','INACTIVE');
CREATE TYPE urgency_level      AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');
CREATE TYPE request_status     AS ENUM ('PENDING','VERIFIED','ALLOCATED','PARTIALLY_FULFILLED','FULFILLED','ESCALATED','CLOSED');
CREATE TYPE item_status        AS ENUM ('OPEN','PARTIAL','FULFILLED');
CREATE TYPE allocation_status  AS ENUM ('RECOMMENDED','APPROVED','REJECTED','MODIFIED','DISPATCHED','DELIVERED');
CREATE TYPE team_availability  AS ENUM ('AVAILABLE','DEPLOYED','OFF_DUTY');
CREATE TYPE assignment_status  AS ENUM ('ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED');
CREATE TYPE dispatch_status    AS ENUM ('CREATED','IN_TRANSIT','DELIVERED','FAILED');

-- ============================================================
-- STEP 2: AUTO-UPDATE TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================
-- STEP 3: TABLES
-- ============================================================

-- Table 1: roles
CREATE TABLE roles (
    role_id   BIGSERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

-- Table 2: users
CREATE TABLE users (
    user_id       BIGSERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id       BIGINT NOT NULL REFERENCES roles(role_id),
    status        user_status DEFAULT 'ACTIVE',
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table 3: disasters
CREATE TABLE disasters (
    disaster_id  BIGSERIAL PRIMARY KEY,
    title        VARCHAR(200) NOT NULL,
    type         disaster_type NOT NULL,
    severity     INT NOT NULL CHECK (severity BETWEEN 1 AND 100),
    start_time   TIMESTAMPTZ NOT NULL,
    end_time     TIMESTAMPTZ,
    latitude     NUMERIC(10,7),
    longitude    NUMERIC(10,7),
    description  TEXT,
    status       disaster_status DEFAULT 'ACTIVE',
    created_by   BIGINT REFERENCES users(user_id),
    created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER disasters_updated_at
    BEFORE UPDATE ON disasters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table 4: locations (Affected Locations)
CREATE TABLE locations (
    location_id          BIGSERIAL PRIMARY KEY,
    disaster_id          BIGINT NOT NULL REFERENCES disasters(disaster_id),
    name                 VARCHAR(200) NOT NULL,
    latitude             NUMERIC(10,7) NOT NULL,
    longitude            NUMERIC(10,7) NOT NULL,
    population_affected  INT DEFAULT 0,
    vulnerability_score  INT DEFAULT 0 CHECK (vulnerability_score BETWEEN 0 AND 100),
    severity_score       INT DEFAULT 0 CHECK (severity_score BETWEEN 0 AND 100),
    accessibility        accessibility_type DEFAULT 'ACCESSIBLE',
    open_request_count   INT DEFAULT 0,
    fulfillment_status   fulfillment_status DEFAULT 'PENDING',
    notes                TEXT,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table 5: resource_types
CREATE TABLE resource_types (
    resource_type_id BIGSERIAL PRIMARY KEY,
    name             VARCHAR(100) NOT NULL,
    unit             VARCHAR(50)  NOT NULL,
    category         resource_category NOT NULL,
    perishable       BOOLEAN DEFAULT FALSE,
    description      TEXT
);

-- Table 6: resource_centers
CREATE TABLE resource_centers (
    center_id   BIGSERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    latitude    NUMERIC(10,7) NOT NULL,
    longitude   NUMERIC(10,7) NOT NULL,
    address     VARCHAR(255),
    contact     VARCHAR(100),
    status      center_status DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table 7: inventory
CREATE TABLE inventory (
    inventory_id     BIGSERIAL PRIMARY KEY,
    center_id        BIGINT NOT NULL REFERENCES resource_centers(center_id),
    resource_type_id BIGINT NOT NULL REFERENCES resource_types(resource_type_id),
    available_qty    NUMERIC(12,2) DEFAULT 0,
    reserved_qty     NUMERIC(12,2) DEFAULT 0,
    dispatched_qty   NUMERIC(12,2) DEFAULT 0,
    delivered_qty    NUMERIC(12,2) DEFAULT 0,
    min_stock_level  NUMERIC(12,2) DEFAULT 0,
    expiry_date      DATE,
    last_updated     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_center_resource UNIQUE (center_id, resource_type_id)
);

CREATE OR REPLACE FUNCTION update_inventory_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER inventory_last_updated
    BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_inventory_last_updated();

-- Table 8: relief_requests
CREATE TABLE relief_requests (
    request_id  BIGSERIAL PRIMARY KEY,
    disaster_id BIGINT NOT NULL REFERENCES disasters(disaster_id),
    location_id BIGINT NOT NULL REFERENCES locations(location_id),
    urgency     urgency_level NOT NULL,
    deadline    TIMESTAMPTZ,
    status      request_status DEFAULT 'PENDING',
    created_by  BIGINT REFERENCES users(user_id),
    verified_by BIGINT REFERENCES users(user_id),
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    notes       TEXT
);

CREATE TRIGGER relief_requests_updated_at
    BEFORE UPDATE ON relief_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table 9: request_items
CREATE TABLE request_items (
    request_item_id  BIGSERIAL PRIMARY KEY,
    request_id       BIGINT NOT NULL REFERENCES relief_requests(request_id),
    resource_type_id BIGINT NOT NULL REFERENCES resource_types(resource_type_id),
    required_qty     NUMERIC(12,2) NOT NULL,
    fulfilled_qty    NUMERIC(12,2) DEFAULT 0,
    unmet_qty        NUMERIC(12,2) GENERATED ALWAYS AS (required_qty - fulfilled_qty) STORED,
    priority_score   NUMERIC(5,2),
    status           item_status DEFAULT 'OPEN'
);

-- Table 10: allocations
CREATE TABLE allocations (
    allocation_id   BIGSERIAL PRIMARY KEY,
    request_item_id BIGINT NOT NULL REFERENCES request_items(request_item_id),
    center_id       BIGINT NOT NULL REFERENCES resource_centers(center_id),
    allocated_qty   NUMERIC(12,2) NOT NULL,
    priority_score  NUMERIC(5,2),
    status          allocation_status DEFAULT 'RECOMMENDED',
    recommended_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    approved_by     BIGINT REFERENCES users(user_id),
    approved_at     TIMESTAMPTZ,
    notes           TEXT
);

-- Table 11: allocation_factors (Explainability)
CREATE TABLE allocation_factors (
    factor_id            BIGSERIAL PRIMARY KEY,
    allocation_id        BIGINT NOT NULL UNIQUE REFERENCES allocations(allocation_id),
    severity_score       NUMERIC(5,2),
    population_score     NUMERIC(5,2),
    urgency_score        NUMERIC(5,2),
    shortage_score       NUMERIC(5,2),
    travel_time_score    NUMERIC(5,2),
    vulnerability_score  NUMERIC(5,2),
    final_score          NUMERIC(5,2),
    distance_km          NUMERIC(8,2),
    estimated_travel_hrs NUMERIC(6,2),
    explanation_text     TEXT
);

-- Table 12: response_teams
CREATE TABLE response_teams (
    team_id      BIGSERIAL PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    skills       TEXT,
    latitude     NUMERIC(10,7),
    longitude    NUMERIC(10,7),
    availability team_availability DEFAULT 'AVAILABLE',
    contact      VARCHAR(100),
    created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table 13: team_assignments
CREATE TABLE team_assignments (
    assignment_id BIGSERIAL PRIMARY KEY,
    team_id       BIGINT NOT NULL REFERENCES response_teams(team_id),
    disaster_id   BIGINT REFERENCES disasters(disaster_id),
    location_id   BIGINT REFERENCES locations(location_id),
    assigned_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at  TIMESTAMPTZ,
    status        assignment_status DEFAULT 'ASSIGNED',
    notes         TEXT
);

-- Table 14: dispatches
CREATE TABLE dispatches (
    dispatch_id       BIGSERIAL PRIMARY KEY,
    allocation_id     BIGINT NOT NULL REFERENCES allocations(allocation_id),
    team_id           BIGINT REFERENCES response_teams(team_id),
    vehicle_info      VARCHAR(200),
    dispatched_at     TIMESTAMPTZ,
    estimated_arrival TIMESTAMPTZ,
    actual_arrival    TIMESTAMPTZ,
    delivered_qty     NUMERIC(12,2) DEFAULT 0,
    status            dispatch_status DEFAULT 'CREATED',
    created_by        BIGINT REFERENCES users(user_id),
    notes             TEXT
);

-- Table 15: audit_logs
CREATE TABLE audit_logs (
    log_id     BIGSERIAL PRIMARY KEY,
    user_id    BIGINT REFERENCES users(user_id),
    action     VARCHAR(100) NOT NULL,
    entity     VARCHAR(100),
    entity_id  BIGINT,
    old_value  TEXT,
    new_value  TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table 16: weight_config
CREATE TABLE weight_config (
    config_id            BIGSERIAL PRIMARY KEY,
    config_name          VARCHAR(100) NOT NULL,
    weight_severity      NUMERIC(4,2) DEFAULT 0.25,
    weight_population    NUMERIC(4,2) DEFAULT 0.20,
    weight_urgency       NUMERIC(4,2) DEFAULT 0.20,
    weight_shortage      NUMERIC(4,2) DEFAULT 0.20,
    weight_travel        NUMERIC(4,2) DEFAULT 0.10,
    weight_vulnerability NUMERIC(4,2) DEFAULT 0.05,
    is_active            BOOLEAN DEFAULT FALSE,
    created_by           BIGINT REFERENCES users(user_id),
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- STEP 4: SEED DATA
-- ============================================================

-- Default Roles
INSERT INTO roles (role_name) VALUES
    ('ADMIN'),
    ('OFFICER'),
    ('RESOURCE_MANAGER'),
    ('COORDINATOR'),
    ('FIELD_OPERATOR'),
    ('VIEWER');

-- Default Weight Configuration
INSERT INTO weight_config (config_name, is_active,
    weight_severity, weight_population, weight_urgency,
    weight_shortage, weight_travel, weight_vulnerability)
VALUES ('Default DRRO Weights', TRUE, 0.25, 0.20, 0.20, 0.20, 0.10, 0.05);

-- Default Admin User (password: Admin@123 — CHANGE THIS IMMEDIATELY)
-- BCrypt hash of 'Admin@123'
INSERT INTO users (name, email, password_hash, role_id, status)
VALUES (
    'System Admin',
    'admin@drro.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCKzGMRjwjBhkEjGOQX0iEi',
    (SELECT role_id FROM roles WHERE role_name = 'ADMIN'),
    'ACTIVE'
);

-- Sample Resource Types
INSERT INTO resource_types (name, unit, category, perishable) VALUES
    ('Drinking Water',      'Litres',  'WATER',     FALSE),
    ('Rice',                'Kg',      'FOOD',       TRUE),
    ('Ready Meals',         'Packets', 'FOOD',       TRUE),
    ('First Aid Kit',       'Units',   'MEDICINE',   FALSE),
    ('Medicines - General', 'Units',   'MEDICINE',   TRUE),
    ('Rescue Tent',         'Units',   'SHELTER',    FALSE),
    ('Blankets',            'Units',   'SHELTER',    FALSE),
    ('Life Jackets',        'Units',   'EQUIPMENT',  FALSE),
    ('Generator',           'Units',   'EQUIPMENT',  FALSE),
    ('Rescue Vehicle',      'Units',   'VEHICLE',    FALSE);

-- ============================================================
-- SCHEMA COMPLETE
-- ============================================================
-- Tables Created: roles, users, disasters, locations,
--   resource_types, resource_centers, inventory,
--   relief_requests, request_items, allocations,
--   allocation_factors, response_teams, team_assignments,
--   dispatches, audit_logs, weight_config
-- ============================================================
