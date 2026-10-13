# 01. Requirements

## 1. Purpose

This document defines the requirements for the Vehicle Rental System as described in `docs/00-project-overview.md`.

It intentionally avoids API design, database schema design, framework selection, and implementation details. Where the overview does not define a business policy, the requirement is marked as `TBD`.

---

## 2. Functional Requirements

### Customer-facing functional requirements

- FR-01: The system shall allow a new customer to register an account with identity information and credentials.
- FR-02: The system shall allow a registered customer to authenticate and obtain an authenticated session or token.
- FR-03: The system shall allow any visitor to view the active, available vehicle catalog; authenticated customers may also use it.
- FR-04: The system shall allow any visitor to search and filter active vehicles by relevant attributes such as type and location.
- FR-05: The system shall allow any visitor to view public details for an active, available vehicle.
- FR-06: The system shall allow an authenticated customer to check vehicle availability for a selected rental period.
- FR-07: The system shall allow an authenticated customer to select pickup location, return location, pickup time, and return time for a rental request.
- FR-08: The system shall allow an authenticated customer to create a booking for an available vehicle for a valid rental period.
- FR-09: The system shall allow an authenticated customer to view their booking history.
- FR-10: The system shall allow an authenticated customer to view the details of a specific booking.
- FR-11: The system shall allow an authenticated customer to cancel an eligible booking.
- FR-12: The system shall allow an authenticated administrator to complete rental processing for a booking that has been returned.

### Admin-facing functional requirements

- FR-13: The system shall allow an authenticated administrator to create a vehicle.
- FR-14: The system shall allow an authenticated administrator to update a vehicle.
- FR-15: The system shall allow an authenticated administrator to deactivate a vehicle.
- FR-16: The system shall allow an authenticated administrator to change the lifecycle status of a vehicle where the business allows it.
- FR-17: The system shall allow an authenticated administrator to view vehicle information.
- FR-18: The system shall allow an authenticated administrator to create a vehicle type.
- FR-19: The system shall allow an authenticated administrator to update a vehicle type.
- FR-20: The system shall allow an authenticated administrator to view vehicle types.
- FR-21: The system shall allow an authenticated administrator to create a location.
- FR-22: The system shall allow an authenticated administrator to update a location.
- FR-23: The system shall allow an authenticated administrator to deactivate a location.
- FR-24: The system shall allow an authenticated administrator to view locations.
- FR-25: The system shall allow an authenticated administrator to view bookings and booking details.
- FR-26: The system shall allow an authenticated administrator to manage booking lifecycle states where permitted by the business rules.

### Shared platform functional requirements

- FR-27: The system shall enforce valid booking lifecycle transitions and reject invalid transitions.
- FR-28: The system shall prevent overlapping pending, confirmed, or active bookings for the same vehicle over the same rental period.
- FR-29: The system shall treat the rental period as a half-open interval `[PickupUtc, ReturnUtc)`.
- FR-30: The system shall ensure that the booking state, booking period, and vehicle availability remain consistent.
- FR-31: The system shall provide a clear distinction between customer and administrator capabilities based on authorization rules.

---

## 3. Non-Functional Requirements

### NFR-01: Correctness and consistency
- The system shall prioritize correctness over performance and feature breadth.
- Booking correctness is a primary requirement.
- Overlap prevention must be enforced consistently under concurrent requests.

### NFR-02: Security and authorization
- The system shall support authentication and authorization using tokens.
- The system shall support role-based access for customer and administrator roles.
- Sensitive data and authentication information shall be protected according to secure implementation practices.
- Detailed password policy and session management are `TBD`.

### NFR-03: Availability and business reliability
- The system shall prevent invalid or overlapping bookings in pending, confirmed, or active states.
- A vehicle shall not be treated as permanently available solely because of a static status flag; availability is period-based and derived from business rules.

### NFR-04: Maintainability and extensibility
- The system shall remain small enough for a single developer to reason about.
- The architecture shall follow service ownership boundaries and incremental delivery phases.
- The project shall prefer small, incremental progress over premature broad-scale architecture.

### NFR-05: Observability and testing
- The solution shall support structured logging, metrics, tracing, and health checks as the project evolves.
- Booking creation, cancellation, invalid periods, overlap prevention, and concurrent booking requests shall be testable scenarios.

### NFR-06: Performance expectations
- The system shall be performant enough for the MVP, but performance optimization shall be introduced after correctness is established.
- Database indexing, query optimization, pagination, and caching shall be addressed based on measured need rather than speculation.

### NFR-07: Operational constraints
- The initial system shall use a small architecture with 2-3 backend services and 2-3 databases.
- The system shall use Docker-based local development initially.
- Kubernetes is explicitly out of scope for the initial phase.

---

## 4. Customer Capabilities

Customers shall be able to:

- Register a user account.
- Sign in and access authenticated customer features.
- Browse and search vehicles.
- Filter vehicles by relevant attributes, including vehicle type and location.
- View vehicle details.
- Check availability for a rental period.
- Select pickup and return locations and times.
- Create a booking.
- View booking history and details.
- Cancel an eligible booking.

The detailed account lifecycle, password rules, and customer profile data fields are `TBD`.

---

## 5. Admin Capabilities

Administrators shall be able to:

- View vehicles and booking information.
- Create, update, and deactivate vehicles.
- Create, update, and view vehicle types.
- Create, update, and deactivate rental locations.
- View booking records and manage booking lifecycle states where permitted.
- Confirm, reject, record pickup, record return, and complete bookings according to the defined lifecycle.
- Manage vehicle lifecycle and status.

The detailed permission matrix, approval processes, and admin role granularity are `TBD`.

---

## 6. System Constraints

- SC-01: The system shall follow a database-per-service model: User Service owns User DB, Vehicle Service owns Vehicle DB, and Booking Service owns Booking DB.
- SC-02: Services shall not directly join across service databases.
- SC-03: Cross-service data access shall occur through explicit integration mechanisms such as REST APIs or events.
- SC-04: The system shall limit the initial scope to three backend services and a single frontend application.
- SC-05: The initial implementation shall exclude payment, pricing, review, recommendation, and notification services unless introduced as justified future extensions.
- SC-06: The system shall not treat booking correctness as a side effect of caching; the database remains the source of truth for booking integrity.
- SC-07: The system shall use a simple, incremental development strategy and avoid adding advanced infrastructure before the core business rules are validated.
- SC-08: Retrying a booking-creation request with the same idempotency key and payload shall not create a duplicate booking; the implementation strategy is defined in `docs/backend/08-concurrency-and-transaction.md`.

---

## 7. TBD Items

The following items are intentionally unspecified in the current project definition and therefore remain `TBD`:

- Exact supported vehicle types.
- Exact rental location taxonomy and naming conventions.
- Exact password, token, and session policy.
- Exact customer profile fields beyond the baseline user concept.
- Exact admin authorization matrix and role permissions.
- Exact cancellation policy timing and eligibility windows.
- Exact pricing and total-price rules.
- Exact booking transition preconditions and cancellation eligibility windows beyond the initial lifecycle outline.
- The final choice of persistence, caching, and messaging implementation details.

---

## 8. Validation Summary

This requirements document is consistent with `docs/00-project-overview.md` and reflects the described customer and administrator capabilities, business problem, and architectural boundaries.
