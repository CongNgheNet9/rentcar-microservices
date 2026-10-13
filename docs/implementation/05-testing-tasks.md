# 05. Testing Tasks

## 1. Scope

This document defines the test work required for the Vehicle Rental System. Testing is organized around the approved business rules, service boundaries, and architecture milestones. The goal is to validate correctness before introducing advanced performance or event-driven concerns.

---

## 2. Testing Principles

- Build tests around real business behavior, not just API status codes.
- Prioritize booking correctness tests before performance and scalability testing.
- Keep tests focused on each service’s ownership boundary.
- Add integration tests for end-to-end flows that cross service or gateway boundaries.
- Add load tests only after the functional system is stable.

---

## 3. Test Task Breakdown

### Task T01 — Unit tests for domain rules

Objective:
- Validate core domain and business-rule logic.

Dependencies:
- Service implementations for User, Vehicle, and Booking domains.

Deliverable:
- Unit tests for user validation, vehicle status rules, booking overlap logic, and lifecycle transitions.

Validation criteria:
- Invalid inputs and invalid transitions fail as expected.
- Valid scenarios succeed when the business rules permit them.

---

### Task T02 — User authentication tests

Objective:
- Validate registration, login, and authorization behavior.

Dependencies:
- User Service implementation.

Deliverable:
- Tests for duplicate emails, invalid credentials, and protected endpoint access.

Validation criteria:
- Unauthorized calls fail with the correct response.
- Valid user sessions are accepted.
- Role-based access is enforced.

---

### Task T03 — Vehicle catalog tests

Objective:
- Validate catalog operations and status handling.

Dependencies:
- Vehicle Service implementation.

Deliverable:
- Tests for create/update/deactivate flows and search/filter behavior.

Validation criteria:
- Admin actions work correctly.
- Deactivated or retired vehicles do not appear in active listings.
- Search/filter results reflect the correct underlying data.

---

### Task T04 — Booking creation correctness tests

Objective:
- Validate the approved booking rules.

Dependencies:
- Booking Service implementation.

Deliverable:
- Tests for valid booking creation, invalid booking dates, overlapping bookings, adjacent periods, and cancellation eligibility.

Validation criteria:
- Correct booking requests succeed.
- Invalid and conflicting requests fail with clear business errors.
- The system enforces the approved rental time semantics.

---

### Task T05 — Concurrency tests for booking overlap

Objective:
- Verify correctness under concurrent booking attempts for the same vehicle.

Dependencies:
- Booking concurrency strategy implementation.

Deliverable:
- Concurrent booking scenarios for same-vehicle overlap, adjacent period handling, and retry-after-conflict behaviors.

Validation criteria:
- Only one valid booking succeeds in the overlapping window.
- Retry behavior and idempotency remain correct.
- The database and application logic agree on conflict handling.

SQL Server verification:
- From the backend root, copy `.env.example` to `.env` and replace the sample password with a strong local-only value, or set `BOOKING_SQL_PASSWORD` directly in the shell before running `docker compose -f docker-compose.booking-db.yml up -d --wait`.
- Set `BOOKING_DB_TEST_CONNECTION_STRING` to `Server=localhost,14339;Database=master;User Id=sa;Password=<BOOKING_SQL_PASSWORD>;Encrypt=True;TrustServerCertificate=True;MultipleActiveResultSets=true`.
- Run `dotnet test src/Services/BookingService/BookingService.Api.Tests/BookingService.Api.Tests.csproj`; the SQL Server integration cases are skipped when the connection-string environment variable is absent.
- Stop the container with `docker compose -f docker-compose.booking-db.yml down`; the named database volume is retained for the next run.
- The integration tests create and drop uniquely named databases and apply the real EF migrations for each test.
- The integration tests exercise concurrent overlapping creates, adjacent periods, different vehicles, duplicate idempotency retries, mismatched keys, and the reservation-releasing lifecycle transition against SQL Server.
- A passing unit-test run does not replace these database integration tests.

---

### Task T06 — API integration tests

Objective:
- Validate the end-to-end request flow across the API Gateway and backend services.

Dependencies:
- Completed backend and gateway implementation.

Deliverable:
- Integration tests for login, vehicle listing, booking creation, cancellation, and admin actions.

Validation criteria:
- The system works through the public API route.
- Error handling remains consistent across requests.
- Proper security restrictions are enforced at the API boundary.

---

### Task T07 — Frontend smoke tests

Objective:
- Validate the main UI flows that deliver the learning project’s business value.

Dependencies:
- Frontend implementation.

Deliverable:
- Smoke tests for registration, login, browsing, and booking.

Validation criteria:
- The main customer journey works in the browser.
- Admin screens can be reached by authorized users.
- User-visible validation messages align with backend behavior.

---

### Task T08 — Resilience and failure-mode tests

Objective:
- Validate retry, duplicate delivery, and failure handling for the approved reliability design.

Dependencies:
- Redis and Kafka/Outbox implementation where enabled.

Deliverable:
- Tests for duplicate event handling, retry safety, and failed consumer recovery.

Validation criteria:
- Retries do not create duplicate business results.
- Failure and recovery states are predictable.
- The system remains consistent after retry or replay scenarios.

---

### Task T09 — Performance and load tests

Objective:
- Measure system behavior under load after the core system is stable.

Dependencies:
- Completed functional implementation and optimization work.

Deliverable:
- k6 scenarios for critical flows, especially booking search and booking creation.
- Read-heavy workload testing for common API patterns.

Validation criteria:
- Performance bottlenecks are identified with evidence.
- The system remains stable and correct during load.
- Improvements are measured before and after the optimization.

Initial B12 read baseline:
- Script: `verhicle-rental-system-be/tests/performance/b12-read-baseline.js`.
- The script runs read-only repeated Vehicle Catalog requests and Booking Availability checks through the Gateway. It does not create bookings or change catalog data.
- Use an existing Customer account and active vehicle/location IDs. Example from the backend root:

```powershell
$env:USER_EMAIL = "customer@example.test"
$env:USER_PASSWORD = "<local-test-password>"
$env:BASE_URL = "http://host.docker.internal:5058"
$env:VEHICLE_ID = "1"
$env:PICKUP_LOCATION_ID = "1"
$env:RETURN_LOCATION_ID = "1"
$env:CATALOG_RATE = "10"
$env:AVAILABILITY_RATE = "5"
$env:DURATION = "30s"
$env:SUMMARY_FILE = "/results/b12-read-baseline.json"
$scriptDirectory = Join-Path (Get-Location) "tests\performance"
$resultsDirectory = Join-Path $scriptDirectory "results"
New-Item -ItemType Directory -Force -Path $resultsDirectory | Out-Null
docker run --rm --mount "type=bind,source=$scriptDirectory,target=/scripts,readonly" --mount "type=bind,source=$resultsDirectory,target=/results" -e BASE_URL -e USER_EMAIL -e USER_PASSWORD -e VEHICLE_ID -e PICKUP_LOCATION_ID -e RETURN_LOCATION_ID -e CATALOG_RATE -e AVAILABILITY_RATE -e DURATION -e SUMMARY_FILE grafana/k6 run /scripts/b12-read-baseline.js
```

- Record environment, dataset size, request rates, duration, failures, and the reported `http_req_duration` p95 before proposing an optimization. Do not treat an empty catalog, failed checks, or an unrepresentative dataset as B10 re-entry evidence.
- Thresholds remain TBD until a valid baseline exists. The first run is evidence gathering, not a pass/fail performance target.
- The script removes `setup_data` from exported summaries so the login bearer token is not persisted in the result JSON.

Initial local run (2026-10-11):
- Result: `verhicle-rental-system-be/tests/performance/results/b12-baseline-2026-10-11.json`.
- Environment: Windows host, APIs running locally, SQL Server 2022 Docker container with separate logical User, Vehicle, and Booking databases.
- Dataset: 100 available synthetic vehicles, 3 vehicle types, 1 active location; test data was created in the local database for this run.
- Load: 30 seconds; catalog 10 iterations/s, availability 5 iterations/s; 15 max VUs.
- Outcome: 1,051 HTTP requests, 450 iterations, 0 failed requests, and all 1,052 checks passed.
- Latency: overall `http_req_duration` p95 30.56 ms; vehicle catalog p95 20.68 ms; vehicle types p95 18.41 ms; locations p95 18.26 ms; availability p95 38.05 ms.
- This is a successful initial local baseline, not evidence of a database read bottleneck: numeric acceptance thresholds and database-read utilization evidence are still absent, and the dataset is synthetic. Keep B10 Redis deferred; do not change queries or indexes based on this run alone.

---

## 4. Execution Sequence

1. T01
2. T02
3. T03
4. T04
5. T05
6. T06
7. T07
8. T08
9. T09

This order keeps the most important correctness tests first and defers heavy-load or advanced failure-mode validation until the platform is already functional.
