# 🚨 Disaster Resource Response Optimizer (DRRO)
### Complete Project Blueprint — Final Year Project

> **Stack:** React.js · Spring Boot · Supabase (PostgreSQL)  
> **Target Completion:** 30 September 2026  
> **Type:** Web-Based Decision-Support System

---

## 📑 Table of Contents

1. [Project Summary](#1-project-summary)
2. [Functional Requirements](#2-functional-requirements)
3. [Non-Functional Requirements](#3-non-functional-requirements)
4. [Technology Stack & Tools](#4-technology-stack--tools)
5. [System Architecture](#5-system-architecture)
6. [Database Design — All Tables](#6-database-design--all-tables)
7. [Backend Package Structure](#7-backend-package-structure)
8. [Frontend Structure](#8-frontend-structure)
9. [All Modules & Functionality](#9-all-modules--functionality)
10. [Allocation Engine — Core Logic](#10-allocation-engine--core-logic)
11. [API Endpoints Reference](#11-api-endpoints-reference)
12. [Dashboard Design](#12-dashboard-design)
13. [All Screens / Pages](#13-all-screens--pages)
14. [User Roles & Permissions](#14-user-roles--permissions)
15. [Security Design](#15-security-design)
16. [Baseline Algorithms for Comparison](#16-baseline-algorithms-for-comparison)
17. [Evaluation Metrics](#17-evaluation-metrics)
18. [Testing Strategy](#18-testing-strategy)
19. [Implementation Roadmap](#19-implementation-roadmap)
20. [MVP Checklist](#20-mvp-checklist)
21. [Development Order](#21-development-order)
22. [Future Enhancements](#22-future-enhancements)

---

## 1. Project Summary

**DRRO** is a web-based decision-support platform that helps disaster-response organizations allocate limited emergency resources (food, water, medicines, rescue equipment, vehicles, shelters, personnel) to affected locations more efficiently.

The central feature is an **Explainable Allocation Engine** that:
- Ranks relief requests using multi-factor priority scoring
- Recommends which resources go where, from which source
- Stores the reasoning behind every recommendation
- Allows an authorized officer to review, approve, modify or reject

> **One-liner:** *"A web-based, explainable decision-support system that dynamically prioritizes disaster relief requests and recommends allocation of limited resources using severity, urgency, affected population, shortage and logistics constraints."*

---

## 2. Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-01 | User can authenticate securely (login/logout) |
| FR-02 | Admin can manage roles and users (create, activate, deactivate) |
| FR-03 | Officer can create and update disaster incidents |
| FR-04 | Officer can register affected locations linked to a disaster |
| FR-05 | Resource Manager can manage resource centers and inventory |
| FR-06 | Officer can create and verify relief requests |
| FR-07 | System calculates a transparent priority score for each request |
| FR-08 | System generates feasible allocation recommendations |
| FR-09 | Officer can approve, reject or modify recommendations |
| FR-10 | System tracks dispatch and delivery status |
| FR-11 | System updates inventory automatically after allocation/delivery |
| FR-12 | System records partial fulfillment and unmet demand |
| FR-13 | System provides dashboards and reports |
| FR-14 | System maintains full audit logs for all important actions |

---

## 3. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Security** | Passwords hashed (BCrypt); role-based access; protected REST APIs |
| **Performance** | Dashboard/API operations respond quickly on project test dataset |
| **Scalability** | DB and allocation service support multiple concurrent requests and resource centers |
| **Reliability** | DB transactions prevent inconsistent inventory updates |
| **Maintainability** | Layered architecture; modular allocation engine |
| **Usability** | Clear forms, status indicators, explainable recommendations |
| **Auditability** | Allocation, approval, dispatch and stock change actions must be traceable |
| **Availability** | Runs on student laptop; optionally cloud-hosted |

---

## 4. Technology Stack & Tools

### Backend
| Tool | Version / Notes |
|------|-----------------|
| Java | JDK 17+ |
| Spring Boot | 3.x |
| Spring Security | JWT-based authentication |
| Spring Data JPA | Hibernate ORM |
| Maven | Build tool |
| MySQL Connector/J | JDBC driver |
| Lombok | Boilerplate reduction |
| MapStruct | DTO ↔ Entity mapping |
| OpenAPI / Swagger | API documentation |

### Frontend
| Tool | Version / Notes |
|------|-----------------|
| React.js | 18+ |
| React Router DOM | Client-side routing |
| Axios | HTTP client |
| React Query | Server state management |
| Recharts / Chart.js | Graphs and analytics |
| Tailwind CSS / CSS Modules | Styling |
| React Hook Form | Form handling |
| Zod / Yup | Form validation |

### Database
| Tool | Notes |
|------|-------|
| Supabase | PostgreSQL 15+ managed cloud database |
| Supabase Dashboard | Schema design, table editor, SQL editor |
| PostgreSQL (via Supabase) | Primary relational database engine |

### DevOps & Tools
| Tool | Notes |
|------|-------|
| Git + GitHub | Version control |
| Postman | API testing |
| IntelliJ IDEA / VS Code | IDEs |
| Docker (optional) | Containerization |
| Apache PDFBox | PDF report generation (pdfbox.jar included) |

### Supabase Integration Notes
| Aspect | Detail |
|--------|--------|
| Connection | JDBC via `postgresql://` connection string from Supabase project settings |
| Spring Boot Driver | `org.postgresql:postgresql` |
| JPA Dialect | `org.hibernate.dialect.PostgreSQLDialect` |
| Supabase URL | `jdbc:postgresql://db.[project-ref].supabase.co:5432/postgres` |
| Auth | Supabase DB password used in `application.properties` (never commit to Git!) |
| SSL | `?sslmode=require` appended to connection URL |

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                  │
│         React.js — Pages, Forms, Dashboards          │
│              Charts, Tables, Status UI               │
└─────────────────────┬───────────────────────────────┘
                      │  HTTP / REST (JSON)
┌─────────────────────▼───────────────────────────────┐
│                    API LAYER                         │
│     Spring Boot REST Controllers (Port 8080)         │
│  Auth · Disasters · Locations · Resources ·          │
│  Requests · Allocation · Teams · Dispatch ·          │
│  Reports · Users                                     │
└──────┬──────────────┬──────────────────┬────────────┘
       │              │                  │
┌──────▼──────┐ ┌─────▼──────┐ ┌────────▼───────────┐
│  BUSINESS   │ │ALLOCATION  │ │   SECURITY LAYER    │
│   LAYER     │ │  ENGINE    │ │ Spring Security/JWT │
│  Services,  │ │  (Scoring, │ │ Role-Based Access   │
│  Validation │ │  Greedy    │ │ Audit Logging       │
│  Workflows  │ │  Allocator)│ └─────────────────────┘
└──────┬──────┘ └─────┬──────┘
       │              │
┌──────▼──────────────▼──────────────────────────────┐
│                   DATA LAYER                         │
│          Spring Data JPA / Hibernate                 │
│      Supabase — PostgreSQL 15 (Cloud-hosted)         │
└─────────────────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────┐
│          EXTERNAL INTEGRATIONS (Optional)            │
│   Map/Routing API · Email/SMS · Weather API          │
└─────────────────────────────────────────────────────┘
```

---

## 6. Database Design — All Tables

> **Note:** All SQL below is **PostgreSQL syntax** compatible with Supabase.  
> Run these in the Supabase **SQL Editor** (Dashboard → SQL Editor → New Query).

### PostgreSQL ENUM Types (Run First)
```sql
-- Run this block ONCE before creating tables
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
```

### Auto-update Trigger Function (Run Once)
```sql
-- Reusable trigger function for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### Table 1: `roles`
```sql
CREATE TABLE roles (
    role_id   BIGSERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
    -- Values: ADMIN, OFFICER, RESOURCE_MANAGER, COORDINATOR, FIELD_OPERATOR, VIEWER
);

INSERT INTO roles (role_name) VALUES
    ('ADMIN'), ('OFFICER'), ('RESOURCE_MANAGER'),
    ('COORDINATOR'), ('FIELD_OPERATOR'), ('VIEWER');
```

### Table 2: `users`
```sql
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
```

### Table 3: `disasters`
```sql
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
```

### Table 4: `locations` (Affected Locations)
```sql
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
```

### Table 5: `resource_types`
```sql
CREATE TABLE resource_types (
    resource_type_id BIGSERIAL PRIMARY KEY,
    name             VARCHAR(100) NOT NULL,
    unit             VARCHAR(50) NOT NULL,   -- e.g., 'litres', 'kg', 'units'
    category         resource_category NOT NULL,
    perishable       BOOLEAN DEFAULT FALSE,
    description      TEXT
);
```

### Table 6: `resource_centers`
```sql
CREATE TABLE resource_centers (
    center_id    BIGSERIAL PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    location_id  BIGINT,                        -- optional link for coordinate reference
    latitude     NUMERIC(10,7) NOT NULL,
    longitude    NUMERIC(10,7) NOT NULL,
    address      VARCHAR(255),
    contact      VARCHAR(100),
    status       center_status DEFAULT 'ACTIVE',
    created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Table 7: `inventory`
```sql
CREATE TABLE inventory (
    inventory_id      BIGSERIAL PRIMARY KEY,
    center_id         BIGINT NOT NULL REFERENCES resource_centers(center_id),
    resource_type_id  BIGINT NOT NULL REFERENCES resource_types(resource_type_id),
    available_qty     NUMERIC(12,2) DEFAULT 0,
    reserved_qty      NUMERIC(12,2) DEFAULT 0,
    dispatched_qty    NUMERIC(12,2) DEFAULT 0,
    delivered_qty     NUMERIC(12,2) DEFAULT 0,
    min_stock_level   NUMERIC(12,2) DEFAULT 0,
    expiry_date       DATE,
    last_updated      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_center_resource UNIQUE (center_id, resource_type_id)
);

CREATE TRIGGER inventory_last_updated
    BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Note: trigger above updates last_updated (reuse the function, mapping updated_at → last_updated via alias)
```

### Table 8: `relief_requests`
```sql
CREATE TABLE relief_requests (
    request_id    BIGSERIAL PRIMARY KEY,
    disaster_id   BIGINT NOT NULL REFERENCES disasters(disaster_id),
    location_id   BIGINT NOT NULL REFERENCES locations(location_id),
    urgency       urgency_level NOT NULL,
    deadline      TIMESTAMPTZ,
    status        request_status DEFAULT 'PENDING',
    created_by    BIGINT REFERENCES users(user_id),
    verified_by   BIGINT REFERENCES users(user_id),
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    notes         TEXT
);

CREATE TRIGGER relief_requests_updated_at
    BEFORE UPDATE ON relief_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Table 9: `request_items`
```sql
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
```

### Table 10: `allocations`
```sql
CREATE TABLE allocations (
    allocation_id    BIGSERIAL PRIMARY KEY,
    request_item_id  BIGINT NOT NULL REFERENCES request_items(request_item_id),
    center_id        BIGINT NOT NULL REFERENCES resource_centers(center_id),
    allocated_qty    NUMERIC(12,2) NOT NULL,
    priority_score   NUMERIC(5,2),
    status           allocation_status DEFAULT 'RECOMMENDED',
    recommended_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    approved_by      BIGINT REFERENCES users(user_id),
    approved_at      TIMESTAMPTZ,
    notes            TEXT
);
```

### Table 11: `allocation_factors` (Explainability)
```sql
CREATE TABLE allocation_factors (
    factor_id             BIGSERIAL PRIMARY KEY,
    allocation_id         BIGINT NOT NULL UNIQUE REFERENCES allocations(allocation_id),
    severity_score        NUMERIC(5,2),
    population_score      NUMERIC(5,2),
    urgency_score         NUMERIC(5,2),
    shortage_score        NUMERIC(5,2),
    travel_time_score     NUMERIC(5,2),
    vulnerability_score   NUMERIC(5,2),
    final_score           NUMERIC(5,2),
    distance_km           NUMERIC(8,2),
    estimated_travel_hrs  NUMERIC(6,2),
    explanation_text      TEXT
);
```

### Table 12: `response_teams`
```sql
CREATE TABLE response_teams (
    team_id       BIGSERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    skills        TEXT,              -- comma-separated or JSON string
    location_id   BIGINT,
    latitude      NUMERIC(10,7),
    longitude     NUMERIC(10,7),
    availability  team_availability DEFAULT 'AVAILABLE',
    contact       VARCHAR(100),
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Table 13: `team_assignments`
```sql
CREATE TABLE team_assignments (
    assignment_id  BIGSERIAL PRIMARY KEY,
    team_id        BIGINT NOT NULL REFERENCES response_teams(team_id),
    disaster_id    BIGINT REFERENCES disasters(disaster_id),
    location_id    BIGINT REFERENCES locations(location_id),
    assigned_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at   TIMESTAMPTZ,
    status         assignment_status DEFAULT 'ASSIGNED',
    notes          TEXT
);
```

### Table 14: `dispatches`
```sql
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
```

### Table 15: `audit_logs`
```sql
CREATE TABLE audit_logs (
    log_id     BIGSERIAL PRIMARY KEY,
    user_id    BIGINT REFERENCES users(user_id),
    action     VARCHAR(100) NOT NULL,   -- e.g. APPROVE_ALLOCATION, UPDATE_INVENTORY
    entity     VARCHAR(100),            -- e.g. allocation, disaster, dispatch
    entity_id  BIGINT,
    old_value  TEXT,
    new_value  TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Table 16: `weight_config` (Configurable priority weights)
```sql
CREATE TABLE weight_config (
    config_id             BIGSERIAL PRIMARY KEY,
    config_name           VARCHAR(100) NOT NULL,
    weight_severity       NUMERIC(4,2) DEFAULT 0.25,
    weight_population     NUMERIC(4,2) DEFAULT 0.20,
    weight_urgency        NUMERIC(4,2) DEFAULT 0.20,
    weight_shortage       NUMERIC(4,2) DEFAULT 0.20,
    weight_travel         NUMERIC(4,2) DEFAULT 0.10,
    weight_vulnerability  NUMERIC(4,2) DEFAULT 0.05,
    is_active             BOOLEAN DEFAULT FALSE,
    created_by            BIGINT REFERENCES users(user_id),
    created_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Default weight configuration
INSERT INTO weight_config (config_name, is_active)
VALUES ('Default DRRO Weights', TRUE);
```

### Entity Relationships Summary
```
users ──< audit_logs
users ──< disasters (created_by)
users ──< relief_requests (created_by, verified_by)
users ──< allocations (approved_by)

disasters ──< locations
disasters ──< relief_requests
disasters ──< team_assignments

locations ──< relief_requests
locations ──< resource_centers

resource_centers ──< inventory
resource_types ──< inventory
resource_types ──< request_items

relief_requests ──< request_items
request_items ──< allocations
allocations ──1── allocation_factors
allocations ──< dispatches

response_teams ──< team_assignments
response_teams ──< dispatches
```

---

## 7. Backend Package Structure

```
com.drro
├── config/
│   ├── SecurityConfig.java
│   ├── JwtConfig.java
│   └── AppConfig.java
├── controller/
│   ├── AuthController.java
│   ├── DisasterController.java
│   ├── LocationController.java
│   ├── ResourceTypeController.java
│   ├── ResourceCenterController.java
│   ├── InventoryController.java
│   ├── ReliefRequestController.java
│   ├── AllocationController.java
│   ├── TeamController.java
│   ├── DispatchController.java
│   ├── ReportController.java
│   └── UserController.java
├── dto/
│   ├── request/         (incoming DTOs)
│   └── response/        (outgoing DTOs)
├── entity/
│   ├── User.java
│   ├── Role.java
│   ├── Disaster.java
│   ├── Location.java
│   ├── ResourceType.java
│   ├── ResourceCenter.java
│   ├── Inventory.java
│   ├── ReliefRequest.java
│   ├── RequestItem.java
│   ├── Allocation.java
│   ├── AllocationFactor.java
│   ├── ResponseTeam.java
│   ├── TeamAssignment.java
│   ├── Dispatch.java
│   ├── AuditLog.java
│   └── WeightConfig.java
├── repository/
│   └── (one interface per entity)
├── service/
│   ├── AuthService.java
│   ├── DisasterService.java
│   ├── LocationService.java
│   ├── InventoryService.java
│   ├── ReliefRequestService.java
│   ├── AllocationService.java
│   ├── TeamService.java
│   ├── DispatchService.java
│   └── ReportService.java
├── allocation/
│   ├── AllocationEngine.java        (interface)
│   ├── GreedyAllocator.java         (primary implementation)
│   ├── PriorityScoreCalculator.java
│   ├── DistanceCalculator.java      (Haversine formula)
│   ├── FeasibilityChecker.java
│   ├── ExplanationGenerator.java
│   └── BaselineAllocators/
│       ├── FcfsAllocator.java
│       ├── SeverityOnlyAllocator.java
│       └── NearestSourceAllocator.java
├── security/
│   ├── JwtTokenProvider.java
│   ├── JwtAuthFilter.java
│   └── UserDetailsServiceImpl.java
├── exception/
│   ├── GlobalExceptionHandler.java
│   ├── ResourceNotFoundException.java
│   └── InsufficientInventoryException.java
├── mapper/
│   └── (MapStruct mappers per entity)
├── util/
│   ├── HaversineUtil.java
│   └── DateUtil.java
└── report/
    ├── MetricsCalculator.java
    └── PdfReportGenerator.java
```

---

## 8. Frontend Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── pages/
│   │   ├── Login/
│   │   ├── Dashboard/
│   │   ├── Disasters/
│   │   │   ├── DisasterList.jsx
│   │   │   ├── DisasterCreate.jsx
│   │   │   └── DisasterDetail.jsx
│   │   ├── Locations/
│   │   ├── Resources/
│   │   │   ├── ResourceTypes.jsx
│   │   │   ├── ResourceCenters.jsx
│   │   │   └── Inventory.jsx
│   │   ├── Requests/
│   │   │   ├── RequestList.jsx
│   │   │   └── RequestCreate.jsx
│   │   ├── Allocation/
│   │   │   ├── RecommendationList.jsx
│   │   │   ├── RecommendationDetail.jsx
│   │   │   └── ApprovalPage.jsx
│   │   ├── Teams/
│   │   ├── Dispatch/
│   │   ├── Reports/
│   │   └── Admin/
│   │       ├── UserManagement.jsx
│   │       └── WeightConfig.jsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── PageWrapper.jsx
│   │   ├── common/
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── PriorityCard.jsx
│   │   │   ├── ScoreBreakdown.jsx
│   │   │   ├── DataTable.jsx
│   │   │   ├── ConfirmModal.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   └── charts/
│   │       ├── ResourceUtilizationChart.jsx
│   │       ├── RequestFulfillmentChart.jsx
│   │       └── AllocationTimeline.jsx
│   ├── services/
│   │   ├── api.js            (Axios instance + interceptors)
│   │   ├── authService.js
│   │   ├── disasterService.js
│   │   ├── inventoryService.js
│   │   ├── requestService.js
│   │   ├── allocationService.js
│   │   └── reportService.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useAllocation.js
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── utils/
│   │   ├── formatters.js
│   │   └── validators.js
│   └── App.jsx
└── package.json
```

---

## 9. All Modules & Functionality

### Module 1: Authentication & Role Management

**Functionality:**
- User login with email + password
- JWT token issued on successful login, stored in localStorage/httpOnly cookie
- Token verified on every protected API call
- Role-based access control (RBAC) on both backend endpoints and frontend routes
- Admin can create, view, activate/deactivate users
- Password change functionality
- Session expiry handling

**Business Rules:**
- Only ADMIN can create users and assign roles
- Inactive users cannot log in
- All role changes are logged to audit_logs

---

### Module 2: Disaster Management

**Functionality:**
- Create a new disaster incident (type, severity 1–100, date/time, location coordinates, description)
- View all disasters with filtering by status, type, date range
- Update disaster details and status
- Status workflow: `ACTIVE → CONTAINED → RECOVERING → CLOSED`
- View linked affected locations and requests from the disaster detail page

**Business Rules:**
- Only OFFICER or ADMIN can create/update disasters
- Closing a disaster automatically escalates unmet requests
- A disaster must have at least one associated affected location

---

### Module 3: Affected Location Management

**Functionality:**
- Register affected locations linked to a disaster
- Record: name, GPS coordinates, population affected, vulnerability score (0–100), severity score, accessibility status
- View all locations per disaster
- Track number of open requests and fulfillment status per location
- Update accessibility status in real-time

**Business Rules:**
- A location must be linked to an ACTIVE disaster
- Vulnerability score and population affect priority scoring

---

### Module 4: Resource Management

**Sub-module 4a: Resource Types**
- Define resource categories: FOOD, WATER, MEDICINE, EQUIPMENT, VEHICLE, PERSONNEL, SHELTER
- Specify unit (litres, kg, units, etc.) and perishable flag

**Sub-module 4b: Resource Centers / Warehouses**
- Register resource centers with GPS coordinates and contact
- Activate/deactivate centers

**Sub-module 4c: Inventory Management**
- Add/update stock quantities per center per resource type
- Track: available, reserved, dispatched, delivered quantities
- Set minimum stock level for alerts
- Track expiry dates for perishable items
- Inventory automatically updates after allocation approval and dispatch delivery

**Business Rules:**
- `available_qty = total - reserved - dispatched`
- Only ACTIVE centers can be used for allocation
- Cannot reserve more than available
- Expired inventory cannot be allocated

---

### Module 5: Relief Request Management

**Functionality:**
- Create a relief request linked to a disaster + location
- A single request can contain multiple request items (different resource types)
- Set urgency level: LOW / MEDIUM / HIGH / CRITICAL
- Set deadline for request fulfillment
- Officer verifies requests before they enter allocation queue
- Track partial fulfillment per request item
- Escalate long-pending unmet requests

**Request Status Flow:**
```
PENDING → VERIFIED → ALLOCATED → PARTIALLY_FULFILLED / FULFILLED
                              ↘ ESCALATED (if overdue)
```

**Business Rules:**
- Duplicate open requests for same location + resource type should warn the user
- A request must be VERIFIED before it can be allocated
- Partial fulfillment is tracked continuously: fulfilled_qty updates on each delivery

---

### Module 6: Resource Allocation Engine (Core Module)

**This is the heart of the project.**

#### 6a. Priority Score Calculation
```
Priority Score = (wS × S) + (wP × P) + (wU × U) + (wD × D) + (wT × T) + (wV × V)
```
All factors normalized to 0–100 scale.

| Factor | Variable | Source | Default Weight |
|--------|----------|--------|----------------|
| Severity | S | disaster.severity + location.severity_score | 0.25 |
| Population/Vulnerability | P | location.population_affected | 0.20 |
| Urgency | U | request.urgency + time to deadline | 0.20 |
| Resource Shortage (Deficit) | D | (required_qty - fulfilled_qty) / required_qty | 0.20 |
| Travel Time | T | distance from center to location | 0.10 |
| Vulnerability | V | location.vulnerability_score | 0.05 |

#### 6b. Allocation Process (Step-by-Step)
```
1. Fetch all VERIFIED and open request_items
2. Fetch available inventory from all ACTIVE resource centers
3. For each request_item:
   a. Calculate S, P, U, D, T, V scores (normalize to 0-100)
   b. Calculate Priority Score using configured weights
4. Sort request_items by Priority Score (descending)
5. For each request_item (highest priority first):
   a. Find all centers that have the required resource type in stock
   b. Calculate Haversine distance from each center to the affected location
   c. Estimate travel time
   d. Filter out centers with 0 available stock or incompatible resources
   e. Select best center (highest score considering distance vs. stock)
   f. Determine allocated_qty = min(available_qty, required_qty - fulfilled_qty)
   g. Reserve allocated_qty in inventory (reserved_qty += allocated_qty)
   h. Create an Allocation record (status = RECOMMENDED)
   i. Create an AllocationFactor record (full explanation)
6. Return all recommendations to officer for review
```

#### 6c. Feasibility Constraints
- Cannot allocate more than available inventory
- Cannot use INACTIVE or CLOSED resource centers
- Allocation quantity must be > 0
- Incompatible resource type not allocated
- Expired inventory excluded

#### 6d. Explanation Generation
Every allocation produces a human-readable explanation, e.g.:
> *"High priority because severity is 90/100, remaining supply covers only 25% of required quantity, and the affected population is 5,000. Recommended source: Center 2 (15.3 km away) because it has sufficient stock and estimated travel time is 2.5 hours — lower than other feasible sources."*

---

### Module 7: Approval Workflow

**Functionality:**
- Officer sees a list of all RECOMMENDED allocations
- Each recommendation shows: request details, affected location, factor breakdown (score card), recommended center, quantity, estimated distance/time
- Officer can:
  - ✅ **Approve** — allocation moves to APPROVED, inventory reserved
  - ❌ **Reject** — allocation rejected, inventory released
  - ✏️ **Modify** — officer can change the quantity or source center
- Approved allocations trigger dispatch creation

**Business Rules:**
- Only OFFICER or ADMIN can approve/reject
- Modification is logged with reason
- Approval triggers automatic inventory reservation
- All approval actions recorded in audit_logs

---

### Module 8: Response Team Management

**Functionality:**
- Register response teams with skills, contact, current location
- Set availability: AVAILABLE / DEPLOYED / OFF_DUTY
- Assign teams to disasters or specific locations
- Track assignment status: ASSIGNED → IN_PROGRESS → COMPLETED

**Business Rules:**
- Only AVAILABLE teams can be assigned to new dispatches
- Team availability auto-updates when dispatch is created/completed

---

### Module 9: Dispatch & Delivery Tracking

**Functionality:**
- Create dispatch order for an APPROVED allocation
- Assign a response team and vehicle
- Record departure time, estimated arrival, actual arrival
- Update delivered_qty on arrival
- System auto-updates:
  - inventory (delivered_qty++)
  - request_item (fulfilled_qty++)
  - allocation status → DELIVERED
  - location fulfillment_status

**Dispatch Status Flow:**
```
CREATED → IN_TRANSIT → DELIVERED
                    ↘ FAILED
```

**Business Rules:**
- Only APPROVED allocations can be dispatched
- On delivery, inventory reserved_qty and dispatched_qty are reconciled
- If delivered_qty < allocated_qty, the remainder stays as unmet demand

---

### Module 10: Dashboard & Reporting

**Functionality:**
- Real-time operational overview for officers and managers
- Algorithm evaluation and baseline comparison reports
- Export to PDF (using pdfbox.jar)

---

## 10. Allocation Engine — Core Logic

### Priority Score Formula
```
Priority = (0.25 × Severity) + (0.20 × Population) + (0.20 × Urgency) +
           (0.20 × Shortage) + (0.10 × TravelTime) + (0.05 × Vulnerability)
```

### Distance Calculation (Haversine)
```java
// Distance between two GPS coordinates in km
double haversine(lat1, lon1, lat2, lon2) {
    R = 6371; // Earth radius in km
    dLat = toRad(lat2 - lat1);
    dLon = toRad(lon2 - lon1);
    a = sin(dLat/2)² + cos(lat1) × cos(lat2) × sin(dLon/2)²
    c = 2 × atan2(√a, √(1-a))
    return R × c;
}
```

### Optimization Objective
```
Maximize: Σ(priority_j × x_ij) − α × Σ(distance_ij × x_ij) − β × Σ(unmet_j)

Subject to:
  Σ_j x_ij ≤ supply_i     ∀ source i
  Σ_i x_ij ≤ demand_j     ∀ request j
  x_ij ≥ 0
  x_ij = 0 if source i cannot supply resource type for request j
```

---

## 11. API Endpoints Reference

### Authentication
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | ALL | Login, returns JWT |
| POST | `/api/auth/logout` | ALL | Logout |

### Users & Roles
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | ADMIN | List all users |
| POST | `/api/users` | ADMIN | Create user |
| PUT | `/api/users/{id}` | ADMIN | Update user |
| DELETE | `/api/users/{id}/deactivate` | ADMIN | Deactivate user |

### Disasters
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/disasters` | ALL | List all disasters |
| GET | `/api/disasters/{id}` | ALL | Get disaster detail |
| POST | `/api/disasters` | OFFICER | Create disaster |
| PUT | `/api/disasters/{id}` | OFFICER | Update disaster |
| PATCH | `/api/disasters/{id}/status` | OFFICER | Update status |

### Locations
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/locations` | ALL | List locations |
| GET | `/api/disasters/{id}/locations` | ALL | Locations by disaster |
| POST | `/api/locations` | OFFICER | Register location |
| PUT | `/api/locations/{id}` | OFFICER | Update location |

### Resources & Inventory
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/resource-types` | ALL | List resource types |
| POST | `/api/resource-types` | ADMIN | Create resource type |
| GET | `/api/resource-centers` | ALL | List resource centers |
| POST | `/api/resource-centers` | RESOURCE_MANAGER | Create center |
| GET | `/api/inventory` | ALL | View all inventory |
| GET | `/api/inventory/center/{id}` | ALL | Inventory by center |
| POST | `/api/inventory` | RESOURCE_MANAGER | Add inventory |
| PUT | `/api/inventory/{id}` | RESOURCE_MANAGER | Update inventory |

### Relief Requests
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/requests` | ALL | List all requests |
| GET | `/api/requests/open` | ALL | Open verified requests |
| GET | `/api/requests/{id}` | ALL | Request detail |
| POST | `/api/requests` | OFFICER | Create request |
| PATCH | `/api/requests/{id}/verify` | OFFICER | Verify request |
| PATCH | `/api/requests/{id}/escalate` | OFFICER | Escalate request |

### Allocation
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/allocation/recommend` | OFFICER | Run allocation engine |
| GET | `/api/allocation/recommendations` | ALL | View all recommendations |
| GET | `/api/allocation/{id}` | ALL | Recommendation detail |
| POST | `/api/allocation/{id}/approve` | OFFICER | Approve allocation |
| POST | `/api/allocation/{id}/reject` | OFFICER | Reject allocation |
| PUT | `/api/allocation/{id}/modify` | OFFICER | Modify allocation |

### Teams & Dispatch
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/teams` | ALL | List teams |
| POST | `/api/teams` | COORDINATOR | Create team |
| POST | `/api/teams/{id}/assign` | COORDINATOR | Assign team |
| POST | `/api/dispatch` | OFFICER | Create dispatch |
| GET | `/api/dispatch` | ALL | List dispatches |
| PATCH | `/api/dispatch/{id}/deliver` | FIELD_OPERATOR | Record delivery |

### Reports
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/reports/metrics` | ALL | Operational metrics |
| GET | `/api/reports/baseline-comparison` | ALL | Algorithm comparison |
| GET | `/api/reports/unmet-demand` | ALL | Unmet demand report |
| GET | `/api/reports/utilization` | ALL | Resource utilization |
| GET | `/api/reports/export/pdf` | OFFICER | Export PDF report |

---

## 12. Dashboard Design

### Admin Dashboard
```
┌─────────────────────────────────────────────────────┐
│  🚨 DRRO Dashboard          [Role: Admin]  [Logout]  │
├──────────┬──────────────────────────────────────────┤
│          │  KPI CARDS ROW                            │
│          │  ┌────────┐ ┌────────┐ ┌────────┐        │
│ Sidebar  │  │Active  │ │Open    │ │Pending │        │
│          │  │Disaster│ │Requests│ │Allocat.│        │
│ 🏠 Home  │  │  [5]   │ │  [23] │ │  [8]  │        │
│ 💥 Disas │  └────────┘ └────────┘ └────────┘        │
│ 📍 Loca  │  ┌────────────────┐ ┌──────────────────┐ │
│ 📦 Res   │  │ Active         │ │ Request Priority  │ │
│ 📋 Req   │  │ Disasters Map  │ │ Bar Chart         │ │
│ ⚡ Alloc │  │ (coordinates   │ │ (HIGH/MED/LOW)    │ │
│ 🚛 Disp  │  │  markers)      │ │                   │ │
│ 👥 Teams │  └────────────────┘ └──────────────────┘ │
│ 📊 Repo  │  ┌──────────────────────────────────────┐ │
│ ⚙️ Admin │  │  Recent Allocation Recommendations   │ │
│          │  │  Location | Score | Status | Action   │ │
│          │  └──────────────────────────────────────┘ │
│          │  ┌────────────────┐ ┌──────────────────┐ │
│          │  │ Resource       │ │ Unmet Demand by  │ │
│          │  │ Utilization %  │ │ Location         │ │
│          │  │ (Donut chart)  │ │ (Horizontal bar) │ │
│          │  └────────────────┘ └──────────────────┘ │
└──────────┴──────────────────────────────────────────┘
```

### KPI Cards (Summary at Top)
| Card | Metric |
|------|--------|
| 🔴 Active Disasters | Count of ACTIVE disasters |
| 📋 Open Requests | Count of VERIFIED, unmet requests |
| ⏳ Pending Approvals | Count of RECOMMENDED allocations |
| 📦 Low Stock Alerts | Count of inventories below min_stock_level |
| 🚛 Active Dispatches | Count of IN_TRANSIT dispatches |
| ✅ Fulfilled Today | Requests fulfilled in the last 24 hours |

### Charts on Dashboard
| Chart | Type | Data |
|-------|------|------|
| Resource Utilization | Donut / Pie | Available vs Reserved vs Dispatched |
| Request Priority Breakdown | Bar | Count per urgency level |
| Fulfillment Rate Over Time | Line | Daily fulfillment % over 30 days |
| Unmet Demand by Location | Horizontal Bar | Unmet qty per location |
| Allocation Status | Stacked Bar | Recommended / Approved / Delivered |
| Top High-Priority Requests | Table | Top 10 by score |

---

## 13. All Screens / Pages

| # | Page | URL | Access |
|---|------|-----|--------|
| 1 | Login | `/login` | ALL |
| 2 | Dashboard | `/dashboard` | ALL |
| 3 | Disaster List | `/disasters` | ALL |
| 4 | Create Disaster | `/disasters/create` | OFFICER |
| 5 | Disaster Detail | `/disasters/:id` | ALL |
| 6 | Affected Locations | `/locations` | ALL |
| 7 | Resource Types | `/resources/types` | ALL |
| 8 | Resource Centers | `/resources/centers` | ALL |
| 9 | Inventory View | `/resources/inventory` | ALL |
| 10 | Add Inventory | `/resources/inventory/add` | RESOURCE_MANAGER |
| 11 | Request List | `/requests` | ALL |
| 12 | Create Request | `/requests/create` | OFFICER |
| 13 | Request Detail | `/requests/:id` | ALL |
| 14 | Recommendation List | `/allocation` | ALL |
| 15 | Recommendation Detail | `/allocation/:id` | ALL |
| 16 | Approval Page | `/allocation/:id/review` | OFFICER |
| 17 | Team List | `/teams` | ALL |
| 18 | Dispatch Tracking | `/dispatch` | ALL |
| 19 | Delivery Update | `/dispatch/:id/deliver` | FIELD_OPERATOR |
| 20 | Reports | `/reports` | ALL |
| 21 | Algorithm Comparison | `/reports/comparison` | ALL |
| 22 | User Management | `/admin/users` | ADMIN |
| 23 | Weight Configuration | `/admin/weights` | ADMIN |

---

## 14. User Roles & Permissions

| Feature | ADMIN | OFFICER | RESOURCE_MGR | COORDINATOR | FIELD_OP | VIEWER |
|---------|-------|---------|--------------|-------------|----------|--------|
| Manage Users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create Disaster | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Location | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Inventory | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Create Request | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Verify Request | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Run Allocation | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Approve Allocation | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Teams | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Create Dispatch | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Record Delivery | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Reports | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Config Weights | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 15. Security Design

- **Authentication:** Spring Security + JWT (stateless)
- **Password Hashing:** BCrypt (strength 12)
- **Authorization:** `@PreAuthorize` annotations + SecurityConfig route protection
- **Input Validation:** Bean Validation (Jakarta Validation) + custom validators
- **DTO Layer:** Never expose JPA entities directly in API responses
- **CORS:** Configured to allow only frontend origin
- **SQL Injection:** Prevented by JPA parameterized queries
- **Transactions:** `@Transactional` on all allocation and inventory update operations
- **Audit Logs:** All APPROVE, REJECT, MODIFY, INVENTORY_UPDATE actions logged with user + timestamp

---

## 16. Baseline Algorithms for Comparison

| Algorithm | Logic | Purpose |
|-----------|-------|---------|
| **Baseline A – FCFS** | Process requests in order of created_at | Simplest; worst-case for high-priority requests |
| **Baseline B – Severity Only** | Sort by disaster severity score only | Ignores logistics and shortage |
| **Baseline C – Nearest Source** | For each request, pick the closest center | Ignores severity and urgency |
| **DRRO Multi-Factor** | Full priority score + constraint-aware greedy | The proposed method |

---

## 17. Evaluation Metrics

| Metric | Formula | Goal |
|--------|---------|------|
| **Fulfillment Rate** | fulfilled_qty / required_qty × 100 | Higher is better |
| **Unmet Demand** | Σ(required_qty − fulfilled_qty) | Lower is better |
| **Average Response Time** | avg(dispatch_at − request_verified_at) | Lower is better |
| **Resource Utilization** | allocated_qty / available_qty × 100 | Higher is better |
| **Transportation Cost** | Σ(distance_km × allocated_qty) | Lower is better |
| **Priority Satisfaction** | Weighted fulfillment of HIGH/CRITICAL requests | Higher is better |
| **Computation Time** | Engine execution time in ms | Lower is better |
| **Equity (Gini)** | Gini coefficient on fulfillment across locations | Lower is more fair |

---

## 18. Testing Strategy

### Unit Tests (JUnit 5 + Mockito)
- [ ] `PriorityScoreCalculator` — test each factor normalization
- [ ] `GreedyAllocator` — test allocation with various supply/demand combos
- [ ] `FeasibilityChecker` — test constraint violations
- [ ] `InventoryService` — test quantity deductions
- [ ] `DistanceCalculator` — test Haversine formula with known coordinates

### Integration Tests (Spring Boot Test)
- [ ] Auth login/token flow
- [ ] Request creation → verification → allocation flow
- [ ] Allocation approval → inventory reservation → dispatch creation
- [ ] Delivery recording → inventory update → request fulfillment

### System Tests (End-to-End)
- [ ] Full scenario: Disaster → Location → Request → Allocate → Approve → Dispatch → Deliver
- [ ] Insufficient stock scenario (partial allocation)
- [ ] Multiple simultaneous requests with scarcity
- [ ] Closed disaster behavior

### Algorithm Evaluation
- Run all 4 algorithms on the **Sample Test Scenario:**
  - 3 locations, 2 centers, 1 resource type
  - Total demand: 10,000 units | Available: 7,000 units
  - Location A: demand 4,000 | Severity 90 | Population 5,000 | Urgency 90
  - Location B: demand 3,000 | Severity 70 | Population 3,000 | Urgency 70
  - Location C: demand 3,000 | Severity 50 | Population 2,000 | Urgency 60
- Record and compare all evaluation metrics

---

## 19. Implementation Roadmap

| Period | Work | Priority | Deliverable |
|--------|------|----------|-------------|
| **15–21 Aug** | Requirements, DB design, architecture, Git setup | 🔴 Critical | SRS + ER Diagram + Repo |
| **22–28 Aug** | Spring Boot setup, MySQL, auth, users/roles | 🔴 Critical | Working backend foundation |
| **29 Aug–4 Sep** | Disaster, Location, Resource Center, Inventory APIs + basic UI | 🔴 Critical | Core CRUD APIs + UI |
| **5–11 Sep** | Relief Requests, request items, validation | 🔴 Critical | Request workflow |
| **12–18 Sep** | Priority engine + greedy allocation + explanation | 🔴 Critical | Working optimizer |
| **19–23 Sep** | Approval workflow, Dispatch, Teams, Delivery tracking | 🔴 Critical | End-to-end workflow |
| **24–26 Sep** | Dashboard, Reports, Charts, Baseline experiments | 🟡 High | Evaluation module |
| **27–28 Sep** | Testing, bug fixing, security, performance review | 🔴 Critical | Stable release candidate |
| **29 Sep** | Final dataset, screenshots, diagrams, paper/report | 🔴 Critical | Documentation complete |
| **30 Sep** | Final integration, demo rehearsal, submission | 🔴 Critical | Final project build |

---

## 20. MVP Checklist

The Minimum Viable Product must include:

- [ ] Login with role-based access
- [ ] Create and view disaster
- [ ] Register affected location
- [ ] Create resource center and add inventory
- [ ] Create relief request with items
- [ ] Calculate and display priority score
- [ ] Generate allocation recommendation
- [ ] Officer approves allocation
- [ ] Inventory reserved after approval
- [ ] Dispatch created and delivery recorded
- [ ] Dashboard showing active disasters and pending requests

> ⚠️ **Advanced maps, ML forecasting, notifications, and LP optimization are Post-MVP only.**

---

## 21. Development Order

1. Create Git repository and push project structure
2. Design MySQL schema and write DDL scripts
3. Create Spring Boot project (Spring Initializr)
4. Add dependencies: Security, JPA, PostgreSQL, Lombok, MapStruct, Validation
5. Create all JPA entities and relationships
6. Create repositories for all entities
7. Implement JWT authentication (login, token filter)
8. Implement role-based security configuration
9. Implement User management APIs
10. Implement Disaster CRUD APIs + service
11. Implement Location CRUD APIs + service
12. Implement ResourceType, ResourceCenter, Inventory APIs
13. Implement ReliefRequest + RequestItem APIs
14. **Implement AllocationEngine** (PriorityScoreCalculator → GreedyAllocator → ExplanationGenerator)
15. Implement Approval workflow with inventory reservation
16. Implement Team management and Dispatch + Delivery tracking
17. Implement Reports and Metrics API
18. Build React frontend (login page → dashboard → each module page)
19. Integrate frontend with backend APIs
20. Add baseline algorithm comparison endpoints
21. Write unit and integration tests
22. Generate test dataset and run experiments
23. Fix bugs, polish UI, add audit log display
24. Generate documentation, screenshots, ER diagram, report

---

## 22. Future Enhancements

| Enhancement | Description |
|-------------|-------------|
| ML Demand Forecasting | Predict resource needs based on historical data |
| Real-time Weather API | Adjust priority based on weather severity |
| GIS / Map Integration | Visual map with disaster locations and resource centers |
| Dynamic Routing | Integrate road network for actual travel time |
| IoT Warehouse Monitoring | Real-time inventory tracking from field |
| Mobile App | React Native app for field operators |
| SMS/Email Alerts | Notify teams on dispatch/approval |
| LP/MILP Solver | Replace greedy with linear programming solver |
| Robust Optimization | Handle demand uncertainty with stochastic models |
| Multi-Disaster Optimizer | Simultaneous optimization across multiple disasters |
| Inter-Agency Sharing | Resource pooling between multiple organizations |
| Blockchain Audit Trail | Tamper-evident log for high-stakes operations |

---

## 📌 Quick Reference

```
Project:   Disaster Resource Response Optimizer (DRRO)
Stack:     React + Spring Boot + Supabase (PostgreSQL)
Port:      Backend 8080 | Frontend 5173 (Vite) or 3000 (CRA)
DB:        Supabase PostgreSQL (cloud) — schema: public
Auth:      JWT Bearer Token (Spring Security)
Algorithm: Greedy Priority-Aware Allocation
Formula:   Score = 0.25S + 0.20P + 0.20U + 0.20D + 0.10T + 0.05V
Target:    30 September 2026

Supabase Connection (application.properties):
  spring.datasource.url=jdbc:postgresql://db.[ref].supabase.co:5432/postgres?sslmode=require
  spring.datasource.username=postgres
  spring.datasource.password=[your-supabase-db-password]
  spring.datasource.driver-class-name=org.postgresql.Driver
  spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
  spring.jpa.hibernate.ddl-auto=validate
```

---

*Document prepared as project blueprint for DRRO final-year project.*  
*Last Updated: August 2026*
