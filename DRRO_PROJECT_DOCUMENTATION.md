# 📘 DRRO (Disaster Resource Response Optimizer) — Complete Project Documentation

---

## 📑 Table of Contents
1. [Project Overview & Work Completed So Far](#1-project-overview--work-completed-so-far)
2. [Technologies Used & Why They Are Used](#2-technologies-used--why-they-are-used)
3. [What is Maven & What is `pom.xml`?](#3-what-is-maven--what-is-pomxml)
4. [Backend Dependencies Explained](#4-backend-dependencies-explained)
5. [Backend Package Structure & File Breakdown](#5-backend-package-structure--file-breakdown)
6. [Database Architecture: Tables, Fields & Purposes](#6-database-architecture-tables-fields--purposes)
7. [Frontend Architecture & Built Modules](#7-frontend-architecture--built-modules)
8. [How to Run the Entire Application](#8-how-to-run-the-entire-application)

---

## 1. Project Overview & Work Completed So Far

The **Disaster Resource Response Optimizer (DRRO)** is an end-to-end disaster management platform designed to optimize relief supply distribution during emergencies. It combines a **Spring Boot 3 backend**, a **Supabase PostgreSQL database**, and a **React 18 + Vite frontend**.

### 🌟 Summary of Work Accomplished
1. **Maven Backend Verification & Fixes**:
   - Fixed configuration in `backend/src/main/resources/application.properties` (split merged lines, configured proper Hibernate auto-update mode).
   - Upgraded JWT Secret in `.env` to a 512-bit key required by JJWT `0.12.5`.
   - Diagnosed Supabase connectivity across local ISPs, identified the correct IPv4 pooler host (`aws-0-ap-southeast-1.pooler.supabase.com:5432`), and connected the backend to Supabase.
   - Successfully ran Spring Boot and verified automatic generation of all 16 JPA tables in Supabase PostgreSQL.
2. **Frontend Architecture & Scaffolding**:
   - Replaced old HTML prototypes with a modern, production-grade **React 18 + Vite** Single Page Application (SPA).
   - Built a custom **Dark-Mode Design System** (`index.css`) with color tokens, glassmorphism, priority score badges, dynamic modals, and searchable data tables.
   - Implemented role-based routing (RBAC) supporting 5 roles: `ADMIN`, `OFFICER`, `RESOURCE_MANAGER`, `COORDINATOR`, and `FIELD_OPERATOR`.
   - Completed all **23 UI pages and modules** matching the project blueprint, with interactive data visualizations (using `Recharts`).
   - Verified clean production build (`npm run build`) with zero errors and launched dev server at `http://localhost:5173/`.

---

## 2. Technologies Used & Why They Are Used

| Technology | Layer | Why It Is Used |
|---|---|---|
| **Java 17 / 26** | Backend Core | Modern, strongly typed, high-performance object-oriented runtime with LTS features and robust memory management. |
| **Spring Boot 3.3.2** | Backend Framework | Industry-standard Java enterprise framework providing Dependency Injection, embedded Tomcat web server, REST controllers, and automated configuration. |
| **Spring Data JPA** | ORM / Data Layer | Simplifies database interactions by mapping Java classes (`@Entity`) directly to PostgreSQL tables without writing boilerplate SQL. |
| **Hibernate 6.5** | ORM Engine | Executes automated schema generation (`ddl-auto=update`), query generation, and connection pooling. |
| **Supabase PostgreSQL** | Cloud Database | Enterprise-grade, relational SQL database hosted on the cloud with high reliability, automated backups, and PgBouncer connection pooling. |
| **Spring Security 6** | Authentication & RBAC | Secures API endpoints, enforces role-based access control, and prevents unauthorized requests. |
| **JJWT (io.jsonwebtoken 0.12.5)** | Security Tokens | Generates, parses, and cryptographically signs stateless JSON Web Tokens (JWT) for secure user sessions. |
| **Lombok** | Developer Ergonomics | Eliminates repetitive Java boilerplate by automatically generating getters, setters, constructors, and builders via annotations. |
| **MapStruct** | Object Mapping | High-speed, compile-time bean mapping between JPA database entities and API Data Transfer Objects (DTOs). |
| **OpenAPI / Swagger UI** | Documentation | Automatically creates interactive API documentation accessible at `/swagger-ui.html`. |
| **OpenPDF (LibrePDF)** | Reporting | Generates exportable PDF reports for incident audits and resource allocation summaries. |
| **React 18** | Frontend UI | Component-driven frontend library allowing reactive state management and responsive user interfaces. |
| **Vite** | Frontend Tooling | Ultra-fast next-generation frontend build tool offering instant Hot Module Replacement (HMR) and optimized rollup production bundles. |
| **React Router v6** | Routing | Manages client-side routing, protected navigation, URL parameters, and authentication redirects. |
| **Recharts** | Data Visualization | Declarative charting library for rendering resource donut charts, 14-day fulfillment graphs, and allocation comparison bars. |

---

## 3. What is Maven & What is `pom.xml`?

### What is Apache Maven?
**Apache Maven** is a project management and build automation tool used primarily for Java projects. 
- **Automated Dependency Management**: Downloads required libraries (Spring, PostgreSQL driver, JWT, Lombok) from the central Maven repository automatically.
- **Standardized Build Lifecycle**: Compiles source code, runs unit tests, packages artifacts (into `.jar` or `.war`), and starts the development server with standard commands like `mvn clean verify` and `mvn spring-boot:run`.
- **Plugin Ecosystem**: Coordinates plugins like the Java compiler, annotation processors (Lombok/MapStruct), and Spring Boot repackager.

### What is `pom.xml`?
`pom.xml` stands for **Project Object Model**. It is the central XML configuration file that defines everything about the Java project:
1. **Metadata**: Project group ID (`com.drro`), artifact name (`drro-backend`), and version (`0.0.1-SNAPSHOT`).
2. **Parent Inheritance**: Inherits standard configuration and compatible dependency versions from `spring-boot-starter-parent` (version `3.3.2`).
3. **Properties**: Defines global version constants like `<java.version>17</java.version>`.
4. **Dependencies (`<dependencies>`)**: The list of all libraries the project requires to compile and run.
5. **Build Plugins (`<build><plugins>`)**: Configures compiler settings, MapStruct + Lombok annotation processor paths, and the Spring Boot executable packaging plugin.

---

## 4. Backend Dependencies Explained

Here is the exact breakdown of the dependencies in `backend/pom.xml`:

```xml
<!-- 1. Web Starter: Provides Spring MVC, REST APIs, JSON serialization (Jackson), and embedded Tomcat -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<!-- 2. JPA Starter: Provides Hibernate ORM and Spring Data Repositories for database operations -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<!-- 3. Security Starter: Secures API routes and validates user roles -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<!-- 4. Validation Starter: Validates incoming request bodies (@NotNull, @Min, @Email, etc.) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>

<!-- 5. PostgreSQL Driver: Official JDBC driver for communicating with Supabase PostgreSQL -->
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>

<!-- 6. JJWT (API, Impl, Jackson): Creates and verifies HMAC-SHA512 signed JWT authentication tokens -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.5</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.5</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.5</version>
    <scope>runtime</scope>
</dependency>

<!-- 7. Lombok: Code generator for @Getter, @Setter, @Builder, @RequiredArgsConstructor -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.46</version>
    <optional>true</optional>
</dependency>

<!-- 8. MapStruct: High performance compile-time entity-to-DTO mapper -->
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>1.5.5.Final</version>
</dependency>

<!-- 9. SpringDoc OpenAPI: Generates Swagger UI for testing API endpoints in the browser -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.5.0</version>
</dependency>

<!-- 10. OpenPDF: Java library for generating PDF summary reports -->
<dependency>
    <groupId>com.github.librepdf</groupId>
    <artifactId>openpdf</artifactId>
    <version>1.3.39</version>
</dependency>

<!-- 11. Spring-Dotenv: Loads configuration from root .env file directly into Spring environment -->
<dependency>
    <groupId>me.paulschwarz</groupId>
    <artifactId>spring-dotenv</artifactId>
    <version>4.0.0</version>
</dependency>
```

---

## 5. Backend Package Structure & File Breakdown

The backend codebase (`backend/src/main/java/com/drro`) is structured following clean **Layered Architecture** principles:

```
com.drro/
├── DrroApplication.java       # Main Spring Boot application entry point
├── allocation/                # Multi-Factor Optimization Engine & Algorithm implementations
├── config/                    # Security, CORS, Swagger, and Property configuration classes
├── controller/                # REST Controllers exposing HTTP endpoints to the frontend
├── dto/                       # Request and Response Data Transfer Objects
├── entity/                    # JPA Database Entities (mapped to PostgreSQL tables)
├── exception/                 # Global exception handler and custom business exceptions
├── repository/                # Spring Data JPA Repository interfaces for SQL queries
├── security/                  # JWT authentication filters and UserDetailsService
├── service/                   # Core business logic and database transaction management
└── util/                      # Distance (Haversine formula), PDF generation, and math helpers
```

### Purpose of Each Package:
- **`entity/`**: Represents database tables as Java objects with relationships (`@OneToMany`, `@ManyToOne`).
- **`repository/`**: Inherits from `JpaRepository` to provide built-in CRUD operations (e.g. `findById`, `save`, `findAllByStatus`).
- **`service/`**: Implements core disaster management business rules, validation, status transitions, and transactions (`@Transactional`).
- **`controller/`**: Handles incoming HTTP requests (`GET`, `POST`, `PUT`, `DELETE`), validates input, and returns standardized JSON responses.
- **`allocation/`**: Contains the **Greedy Multi-Factor Allocation Algorithm** that calculates priority scores using 6 weighted factors (Severity, Population, Urgency, Shortage Deficit, Travel Distance, and Vulnerability).
- **`security/`**: Intercepts HTTP requests, reads the `Authorization: Bearer <token>` header, validates the JWT, and loads user permissions into the Spring Security context.
- **`config/`**: Sets up global CORS settings, password encoder (`BCryptPasswordEncoder`), and Swagger UI OpenAPI documentation.

---

## 6. Database Architecture: Tables, Fields & Purposes

When the backend connects to Supabase PostgreSQL, Hibernate creates **16 database tables** automatically:

| # | Database Table | Purpose | Key Columns / Data Stored |
|---|---|---|---|
| 1 | **`users`** | Stores system users and credentials | `id`, `name`, `email`, `password_hash`, `role` (ADMIN, OFFICER, etc.), `status` (ACTIVE/INACTIVE), `created_at` |
| 2 | **`disasters`** | Tracks disaster incidents | `id`, `name`, `type` (FLOOD, EARTHQUAKE, LANDSLIDE), `severity` (1-10), `status` (ACTIVE, CONTAINED, CLOSED), `start_time`, `latitude`, `longitude` |
| 3 | **`locations`** | Affected geographic areas/camps | `id`, `disaster_id`, `name`, `latitude`, `longitude`, `affected_population`, `accessibility_status` (OPEN, BLOCKED, RESTRICTED), `vulnerability_score` |
| 4 | **`resource_types`** | Catalog of relief items | `id`, `name`, `category` (FOOD, MEDICAL, SHELTER, WATER), `unit` (KG, LITERS, PIECES), `perishable` (boolean) |
| 5 | **`resource_centers`** | Warehouses & distribution hubs | `id`, `name`, `latitude`, `longitude`, `contact_number`, `capacity` |
| 6 | **`inventory`** | Stock inventory per center | `id`, `center_id`, `resource_type_id`, `quantity`, `reserved_quantity`, `min_threshold`, `expiry_date` |
| 7 | **`relief_requests`** | Requests submitted for relief | `id`, `disaster_id`, `location_id`, `urgency` (CRITICAL, HIGH, MEDIUM, LOW), `status` (PENDING, APPROVED, FULFILLED), `deadline`, `created_by_user_id` |
| 8 | **`request_items`** | Specific items in a relief request | `id`, `request_id`, `resource_type_id`, `required_qty`, `fulfilled_qty` |
| 9 | **`allocations`** | Resource assignment recommendations | `id`, `request_id`, `source_center_id`, `resource_type_id`, `allocated_qty`, `priority_score`, `status` (RECOMMENDED, APPROVED, REJECTED, DISPATCHED, DELIVERED) |
| 10 | **`allocation_factors`**| Breakdown of priority scores | `id`, `allocation_id`, `severity_score`, `population_score`, `urgency_score`, `shortage_score`, `travel_time_score`, `vulnerability_score`, `final_score`, `explanation_text` |
| 11 | **`response_teams`** | Rescue & deployment teams | `id`, `name`, `skills`, `availability` (AVAILABLE, DEPLOYED, OFF_DUTY), `contact_number`, `current_latitude`, `current_longitude` |
| 12 | **`team_assignments`**| Assigns teams to specific tasks | `id`, `team_id`, `disaster_id`, `location_id`, `assigned_at`, `released_at` |
| 13 | **`dispatches`** | Tracks delivery shipments | `id`, `allocation_id`, `team_id`, `vehicle_number`, `dispatched_at`, `estimated_arrival`, `actual_arrival`, `delivered_qty`, `status` (IN_TRANSIT, DELIVERED, FAILED) |
| 14 | **`weight_configs`** | Multi-factor formula multipliers | `id`, `severity_weight`, `population_weight`, `urgency_weight`, `shortage_weight`, `travel_weight`, `vulnerability_weight`, `is_active` |
| 15 | **`audit_logs`** | Security and action audit trail | `id`, `user_id`, `action`, `entity_name`, `entity_id`, `timestamp`, `details` |
| 16 | **`roles`** | Reference table for role names | `id`, `name` (`ADMIN`, `OFFICER`, `RESOURCE_MANAGER`, `COORDINATOR`, `FIELD_OPERATOR`) |

---

## 7. Frontend Architecture & Built Modules

The frontend is a **React 18 + Vite** application organized into structured modules:

```
frontend/src/
├── components/
│   ├── layout/       # Sidebar, Navbar, PageWrapper
│   ├── common/       # StatusBadge, DataTable, PriorityCard, ConfirmModal, LoadingSpinner
│   └── charts/       # ResourceUtilizationChart, RequestFulfillmentChart, AllocationTimeline
├── context/          # AuthContext with 5 demo roles and token management
├── pages/
│   ├── Login/        # Login page with demo credentials
│   ├── Dashboard/    # Operations overview, metrics, and real-time charts
│   ├── Disasters/    # Disaster management (List, Create with severity slider, Detail)
│   ├── Locations/    # Location management and accessibility tracking
│   ├── Resources/    # Resource Types, Warehouses, Inventory tracking, Stock Entry
│   ├── Requests/     # Relief Requests (List, Dynamic multi-item creator, Progress detail)
│   ├── Allocation/   # Recommendations, Explainable Factor Card, Review/Approval workflow
│   ├── Teams/        # Rescue & logistics team deployment tracking
│   ├── Dispatch/     # Delivery progress, Vehicle tracking, Delivery confirmation log
│   ├── Reports/      # Performance metrics, unmet demand graphs, Algorithm benchmark
│   └── Admin/        # User role administration, Dynamic priority weight slider configuration
├── utils/            # Date/time, number, and status badge formatters
├── App.jsx           # Master router with RBAC role protection
├── main.jsx          # Vite React entry point
└── index.css         # Custom dark-mode design system
```

---

## 8. How to Run the Entire Application

### A. Run the Backend (Spring Boot)
1. **From Terminal**:
   ```powershell
   cd d:\DRRO\backend
   mvn spring-boot:run
   ```
2. **From IntelliJ IDEA**:
   - Open `d:\DRRO\backend` in IntelliJ.
   - Open `src/main/java/com/drro/DrroApplication.java`.
   - Click the green **Run** ▶ button.
3. **Verify**:
   - Backend API: `http://localhost:8080`
   - Swagger Documentation: `http://localhost:8080/swagger-ui.html`

### B. Run the Frontend (React Vite)
1. **From Terminal**:
   ```powershell
   cd d:\DRRO\frontend
   npm run dev
   ```
2. **Open in Browser**:
   - Web App: `http://localhost:5173/`
   - Demo Logins: `admin@drro.in`, `officer@drro.in`, `manager@drro.in`, `coord@drro.in`, `field@drro.in` *(any password works for testing)*
