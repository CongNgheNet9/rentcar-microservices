# 04. Database Implementation Tasks

## 1. Scope

This document defines the database implementation work required for the Vehicle Rental System. It follows the approved database-per-service model and supports the implementation milestones without introducing cross-service database coupling.

---

## 2. Database Task Breakdown

### Task D01 — Local database environment

Objective:
- Prepare the local SQL Server infrastructure for development.

Dependencies:
- Project setup and approved database ownership model.

Deliverable:
- SQL Server instance or containerized setup for all three service databases.
- Environment configuration for local connection strings and migration execution.

Validation criteria:
- All service databases initialize successfully.
- Connection strings are valid for local development.
- The environment is reproducible for the team or for a single developer.

---

### Task D02 — User DB schema

Objective:
- Create the schema for the User Service database.

Dependencies:
- D01

Deliverable:
- Users table, key indexes, and supporting constraints.
- Optional audit and soft-delete fields as defined by the database design.

Validation criteria:
- User identity and role data are stored in the User DB only.
- Email uniqueness and status checks work correctly.
- User queries perform within acceptable limits for the MVP.

---

### Task D03 — Vehicle DB schema

Objective:
- Create the schema for the Vehicle Service database.

Dependencies:
- D01

Deliverable:
- VehicleTypes, Locations, and Vehicles tables.
- Indexes for catalog lookup and filtering.
- Operational status checks consistent with the domain rules.

Validation criteria:
- Vehicle metadata is stored in the Vehicle DB only.
- Catalog queries return expected results.
- Status and deactivation logic remains consistent with the business rules.

---

### Task D04 — Booking DB schema

Objective:
- Create the schema for the Booking Service database.

Dependencies:
- D01

Deliverable:
- Bookings table.
- BookingStatusHistory and IdempotencyKeys tables if used in the approved design.
- Indexes chosen for booking query and overlap checks.

Validation criteria:
- Booking records are fully owned by the Booking DB.
- Period and lifecycle constraints are enforced.
- Row-version or equivalent concurrency support is available for the approved strategy.

---

### Task D05 — Data integrity and constraints

Objective:
- Ensure the schema supports the approved business logic.

Dependencies:
- D02, D03, D04

Deliverable:
- Constraints for valid rental periods, statuses, and active/inactive transitions.
- Supporting validation for required fields and uniqueness rules.

Validation criteria:
- Invalid booking intervals are rejected at the database or application boundary.
- Required status and lifecycle rules are maintained.
- The database supports the expected invariants.

---

### Task D06 — Indexing and query review

Objective:
- Make the key business queries efficient enough for the MVP.

Dependencies:
- D02, D03, D04

Deliverable:
- Key indexes for user lookup, vehicle filtering, and booking overlap checks.
- Query review for most common read patterns.

Validation criteria:
- Common queries are efficient enough for small-scale load.
- Database access patterns remain aligned with approval and serviceownership rules.

---

### Task D07 — Booking concurrency database support

Objective:
- Support the approved concurrency strategy for overlapping rentals.

Dependencies:
- D04, D05, D06

Deliverable:
- Transactional pattern that enforces booking correctness.
- Constraint or locking support for the chosen overlap strategy.
- Retry behavior plan tied to the application layer.

Validation criteria:
- Concurrent booking requests for the same vehicle cannot both succeed.
- The database and application logic agree on how conflicts are handled.
- Adjacent and same-vehicle overlap semantics are unambiguous.

---

### Task D08 — Performance baseline and optimization

Objective:
- Measure and improve the database performance baseline only when there is evidence of a bottleneck.

Dependencies:
- D06, D07

Deliverable:
- Baseline query/transaction measurements.
- Improvement decisions documented with before/after evidence.

Validation criteria:
- Optimizations are tied to measured bottlenecks.
- No premature change is introduced.
- Booking correctness remains intact during optimization.

---

### Task D09 — Database partitioning and sharding experiments

Objective:
- Evaluate advanced scaling patterns only as a learning exercise.

Dependencies:
- D08

Deliverable:
- Experimental notes on partitioning and sharding possibilities.
- A recommendation to avoid introducing them before the business case is proven.

Validation criteria:
- Advanced scaling is documented as future work, not an MVP requirement.
- The project remains small and maintainable.

Implementation status:
- Preliminary design evaluation documented in [14-database-partitioning.md](../backend/14-database-partitioning.md) and [15-database-sharding.md](../backend/15-database-sharding.md).
- The hands-on experiment remains pending D08's representative Booking DB baseline and an approved experimental workload. No production database changes are justified by the current B12 evidence; partitioning and sharding remain future experiments gated on measured need.

---

## 3. Database Execution Sequence

1. D01
2. D02
3. D03
4. D04
5. D05
6. D06
7. D07
8. D08
9. D09

This sequence keeps the schema grounded in the actual business rules, then adds optimization and scale experiments only after the core system works.
