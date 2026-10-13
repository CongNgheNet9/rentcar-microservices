# 01. Development Phases

## 1. Purpose

This document defines the incremental implementation plan for the Vehicle Rental System. It is intentionally ordered so that the project reaches a correct MVP before introducing advanced architecture topics such as Redis, Kafka, partitioning, sharding, and load testing.

The plan assumes a single developer working in a small learning project and follows the approved architecture and business rules already documented in the project.

---

## 2. Implementation Principles

- Build in small, testable milestones.
- Keep each milestone independent enough to run and validate.
- Prioritize booking correctness before performance optimization.
- Introduce Redis and Kafka only after the core synchronous system is working.
- Match each task to an approved requirement, service boundary, or architecture decision.
- Do not add scope beyond the approved system definition.

---

## 3. Milestone Overview

### Milestone 0 — Project Setup

Objective:
- Create the repository structure, solution layout, local developer environment, and database foundation.

Dependencies:
- Approved project overview and architecture documentation.

Deliverable:
- Solution skeleton for the three services and shared contracts where needed.
- Docker Compose setup for SQL Server and supporting local infrastructure.

Validation:
- Services can start locally.
- Databases initialize successfully.
- Local environment is reproducible.

---

### Milestone 1 — User Service

Objective:
- Implement user registration, authentication, and core identity flows.

Dependencies:
- Milestone 0

Deliverable:
- User Service with login/register endpoints.
- User DB schema and migrations.
- JWT/authentication flow for protected endpoints.

Validation:
- User registration succeeds for valid input.
- Duplicate emails are rejected.
- Authenticated calls authorize valid roles.

---

### Milestone 2 — Vehicle Service

Objective:
- Implement vehicle catalog management and location/type administration.

Dependencies:
- Milestone 0
- Milestone 1 for auth integration patterns

Deliverable:
- Vehicle Service with admin and browse endpoints.
- Vehicle DB schema and migrations.
- Vehicle lookup and status management.

Validation:
- Admin can create and update vehicles.
- Customers can browse filtered vehicle listings.
- Vehicle status and deactivation rules are enforced.

---

### Milestone 3 — Booking Service Core

Objective:
- Implement booking creation, retrieval, cancellation, and lifecycle behavior.

Dependencies:
- Milestone 0
- Milestone 1
- Milestone 2

Deliverable:
- Booking Service with booking creation and validation.
- Booking DB schema and migrations.
- Overlap prevention using the approved concurrency strategy.
- Idempotent request handling for duplicate booking creation attempts.

Validation:
- A valid booking is created successfully.
- Overlapping booking requests for the same vehicle are prevented.
- Adjacent bookings are allowed when allowed by the business rule.
- Cancellation and completion flows work correctly.

---

### Milestone 4 — Gateway + Frontend Shell

Objective:
- Put the system behind a single external API entry point and connect the UI to it.

Dependencies:
- Milestones 1 to 3

Deliverable:
- API Gateway routing configuration.
- React + TypeScript frontend application shell.
- Login, vehicle browsing, and booking screens.

Validation:
- Frontend can authenticate and call backend routes.
- UI reflects the core user journey.
- Protected endpoints and admin screens are correctly gated.

---

### Milestone 5 — Integration and Correctness Hardening

Objective:
- Close the functional gaps across the system and verify end-to-end correctness.

Dependencies:
- Milestones 1 to 4

Deliverable:
- End-to-end customer flow from search to booking.
- Admin operational flows for vehicle and booking management.
- Integration tests around service calls, validation, and error handling.

Validation:
- Booking system correctness holds under concurrent request simulation.
- Error handling, validation, and security boundaries behave correctly.
- The main user journey works successfully end-to-end.

---

### Milestone 6 — Redis Caching

Objective:
- Add cache layers only where justified by measured access patterns and documented requirements.

Dependencies:
- Milestone 5

Deliverable:
- Approved Redis-backed caching for read-heavy or repeated queries.
- Cache invalidation strategy for vehicle and booking-related data.

Validation:
- Cache hit/miss behavior is measurable.
- Cached data does not become the source of truth.
- Booking correctness remains unaffected.

---

### Milestone 7 — Kafka + Outbox + Idempotency Expansion

Objective:
- Implement asynchronous event-driven integration only where the approved architecture requires it.

Dependencies:
- A concrete asynchronous integration requirement and event/consumer contract approved after the synchronous system is stable. Redis/Milestone 6 is not a prerequisite; its deferral does not block this milestone.

Deliverable:
- Only after approval: outbox pattern for the owning committed transaction; Kafka producer and consumer flow for the approved event; retry, duplicate handling, and DLQ or recovery behavior as specified in the design.
- If no event and consumer are approved, no Kafka/outbox code or broker is added and this milestone remains deferred.

Validation:
- Before implementation: a documented async need, named producer/consumer, approved event contract, operational failure policy, and local broker/test plan exist.
- After implementation: events are published only after successful business transaction commit; duplicate delivery is handled safely; consumers recover correctly after failure.

---

### Milestone 8 — Performance, Partitioning, and Observability

Objective:
- Measure bottlenecks, optimize based on evidence, and validate the architecture under load.

Dependencies:
- Core synchronous system and a measurable performance or observability objective. This milestone does not depend on Milestone 7; Kafka may remain deferred.

Deliverable:
- SQL query indexing and optimization work.
- Pagination and transactional tuning where justified.
- Load testing with k6.
- Observability and structured logging improvements.
- Partitioning/sharding experiments documented as architecture learning exercises, not as default production design.

Validation:
- Performance improvements are measured before and after.
- Optimization decisions are supported by evidence.
- The system remains correct under load.

---

## 4. Recommended Execution Order

1. Setup and local environment
2. User Service
3. Vehicle Service
4. Booking Service core correctness
5. Gateway and frontend shell
6. End-to-end verification and hardening
7. Performance baseline and measurement (B12/T09; already started)
8. Redis only if measured read bottleneck evidence and an approved cache design justify it
9. Kafka + Outbox only after the async-integration approval gate is satisfied
10. Observability, load testing, and scaling experiments when their objectives are defined

These topics are evidence- and requirement-gated, not a mandatory linear queue. Deferring Redis or Kafka does not block independent performance measurement or observability work.

---

## 5. Phase Exit Rule

A milestone is complete only when:

- The task set for that milestone is implemented.
- Business rules are validated.
- Tests for critical paths pass.
- The design remains consistent with the approved documentation.
- The scope does not broaden beyond the approved architecture.

---

## 6. Final Development Objective

The final project should be a small but realistic vehicle rental system that demonstrates:

- Microservice separation for user, vehicle, and booking ownership
- Booking correctness under concurrency stress
- API and UI integration
- Secure authorization boundaries
- Correct use of Redis and Kafka only when justified
- Clear evidence of performance measurement and optimization
- A solid learning foundation for backend architecture interviews and portfolio work
