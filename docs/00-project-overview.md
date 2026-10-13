# Vehicle Rental System — Project Overview

## 1. Document Purpose

This document provides the high-level definition of the Vehicle Rental System.

It defines:

* Project purpose
* Learning objectives
* Business scope
* Core domain
* Main actors
* Core services
* High-level architecture
* Technology direction
* Major engineering topics
* Project constraints
* Out-of-scope features
* Documentation and development strategy

This document intentionally does **not** define detailed API contracts, database schemas, concurrency algorithms, Kafka message formats, UI specifications, or implementation details.

Those topics must be defined in dedicated documents.

---

# 2. Project Overview

## 2.1 Project Name

**Vehicle Rental System**

## 2.2 Project Type

A small learning-oriented vehicle rental platform designed to practice modern backend engineering and distributed system concepts.

The system allows customers to:

* Register and authenticate
* Browse available vehicles
* Search and filter vehicles
* View vehicle details
* Select a rental period
* Create a booking
* View booking history
* View booking details
* Cancel eligible bookings

Administrators can:

* Manage vehicles
* Manage vehicle types
* Manage rental locations
* Manage vehicle lifecycle/status
* View and manage bookings

---

# 3. Project Goals

The primary goal is **not** to build a production-scale rental platform.

The goal is to build a small but technically meaningful system that allows one developer to learn and demonstrate:

* Microservices architecture
* RESTful API design
* Clean architecture and separation of concerns
* C# / .NET backend development
* ASP.NET Core
* Entity Framework Core
* SQL Server
* Redis
* Kafka
* Database transactions
* Concurrency control
* Idempotency
* Transactional Outbox
* Event-driven architecture
* Database indexing and query optimization
* Database partitioning
* Database sharding concepts
* Performance optimization
* Observability
* Automated testing
* Docker
* React + TypeScript
* Frontend performance
* UI/UX fundamentals

The project should prioritize **learning value and engineering correctness** over feature quantity.

---

# 4. Learning Strategy

The system will be developed progressively.

```text
Basic CRUD
    ↓
Clean Architecture
    ↓
Business Rules
    ↓
Transaction & Data Consistency
    ↓
Concurrency Control
    ↓
Booking Idempotency
    ↓
Performance Optimization
    ↓
Redis Caching
    ↓
Kafka / Event-Driven Architecture
    ↓
Transactional Outbox
    ↓
Database Partitioning
    ↓
Database Sharding
    ↓
Observability
    ↓
Load Testing
```

Each advanced technology should be introduced only when there is a clear problem that justifies it.
Booking-creation idempotency is part of the baseline reliability/correctness work; later idempotency learning applies to broader service integration and event processing.

The project must avoid adding infrastructure simply because the technology is popular.

---

# 5. Project Principles

## 5.1 Keep It Small

The system should remain small enough for one developer to understand and maintain.

Target:

* 2–3 backend services
* 2–3 databases
* One frontend application
* Docker-based local environment
* No Kubernetes initially

---

## 5.2 Problem Before Technology

Every technology or library should solve a clearly identified problem.

Preferred decision process:

```text
Problem
   ↓
Candidate Solutions
   ↓
Comparison
   ↓
Decision
   ↓
Reason
   ↓
Trade-offs
```

For example:

```text
Problem: Reduce repeated vehicle queries

Possible solutions:
- Database optimization
- Redis
- Application memory cache

Decision:
- Redis

Reason:
- Shared cache
- Can be used across service instances
- Useful for learning distributed caching
```

---

## 5.3 Correctness Before Performance

The implementation priority is:

```text
Correctness
    ↓
Maintainability
    ↓
Observability
    ↓
Performance
    ↓
Scalability
```

Performance optimizations should be based on measurements rather than assumptions.

---

## 5.4 Database Ownership

Each service owns its own database.

```text
User Service
    ↓
User DB

Vehicle Service
    ↓
Vehicle DB

Booking Service
    ↓
Booking DB
```

A service must not directly access another service's database.

Cross-service data access must use:

* REST APIs
* Events/messages
* Explicit integration mechanisms

---

# 6. Business Scope

## 6.1 Customer Features

Customers can:

### Authentication

* Register
* Login
* Obtain authentication token
* Access authenticated resources

### Vehicle Browsing

* View vehicles
* Search vehicles
* Filter vehicles
* View vehicle details
* Filter by vehicle type
* Filter by location
* Check availability for a rental period

### Booking

Customers can:

* Select pickup location
* Select return location
* Select pickup time
* Select return time
* Create a booking
* View booking details
* View booking history
* Cancel an eligible booking

---

# 7. Administrator Features

Administrators can:

## Vehicle Management

* Create vehicle
* Update vehicle
* Deactivate vehicle
* Change vehicle lifecycle status
* View vehicle information

## Vehicle Type Management

* Create vehicle type
* Update vehicle type
* View vehicle types

## Location Management

* Create location
* Update location
* Deactivate location
* View locations

## Booking Management

* View bookings
* View booking details
* Manage booking lifecycle where permitted

Detailed authorization rules will be defined separately.

---

# 8. Core Domain

The initial domain contains the following concepts.

```text
User
Vehicle
VehicleType
Location
Booking
```

---

## 8.1 User

Represents a customer or administrator.

High-level information:

```text
User
├── Id
├── Name
├── Email
├── Password / Authentication Information
├── Role
├── Status
├── CreatedAt
└── UpdatedAt
```

Detailed authentication and security design will be defined separately.

---

## 8.2 Vehicle

Represents a rentable vehicle.

High-level information:

```text
Vehicle
├── Id
├── VehicleTypeId
├── LocationId
├── LicensePlate
├── Brand
├── Model
├── Year
├── Status
├── IsActive
├── CreatedAt
└── UpdatedAt
```

Vehicle availability is a business concept and must not be treated as a simple permanent vehicle status.

The detailed availability model will be defined in the backend architecture and booking design.

---

## 8.3 VehicleType

Represents a category/type of vehicle.

Examples:

```text
Sedan
SUV
Hatchback
Motorbike
Van
```

The exact supported types are not fixed at the project-overview level.

---

## 8.4 Location

Represents a rental location.

Examples:

```text
Airport
Downtown
Train Station
City Center
```

A location can contain multiple vehicles.

---

## 8.5 Booking

Represents a customer's rental reservation.

High-level information:

```text
Booking
├── Id
├── CustomerUserId
├── VehicleId
├── PickupLocationId
├── ReturnLocationId
├── PickupUtc
├── ReturnUtc
├── Status
├── TotalPrice (future scope; not required by MVP)
├── CreatedAt
├── UpdatedAt
├── CancelledAt
└── CompletedAt
```

The detailed schema and lifecycle will be defined in:

```text
docs/backend/05-database-design.md
docs/backend/08-concurrency-and-transaction.md
docs/02-business-rules.md
```

---

# 9. Booking Lifecycle

The initial booking lifecycle is:

```text
Pending
   │
   ├── Confirmed
   │      │
   │      ├── Active
   │      │      │
   │      │      └── Completed
   │      │
   │      └── Cancelled
   │
   └── Rejected
```

The exact state transition rules must be defined in the business-rules and booking-flow documents.

Invalid state transitions must be rejected.

---

# 10. Most Important Business Problem

The most important technical challenge of the system is:

> Preventing two customers from successfully booking the same vehicle for overlapping rental periods.

Rental periods use a half-open interval:

```text
[PickupUtc, ReturnUtc)
```

Two bookings overlap when:

```text
Existing.PickupUtc < New.ReturnUtc
AND
Existing.ReturnUtc > New.PickupUtc
```

Example:

```text
Booking A
10:00 ───────── 14:00

Booking B
12:00 ───────── 16:00

Result:
OVERLAP
```

While:

```text
Booking A
10:00 ───────── 14:00

Booking B
14:00 ───────── 18:00

Result:
NO OVERLAP
```

The system must guarantee correctness even when two booking requests arrive concurrently.

The exact concurrency strategy must be documented separately before implementation.

---

# 11. Service Architecture

The initial system will contain three backend services.

```text
                    React + TypeScript
                           │
                           ▼
                    API Gateway
                         YARP
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
   User Service     Vehicle Service    Booking Service
          │                │                │
          ▼                ▼                ▼
      User DB          Vehicle DB       Booking DB
```

---

# 12. User Service

## Responsibility

The User Service owns:

* User registration
* Authentication
* User profile
* User roles
* User account lifecycle

## Owns

```text
User
```

## Does Not Own

* Vehicle
* Booking
* Rental availability

---

# 13. Vehicle Service

## Responsibility

The Vehicle Service owns:

* Vehicle information
* Vehicle types
* Rental locations
* Vehicle lifecycle
* Vehicle management

## Owns

```text
Vehicle
VehicleType
Location
```

## Does Not Own

* Booking
* Customer booking history
* Booking transactions

---

# 14. Booking Service

## Responsibility

The Booking Service owns:

* Booking creation
* Booking retrieval
* Booking cancellation
* Booking lifecycle
* Rental-period validation
* Availability validation
* Booking concurrency control
* Booking transaction boundaries

## Owns

```text
Booking
```

The Booking Service is the main service responsible for protecting booking consistency.

---

# 15. Frontend

The frontend will be implemented using:

```text
React
TypeScript
Vite
```

The frontend will provide:

### Customer UI

```text
Login
Register
Home
Vehicle List
Vehicle Search
Vehicle Details
Booking
My Bookings
Booking Details
```

### Admin UI

```text
Dashboard
Vehicle Management
Vehicle Type Management
Location Management
Booking Management
```

The frontend architecture, component structure, state management, UI/UX rules, library selection, and performance strategy will be defined separately.

---

# 16. Backend Technology Direction

Initial backend direction:

```text
C#
.NET
ASP.NET Core
Entity Framework Core
SQL Server
```

Additional technologies will be introduced progressively.

Potential technologies:

```text
Redis
Kafka
YARP
Serilog
OpenTelemetry
FluentValidation
xUnit
Docker
k6
```

Libraries should not automatically be added.

Each dependency must be evaluated and justified in:

```text
docs/backend/03-backend-library-evaluation.md
```

---

# 17. Data Architecture

The project follows:

> Database per Service

```text
User Service
    │
    └── SQL Server
         User DB

Vehicle Service
    │
    └── SQL Server
         Vehicle DB

Booking Service
    │
    └── SQL Server
         Booking DB
```

There must be no cross-service database joins.

For example:

```text
Booking DB
     ❌
     │
     └── Direct query → Vehicle DB
```

is not allowed.

Instead:

```text
Booking Service
      │
      ├── REST
      │
      └── Event
            │
            ▼
      Vehicle Service
```

---

# 18. Caching Strategy

Redis will be introduced after the basic system is working correctly.

Potential caching targets:

```text
Vehicle types
Locations
Vehicle read models
Frequently requested vehicle information
```

Caching must not become the source of truth for booking correctness.

The database remains the source of truth for critical booking consistency.

Detailed caching strategy will be defined in:

```text
docs/backend/10-caching-strategy.md
```

---

# 19. Event-Driven Architecture

Kafka will be introduced after the synchronous version of the system is stable.

Potential domain events:

```text
BookingCreated
BookingConfirmed
BookingCancelled
BookingCompleted
VehicleStatusChanged
```

Initial goal:

```text
REST API
    ↓
Database
```

Later:

```text
REST API
    ↓
Database
    ↓
Outbox
    ↓
Kafka
    ↓
Consumers
```

The event-driven architecture should solve a real integration problem rather than being added only for demonstration.

---

# 20. Idempotency

Booking creation is a critical candidate for idempotency.

Example:

```text
Client
   │
   │ POST /bookings
   │ Idempotency-Key: abc123
   ▼
Booking Service
```

If the client retries the same request:

```text
Request 1 → Create Booking
Request 2 → Retry
Request 3 → Retry
```

the system must not accidentally create multiple bookings for the same logical operation.

Detailed idempotency behavior will be defined separately.

---

# 21. Transactional Outbox

The system will eventually use the Transactional Outbox pattern for reliable event publishing.

Target flow:

```text
                    Transaction
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
         Booking Table        Outbox Table
              │                     │
              └──────────┬──────────┘
                         │
                      COMMIT
                         │
                         ▼
                  Outbox Publisher
                         │
                         ▼
                       Kafka
```

This prevents the system from successfully updating the database while failing to publish the corresponding event.

---

# 22. Performance Engineering

Performance optimization will be introduced after correctness is established.

Areas to investigate:

## API

* Response time
* Serialization
* Pagination
* Request validation
* N+1 queries
* Unnecessary network calls

## Database

* Indexes
* Query plans
* Slow queries
* Join performance
* Projection
* Pagination
* Connection pool
* Transaction duration

## Cache

* Cache hit ratio
* TTL
* Invalidation
* Hot keys

## Messaging

* Kafka throughput
* Consumer lag
* Batch processing
* Retry behavior

Performance changes should be validated using measurements.

---

# 23. Database Partitioning

Database partitioning will be studied after the core database design is complete.

Potential candidate:

```text
Booking
```

because booking data can grow significantly over time.

Possible partition key:

```text
CreatedAt
```

or another appropriate time-based key.

The final strategy must be based on:

* Query patterns
* Data growth
* Maintenance requirements
* Partition elimination
* Index strategy

Partitioning must not be introduced merely because the system uses microservices.

Detailed design:

```text
docs/backend/14-database-partitioning.md
```

---

# 24. Database Sharding

Database sharding is a learning topic rather than an initial requirement.

The project should first understand:

```text
Single Database
      ↓
Partitioning
      ↓
Read Replication
      ↓
Sharding
```

Potential future sharding key:

```text
CustomerUserId
```

or another key determined by workload.

The project should include a documented comparison between:

* Database partitioning
* Read replicas
* Sharding

before implementing sharding.

Detailed design:

```text
docs/backend/15-database-sharding.md
```

---

# 25. Security

The initial system will use token-based authentication.

High-level requirements:

* Authentication
* Authorization
* Role-based access
* Password protection
* Input validation
* Secure API communication
* Protection of sensitive information

Example roles:

```text
Customer
Admin
```

Detailed security rules will be defined separately.

---

# 26. Observability

The system will progressively introduce observability.

Target capabilities:

```text
Logging
Metrics
Distributed Tracing
Health Checks
```

Potential technology:

```text
Serilog
OpenTelemetry
```

The goal is to understand:

```text
Request
  ↓
Gateway
  ↓
Service
  ↓
Database / Redis / Kafka
```

and identify where latency or failures occur.

---

# 27. Testing Strategy

Testing will exist at multiple levels.

```text
Unit Tests
    ↓
Integration Tests
    ↓
API Tests
    ↓
Concurrency Tests
    ↓
Load Tests
```

Important scenarios include:

* Booking creation
* Booking cancellation
* Invalid booking period
* Overlapping booking
* Concurrent booking requests
* Idempotent retry
* Transaction rollback
* Event publishing
* Cache failure
* Kafka consumer retry

---

# 28. Infrastructure

The initial local development environment will use Docker.

Potential containers:

```text
API Gateway
User Service
Vehicle Service
Booking Service
SQL Server
Redis
Kafka
```

Not all infrastructure needs to be enabled from day one.

The environment should evolve with the project.

Kubernetes is explicitly excluded from the initial scope.

---

# 29. Project Development Phases

## Phase 1 — Project Foundation

```text
Project setup
Repository structure
Documentation
Development environment
```

---

## Phase 2 — Core Backend

```text
User Service
Vehicle Service
Booking Service
SQL Server
REST APIs
Authentication
```

---

## Phase 3 — Frontend

```text
React
TypeScript
Authentication
Vehicle browsing
Vehicle details
Booking
Booking history
Admin pages
```

---

## Phase 4 — Correctness

```text
Transactions
Concurrency control
Booking state machine
Idempotency
Optimistic concurrency
```

---

## Phase 5 — Performance

```text
Indexes
Query optimization
Pagination
N+1 elimination
Connection pool tuning
API performance
```

---

## Phase 6 — Distributed Components

```text
Redis
Kafka
Event-driven communication
Transactional Outbox
Retry
Dead Letter Topic
Consumer idempotency
```

---

## Phase 7 — Scalability

```text
Database partitioning
Sharding concepts
Load testing
Performance benchmarking
```

---

## Phase 8 — Observability

```text
Structured logging
Metrics
Tracing
Health checks
Failure analysis
```

---

# 30. Out of Scope

The following features are intentionally excluded from the initial project.

## Business Features

* Real payment processing
* Complex pricing engine
* Discount/coupon system
* Insurance management
* Driver management
* Fleet GPS tracking
* Vehicle maintenance management
* Customer reviews
* Recommendation engine
* Loyalty program
* Complex invoicing

## Technical Infrastructure

* Kubernetes
* Multi-region deployment
* Service mesh
* Complex IAM
* Cloud-native production infrastructure
* Multi-datacenter deployment

## Additional Services

The following services will not be created initially:

```text
Payment Service
Notification Service
Search Service
Review Service
Pricing Service
Recommendation Service
```

They may be considered as future extensions if they provide meaningful learning value.

---

# 31. Documentation Structure

Project documentation is divided by responsibility.

```text
docs/
│
├── 00-project-overview.md
├── 01-requirements.md
├── 02-business-rules.md
├── 03-use-cases.md
├── 04-domain-model.md
├── 05-service-boundaries.md
├── 06-system-architecture.md
│
├── backend/
│   ├── 01-backend-architecture.md
│   ├── 02-backend-tech-stack.md
│   ├── 03-backend-library-evaluation.md
│   ├── 04-service-structure.md
│   ├── 05-database-design.md
│   ├── 06-api-design.md
│   ├── 07-domain-and-application-design.md
│   ├── 08-concurrency-and-transaction.md
│   ├── 09-error-handling-and-validation.md
│   ├── 10-caching-strategy.md
│   ├── 11-event-driven-and-kafka.md
│   ├── 12-outbox-and-idempotency.md
│   ├── 13-performance.md
│   ├── 14-database-partitioning.md
│   ├── 15-database-sharding.md
│   ├── 16-security.md
│   ├── 17-observability.md
│   └── 18-backend-development-guidelines.md
│
├── frontend/
│   ├── 01-frontend-architecture.md
│   ├── 02-frontend-tech-stack.md
│   ├── 03-frontend-library-evaluation.md
│   ├── 04-ui-ux-design.md
│   ├── 05-page-screen-specification.md
│   ├── 06-component-design.md
│   ├── 07-state-and-data-management.md
│   ├── 08-api-integration.md
│   ├── 09-performance.md
│   ├── 10-accessibility.md
│   └── 11-frontend-development-guidelines.md
│
├── architecture/
│   ├── 01-booking-flow.md
│   ├── 02-system-sequence-diagrams.md
│   ├── 03-data-flow.md
│   ├── 04-technical-decisions.md
│   └── 05-design-review.md
│
├── testing/
│   ├── 01-testing-strategy.md
│   └── 02-load-testing.md
│
├── infrastructure/
│   ├── 01-docker-environment.md
│   └── 02-local-development.md
│
├── 20-development-roadmap.md
├── 21-interview-learning.md
└── 22-future-improvements.md
```

---

# 32. Documentation Rules

Documentation must follow these rules.

### Rule 1 — No Duplicate Definitions

A business rule should have one authoritative location.

For example:

```text
Booking state transitions
→ docs/02-business-rules.md
```

Other documents may reference the rule but should not redefine it differently.

---

### Rule 2 — Architecture Before Implementation

Do not start implementation when important architectural decisions are still unresolved.

The expected flow is:

```text
Requirements
    ↓
Business Rules
    ↓
Domain Model
    ↓
Service Boundaries
    ↓
Architecture
    ↓
Technology Evaluation
    ↓
Technical Decisions
    ↓
Implementation Plan
    ↓
Coding
```

---

### Rule 3 — Document Decisions

Important decisions should include:

```text
Decision
Reason
Alternatives
Trade-offs
Consequences
```

---

### Rule 4 — Do Not Hide Unresolved Decisions

If a technical decision is not finalized, explicitly mark it:

```text
Status: TBD
```

Do not invent a decision simply to make the documentation look complete.

---

# 33. Development Gates

The project uses review gates.

## Gate 1 — Product Definition

Must confirm:

```text
Scope
Requirements
Business Rules
Use Cases
Domain
```

---

## Gate 2 — Architecture

Must confirm:

```text
Service Boundaries
Database Ownership
Architecture
Technology Stack
Library Selection
Booking Concurrency
Transaction Strategy
Security
```

---

## Gate 3 — Implementation Plan

Must confirm:

```text
Development Phases
Backend Tasks
Frontend Tasks
Database Tasks
Testing Tasks
Definition of Done
```

---

## Gate 4 — Implementation

Only after the previous gates are approved should coding begin.

---

# 34. Definition of Success

The project is considered successful when the developer can demonstrate:

### Architecture

* Why microservices were selected
* Why services are split this way
* Why each service owns its database
* How services communicate

### Backend

* Clean API design
* Correct business rules
* Proper transaction boundaries
* Correct concurrency handling
* Idempotent booking creation
* Error handling and validation

### Database

* Proper schema design
* Appropriate indexes
* Query optimization
* Understanding of partitioning
* Understanding of sharding

### Distributed Systems

* Redis caching
* Kafka messaging
* Consumer groups
* Retry
* Dead Letter Topic
* Outbox
* Idempotency

### Performance

* Identify bottlenecks
* Measure performance
* Optimize queries
* Optimize APIs
* Run load tests

### Observability

* Structured logs
* Metrics
* Distributed tracing
* Health checks

### Frontend

* React + TypeScript
* Clean component architecture
* Good UI/UX
* Server/client state separation
* API integration
* Performance optimization

---

# 35. Final Architecture Direction

The initial target architecture is:

```text
                         ┌──────────────────────┐
                         │   React + TypeScript  │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    API Gateway       │
                         │       YARP           │
                         └──────────┬───────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
      ┌───────────────┐     ┌───────────────┐     ┌────────────────┐
      │ User Service  │     │Vehicle Service│     │Booking Service │
      └───────┬───────┘     └───────┬───────┘     └───────┬────────┘
              │                     │                     │
              ▼                     ▼                     ▼
         ┌─────────┐           ┌─────────┐           ┌─────────┐
         │ User DB │           │Vehicle DB│          │Booking DB│
         └─────────┘           └─────────┘           └─────────┘
                                                        │
                                      ┌─────────────────┼────────────────┐
                                      │                 │                │
                                      ▼                 ▼                ▼
                                   Redis             Outbox           Kafka
```

However, the final architecture is **not considered fixed yet**.

Technology and architecture decisions must be reviewed and documented before implementation.

---

# 36. Guiding Principle

The project should follow:

```text
Keep It Small
      ↓
Make It Work
      ↓
Make It Correct
      ↓
Measure It
      ↓
Make It Fast
      ↓
Make It Distributed
      ↓
Make It Scalable
```

The purpose of this project is not to demonstrate how many technologies can be added.

The purpose is to demonstrate:

> **Why a technology is needed, what problem it solves, what trade-offs it introduces, and how to implement it correctly.**
