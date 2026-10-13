# 02. Backend Implementation Tasks

## 1. Scope

This document defines the backend implementation tasks for the Vehicle Rental System. It follows the approved service boundaries, database ownership model, and milestone sequencing.

---

## 2. Backend Task Breakdown

### Task B01 — Repository and solution setup

Objective:
- Create the backend solution structure and local development baseline.

Dependencies:
- Approved architecture and technology evaluation.

Deliverable:
- Solution with User Service, Vehicle Service, Booking Service, and Gateway projects.
- Shared configuration and environment conventions.

Validation criteria:
- The solution builds locally.
- All projects run with the expected configuration.
- Local database and app settings are defined clearly.

---

### Task B02 — User Service foundation

Objective:
- Implement the user identity and authentication domain.

Dependencies:
- B01

Deliverable:
- User DB migrations and schema.
- User registration and login endpoints.
- Password hashing and JWT integration.
- Role and status management.

Validation criteria:
- Valid registration creates a user record.
- Passwords are never stored in plain text.
- Login returns valid tokens for known users.
- Invalid credentials fail correctly.

---

### Task B03 — Vehicle Service foundation

Objective:
- Implement vehicle master data management.

Dependencies:
- B01

Deliverable:
- Vehicle DB migrations and schema.
- CRUD and query endpoints for vehicles, types, and locations.
- Vehicle status deactivation flows.

Validation criteria:
- Admin can manage catalog data.
- Customer-facing vehicle listing works correctly.
- Inactive or retired vehicles are not used as active rental inventory.

---

### Task B04 — Booking Service foundation

Objective:
- Implement the booking service skeleton and persistence layer.

Dependencies:
- B01, B02, B03

Deliverable:
- Booking DB schema and migrations.
- Booking endpoints for create, retrieve, cancel, and complete flows.
- Booking lifecycle tracking and status transitions.

Validation criteria:
- Basic create/retrieve flows work.
- Data is stored in the Booking DB only.
- Service boundaries remain respected.

Implementation boundary:
- B04 through B07 are implemented: the service validates catalog eligibility, prevents overlapping reservations transactionally, requires idempotency keys, and supports the documented booking lifecycle.
- Vehicle Service checks are remote and occur before the Booking DB transaction; vehicle deactivation can still race with a booking request, as bounded by the concurrency design.

---

### Task B05 — Booking availability and overlap checks

Objective:
- Implement the booking correctness rules that prevent invalid overlap.

Dependencies:
- B04

Deliverable:
- Booking domain logic for rental period validation.
- Availability checks and overlap prevention.
- Support for adjacent rental periods per the approved business rule.

Validation criteria:
- Overlapping periods for the same vehicle are rejected.
- Different vehicles may be booked concurrently.
- Invalid intervals are rejected.
- Adjacent half-open intervals are permitted.
- The availability endpoint reports active catalog eligibility and booking conflicts.

Implementation status:
- Implemented with a transaction-owned `sp_getapplock` keyed by vehicle ID and an overlap query covering `Pending`, `Confirmed`, and `Active`.
- Customer cancellation, Admin rejection, and Admin return use the same vehicle lock when they release a reservation.
- The lock is held with the overlap check and database writes until transaction completion.
- Vehicle status and active pickup/return locations are checked through Vehicle Service before creation; the availability endpoint is advisory rather than a reservation.
- Verified against the Docker SQL Server setup: all 5 SQL Server integration tests pass, covering same-vehicle races, adjacent periods, different vehicles, idempotency races, and reservation-releasing lifecycle transitions. The complete Booking Service test project also passes (24 passed, 0 skipped).

---

### Task B06 — Booking idempotency and duplicates

Objective:
- Prevent duplicate booking creation from retrying the same request.

Dependencies:
- B04, B05

Deliverable:
- Idempotency key handling in Booking Service.
- Duplicate request detection and safe repeat response behavior.

Validation criteria:
- Repeated requests with the same idempotency key return the same result.
- Missing, blank, overlong, or payload-mismatched keys are rejected.
- The database transaction preserves integrity.

Implementation status:
- Implemented with an `IdempotencyKeys` table keyed by authenticated customer and case-sensitive key.
- The request hash, booking, lifecycle history, and replay response are stored atomically; failed availability checks do not consume a key.
- A retry of a successful request returns the original response.

---

### Task B07 — Cancellation and completion logic

Objective:
- Implement the booking lifecycle management rules.

Dependencies:
- B04, B05

Deliverable:
- Booking cancellation flow.
- Complete rental flow from confirmation through pickup, return, and completion.
- Business-rule enforcement for invalid transitions.

Validation criteria:
- Eligible bookings can be cancelled.
- Ineligible transitions are rejected.
- Booking status history reflects transitions correctly.

Implementation status:
- Implemented transitions: Pending -> Confirmed/Rejected/Cancelled; Confirmed -> Active/Cancelled; Active -> Returned; Returned -> Completed.
- Every transition records its actor; cancellation, rejection, and return may include a reason in status history.
- Rowversion protects transitions from stale concurrent writes.

---

### Task B08 — API Gateway integration

Objective:
- Expose a single external API boundary for the frontend.

Dependencies:
- B02, B03, B04

Deliverable:
- YARP routing configuration.
- Authentication/authorization edge gating.
- Request routing to the correct service.

Validation criteria:
- Frontend calls route to the correct service.
- Unauthorized requests are blocked at the gateway boundary.
- Service topology stays hidden from the client interface.

Implementation status:
- YARP routes auth, customer/profile, catalog, booking, and Admin API paths to their owning services.
- The gateway validates JWT signatures, issuer, audience, lifetime, and roles before forwarding protected paths; User, Vehicle, and Booking Services continue validating authorization at their own boundaries.
- Registration and login are anonymous at the gateway; unknown routes and all other paths require authentication by default.
- CORS allows only configured frontend origins. Cluster addresses and allowed origins are configurable in appsettings.
- Set `JwtSettings__SigningKey` in the gateway environment to the same local secret used by all three services before starting it.
- In local development the backend services remain reachable on their own ports; hiding those ports from clients requires deployment/network ingress to expose only the gateway.
- Validation: the full solution builds with zero warnings/errors. Local HTTP smoke checks returned 200 from `/health`, 401 for an anonymous catalog request, 403 when a Customer token accessed an Admin route, 502 for an Admin token reaching that route with its upstream intentionally stopped, and 204 for an allowed CORS preflight. Login also returned 502 with User Service stopped, confirming the anonymous route forwarded to its configured cluster. End-to-end service/database behavior remains to be verified with the services running.

---

### Task B09 — Error handling and validation hardening

Objective:
- Standardize API error responses and validation controls.

Dependencies:
- B02, B03, B04, B08

Deliverable:
- Validation for request DTOs and business rules.
- Consistent error response structure.
- Security-aware handling of unauthorized and conflict scenarios.

Validation criteria:
- Validation failures return clear 400-style responses.
- Authorization failures return proper status codes.
- Conflicts and dependency failures use consistent Problem Details responses without leaking internal exception information.

Implementation status:
- User Service registration and login validation, duplicate-email, invalid-credential, and missing-claim failures now return RFC 9457 Problem Details instead of ad-hoc anonymous JSON or empty responses.
- User Service now uses the shared ASP.NET Core Problem Details, exception-handling, and status-code-pages middleware, matching the response approach already used by Vehicle Service and Booking Service.
- Existing User, Vehicle, and Booking request/business validators remain the authoritative validation rules; service error handlers map validation, authorization, conflict, and dependency exceptions to their existing HTTP status codes.
- Validation: the full solution builds with zero warnings/errors and all non-database tests pass (28 passed); five SQL Server integration tests remain skipped because `BOOKING_DB_TEST_CONNECTION_STRING` is unset. Gateway smoke checks verified standard Problem Details on anonymous 401 responses; User Service-specific error responses require an HTTP run with its database available.
- Conflict scenarios are handled consistently.

---

### Task B10 — Redis caching integration

Objective:
- Add caching only for clearly justified read-heavy scenarios.

Dependencies:
- B05, B08

Deliverable:
- Redis setup and cache access patterns for approved read data.
- Cache invalidation strategy.

Validation criteria:
- Cache hit and miss behavior is tested.
- Booking correctness remains the source of truth.
- Cache failures do not break the core system.

Implementation status:
- Deferred. No caching layer was introduced in this task.
- The approved architecture classifies Redis as `REQUIRED_LATER` and explicitly excludes "Redis before a measured read-access requirement exists" (docs/backend/01-backend-architecture.md, docs/backend/03-backend-library-evaluation.md, docs/architecture/03-data-flow.md).
- No measured read access currently demonstrates a read-heavy or repeated-query bottleneck for vehicle, type, location, or booking data, so there is no approved read data to cache.
- No Redis packages, connection settings, cache access code, or infrastructure were added; the solution gains no new dependency.
- Trigger to enter this task: a measured read-access need (for example, evidence gathered by the performance measurement work in B12/B14). Until that evidence exists, B10 stays deferred and Milestone 6 is not started.
- Re-entry evidence (to be produced by B12/T09, not by this task):
  - Candidate read paths: Vehicle Service catalog browse/filter endpoints and Booking availability checks.
  - Required form: baseline/change/result measurement records showing a repeated-read bottleneck attributable to database reads under representative load.
  - Exact numeric thresholds (QPS, p95 latency, DB read load): TBD until the B12/T09 measurement harness exists.
- Re-entry additionally requires an approved caching design covering which read data to cache, key strategy, TTL, and invalidation, while keeping the Booking DB as the source of truth and ensuring cache failures degrade gracefully.
- Validation: since Redis is not enabled, the cache hit/miss and cache-failure criteria are not applicable yet; the solution remains unchanged and continues to build without warning.

---

### Task B11 — Kafka and transactional outbox

Objective:
- Implement asynchronous integration only after the synchronous system is stable.

Dependencies:
- Synchronous booking path stable (B04–B07); the B10 Redis deferral does not block this task.

Deliverable:
- Outbox records for committed business transactions.
- Kafka event publishing strategy.
- Consumer logic for approved events only.

Validation criteria:
- Events are sent only after successful commit.
- Duplicate processing is safe.
- Consumer failure handling is documented and tested.

Implementation status:
- **Blocked at the design/approval gate; no runtime implementation is authorized yet.** Do not add Kafka, an outbox table, producer, or consumer until a concrete asynchronous integration requirement and its consumer are approved.
- Kafka is `REQUIRED_LATER`, not a requirement to install a broker now. The approved architecture requires a real async integration need first (docs/backend/01-backend-architecture.md, docs/backend/02-backend-tech-stack.md, docs/backend/03-backend-library-evaluation.md).
- The event names in docs/06-system-architecture.md are examples of possible future use cases, not an approved event catalog. No consumer or event contract is currently approved; therefore implementing a generic outbox or publishing a speculative `BookingCreated` event would add behavior without a defined owner or use.
- Current cross-service integration is synchronous REST: Booking Service calls Vehicle Service for booking eligibility. The B12 local run verified login, catalog reads, and the availability route through the Gateway against the local service databases, but did not establish a requirement to replace or supplement this flow asynchronously.
- No local Kafka-compatible broker is configured. This is not the current blocker: choosing/starting a broker before approving an event contract and consumer would be premature.
- **Re-entry gate, to be completed before changing application code:**
  1. Record the concrete business/technical need that synchronous REST cannot meet and the consequence of not adding asynchronous delivery.
  2. Approve one narrowly scoped event, its owning producer and database transaction, named consumer(s), and consumer outcome.
  3. Approve the event schema/versioning, identity/correlation fields, ordering scope, duplicate semantics, retention/privacy constraints, and compatibility policy.
  4. Approve delivery operations: retry/backoff, poison-message handling and DLQ/replay ownership, outbox cleanup, monitoring, and recovery expectations.
  5. Select a local Kafka-compatible broker and deployment configuration that supports the approved development and integration tests.
- **Implementation sequence after that gate:** document the approved contract; add an outbox row atomically with the owning business transaction; test rollback/commit behavior against SQL Server; add a publisher and broker integration test; implement only the approved consumer with idempotent processing and failure/replay tests.
- Until the gate is approved, B11 remains blocked and its Kafka publish/duplicate/consumer validation criteria are not applicable. Do not mark B11 complete or use a no-op consumer/demo event to satisfy the milestone.

---

### Task B12 — Performance optimization

Objective:
- Measure and fix database and API bottlenecks with evidence.

Dependencies:
- B09; the B10/B11 deferral does not block measurement — B12 output feeds the B10 re-entry decision.

Deliverable:
- Query and index tuning.
- Pagination and transaction duration review.
- Bottleneck documentation with baseline/change/result records.
- Read-access measurements usable as B10 re-entry evidence.

Validation criteria:
- Improvements are measured before and after.
- The optimization is justified by evidence.
- Business rules remain unchanged.

Implementation status:
- Added a read-only k6 baseline workload covering repeated Vehicle Catalog reads and Booking Availability checks through the Gateway; login occurs once during setup and booking creation is never called.
- The script reports request latency and failures under separately configurable arrival rates. Use an existing Customer account and an active vehicle/location with a representative catalog dataset.
- No query/index changes or caching have been made without a measured bottleneck.
- Initial local baseline completed on 2026-10-11: 30 seconds, 10 catalog iterations/s, 5 availability iterations/s, 100 synthetic available vehicles, 3 vehicle types, and 1 active location. It completed 450 iterations and 1,051 HTTP requests with 0 failed requests; all 1,052 checks passed. Overall HTTP p95 was 30.56 ms (catalog vehicles 20.68 ms; availability 38.05 ms).
- Detailed summary: `verhicle-rental-system-be/tests/performance/results/b12-baseline-2026-10-11.json`. The summary exporter strips setup data so the bearer token is not persisted.
- This local synthetic run establishes an initial measurement only. It does not establish a database-read bottleneck or justify Redis: acceptance thresholds and database-read utilization evidence remain TBD. No query/index changes or caching are made based on this run.

---

### Task B13 — Partitioning and sharding experiments

Objective:
- Explore scaling strategies as a learning exercise only.

Dependencies:
- B12

Deliverable:
- Experimental design notes and database partitioning/sharding discussion.
- No production change unless justified by measured need.

Validation criteria:
- The project remains small and understandable.
- Scaling decisions are clearly marked as experiments or future work.

Implementation status:
- Completed as a design evaluation only; no production schema, data routing, or runtime code was changed.
- Partitioning and sharding are explicitly rejected for the current demo/MVP: B12 is a short local baseline over 100 synthetic vehicles, not evidence of booking-table scale, database saturation, a retention/maintenance problem, or a capacity limit.
- Added [database partitioning evaluation](../backend/14-database-partitioning.md) and [database sharding evaluation](../backend/15-database-sharding.md), including current query locality, SQL Server/key correctness constraints, disposable experiment plans, and objective adoption gates.
- The same-vehicle overlap invariant is a blocker for customer-keyed booking shards unless a single authoritative coordination design is demonstrated; vehicle-keyed sharding instead makes customer history a cross-shard query.
- Result: keep the app on one database per service. Revisit only with representative workload evidence and after simpler query/index/capacity options are evaluated.
- This task does not add a user-facing experience or make the application deployable; see D09/B13's learning-only scope. A public demo requires a separate deployment/readiness task.

---

### Task B14 — Observability and load testing

Objective:
- Add instrumentation for logs, metrics, and runtime diagnostics.

Dependencies:
- B09, B12

Deliverable:
- Structured logging and OpenTelemetry configuration.
- k6 load-test scenarios for critical flows.

Validation criteria:
- API latency and error patterns are observable.
- Critical flows are confirmed under load.
- The system remains traceable during investigation.

---

## 3. Backend Execution Sequence

1. B01
2. B02
3. B03
4. B04
5. B05
6. B06
7. B07
8. B08
9. B09
10. B10
11. B11
12. B12
13. B13
14. B14

This sequence keeps the critical business logic generating correct output before advanced infrastructure is layered in.
