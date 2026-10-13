# 06. Definition of Done

## 1. Purpose

This document defines the exit criteria for each milestone and the overall completion bar for the Vehicle Rental System project. It is intended to keep the project realistic, incremental, and aligned with the approved architecture.

---

## 2. Definition of Done by Milestone

### Milestone 0 — Project Setup

Definition of done:
- Repository structure is created.
- Local environment and database setup are documented and runnable.
- Solution bootstrap is stable.
- Dependencies are limited to the approved stack.

---

### Milestone 1 — User Service

Definition of done:
- User registration and login work end-to-end.
- Passwords are hashed.
- JWT-based protection works for authenticated endpoints.
- Role restrictions are enforced correctly.

---

### Milestone 2 — Vehicle Service

Definition of done:
- Vehicle catalog management works for admins.
- Customer vehicle browsing and filtering work.
- Vehicle lifecycle status is respected.
- Service ownership remains isolated to the Vehicle DB.

---

### Milestone 3 — Booking Service Core

Definition of done:
- Booking creation, retrieval, cancellation, and completion are functional.
- Booking correctness rules are enforced.
- Duplicate and overlapping bookings are prevented as designed.
- Booking data is owned by the Booking DB only.

---

### Milestone 4 — Gateway + Frontend Shell

Definition of done:
- Frontend can authenticate and call the backend through the API Gateway.
- Customer and admin journeys are available in the UI.
- Protected routes and actions follow the correct authorization model.

---

### Milestone 5 — Integration and Correctness Hardening

Definition of done:
- End-to-end flows work across services.
- Validation and business-rule errors are handled clearly.
- Integration and security tests pass for the main flows.
- Major user journeys are stable and traceable.

---

### Milestone 6 — Redis Caching

Definition of done:
- Redis is used only for approved, documented use cases.
- Cache hit and miss behavior is measured and tested.
- Booking correctness remains independent from cache state.

---

### Milestone 7 — Kafka + Outbox + Idempotency Expansion

Definition of done:
- Before implementation, an asynchronous integration requirement, producer, event contract, and named consumer are approved; otherwise the milestone stays deferred with no runtime code or broker.
- Events are published only after a successful business transaction.
- Consumers handle retries and duplicates safely.
- Outbox or equivalent recovery behavior is validated.

---

### Milestone 8 — Performance, Partitioning, and Observability

Definition of done:
- This milestone is not blocked by a deferred Kafka milestone.
- Performance bottlenecks are measured before optimization.
- Optimization decisions are evidence-based.
- Observability and load tests are in place.
- Partitioning and sharding remain explicit future-learning topics unless a clear business case appears.

---

## 3. Final Project Completion Criteria

The project is complete when all of the following are true:

- The architecture remains consistent with the approved documents.
- User, Vehicle, and Booking services each own their own database and domain responsibilities.
- The booking system enforces correctness under overlapping request scenarios.
- Authentication and authorization boundaries are enforced.
- The core customer and admin flows work end-to-end.
- The project demonstrates the required learning outcomes without unnecessary complexity.
- Advanced topics such as Redis and Kafka are introduced only when justified by the approved design.

---

## 4. Exit Checklist

Before declaring the project ready for review, confirm:

- [ ] Business rules are implemented consistently.
- [ ] Service boundaries are respected.
- [ ] No undocumented cross-service database access is added.
- [ ] Booking correctness is verified under concurrent requests.
- [ ] Tests cover critical business flows.
- [ ] Security checks are in place for protected routes.
- [ ] Advanced infrastructure is justified and tracked.
- [ ] Documentation remains aligned with the implemented system.

---

## 5. Review Status

The project is ready for review when each milestone is complete and the final checklist is satisfied.
