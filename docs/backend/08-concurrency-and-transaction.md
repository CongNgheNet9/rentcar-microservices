# 08. Booking Concurrency & Transactions

## 1. Purpose

This document defines a concrete concurrency strategy for the Booking Service that guarantees overlapping bookings for the same vehicle cannot both succeed under concurrent requests.

The design is intentionally aligned with the approved project documentation and the existing service boundary rules:

- Booking Service owns booking correctness.
- Booking Service owns the Booking DB.
- Vehicle Service owns vehicle master data.
- Cross-service ownership remains separate; no cross-service foreign keys are used.
- The system must remain small, practical, and implementation-relevant without over-optimizing.

---

## 2. Required Booking Semantics

### 2.1 Rental time semantics

The system uses UTC timestamps and applies half-open interval semantics:

- A booking is valid when `PickupUtc < ReturnUtc`.
- The occupied interval for a booking is `[PickupUtc, ReturnUtc)`.
- The end instant is exclusive. A booking ending at `10:00` does not overlap a next booking starting at `10:00`.

This interpretation is required by the approved business rules and is the foundation of the overlap logic.

### 2.2 Overlap rule

Two booking periods overlap when:

```text
Existing.PickupUtc < New.ReturnUtc
AND
Existing.ReturnUtc > New.PickupUtc
```

This rule is applied only for the same vehicle and only for reservation-holding states. The MVP policy is that `Pending`, `Confirmed`, and `Active` all hold the vehicle period. Cancelled, rejected, returned, and completed bookings do not block future reservations.

### 2.3 Booking states relevant to overlap

The overlap check must consider only states that materially block the vehicle from being rented:

```text
Reservation-holding states = { Pending, Confirmed, Active }
```

A booking created as `Pending` reserves the period immediately; it releases the period only when transitioned to `Rejected` or `Cancelled`, or when it leaves the rental lifecycle after return/completion.

---

## 3. Business Constraints the Strategy Must Satisfy

The strategy must preserve these constraints:

- One vehicle must not be double-booked for overlapping time periods.
- Adjacent rental periods are allowed if the end of one equals the start of the next.
- Different vehicles are independent and may be booked concurrently.
- A transaction must either commit in full or roll back cleanly.
- Request retries and duplicate submissions must not produce duplicate booking creation.
- Cancellation must not violate the overlap invariant after the booking is changed to a non-conflicting state.
- Booking creation and status transitions must be governed by the Booking Service.

---

## 4. Candidate Strategies

### Option A — Application-side pre-check only

Pattern:

1. Read existing bookings for the vehicle.
2. Check whether any overlap exists.
3. Insert booking.

Why it fails:

- Two concurrent transactions can both read the same empty or near-empty result set before either insert commits.
- This creates a classic race condition and is not safe under concurrent requests.
- This design is explicitly not acceptable for the required correctness guarantee.

This is the anti-pattern that the project specifically warns against:

```text
SELECT availability -> INSERT
```

unless it is proven to be concurrency-safe.

### Option B — Optimistic concurrency with rowversion only

Pattern:

- Read the vehicle or booking record.
- Check overlap.
- Update a version field or compare rowversion.

Why it is insufficient:

- Rowversion helps protect against stale updates after reads and writes.
- It does not by itself prevent two transactions from both validating the same booking window before either insert is committed.
- It is useful for booking update operations, not as the primary guarantee for creating a new overlapping booking.

### Option C — SQL Server transaction-owned application lock per vehicle (recommended)

Pattern:

- Open a Booking DB transaction.
- Acquire an exclusive transaction-owned `sp_getapplock` for a resource name derived from the immutable vehicle ID.
- Check overlap in the Booking DB while holding that lock.
- Insert the booking only if valid.
- Commit the transaction, releasing the application lock.

Why this works:

- SQL Server application locks are coordinated by the database across service instances and are held until transaction completion when `@LockOwner = 'Transaction'`.
- Every booking create or lifecycle transition that changes whether a booking reserves time must acquire the same per-vehicle exclusive lock before validation and write.
- Requests for one vehicle serialize, so the later transaction checks against the earlier transaction's committed booking. Requests for different vehicles use different lock resources.
- Correctness does not depend on SQL Server selecting a particular booking index plan or acquiring a particular range lock.

This is the recommended approach for this project because it is practical, explicit, and aligned with the existing small-service design. The booking index supports lookup performance but is not itself the correctness mechanism.

### Option D — Reservation/lock table or separate booking-slot table

This can also work, but it is more complex than necessary for the current system.

- It may be useful if the system later becomes more complex.
- It is not required at this stage.
- It introduces extra design and operational complexity without a clearly justified need.

For this small learning-oriented project, the recommended strategy remains a transaction-owned application lock scoped to the vehicle.

---

## 5. Recommended Implementation Strategy

### 5.1 Core idea

The Booking Service must enforce the overlap invariant inside a single database transaction and within the Booking DB boundary.

The Booking DB transaction should include:

1. idempotency-key claim after authentication establishes the customer ID
2. per-vehicle application-lock acquisition
3. rental-period validation and overlap check
4. booking insert and status-history insert
5. stored successful idempotency response
6. commit

If any step fails, the transaction rolls back.

Vehicle existence, location references, and operational eligibility are checked through Vehicle Service before entering the Booking DB transaction; that remote call is not part of a distributed transaction. Concurrent vehicle deactivation semantics remain bounded by the existing deactivation policy and are an open operational decision.

### 5.2 Required database support

The Booking DB should support the following:

- `Bookings` table with:
  - `BookingId`
  - `CustomerUserId`
  - `VehicleId`
  - `PickupLocationId`
  - `ReturnLocationId`
  - `PickupUtc`
  - `ReturnUtc`
  - `Status`
  - `CreatedAtUtc`
  - `UpdatedAtUtc`
  - `CancelledAtUtc`
  - `CompletedAtUtc`
  - `RowVersion`
- `IX_Bookings_VehicleId_PickupUtc_ReturnUtc` on `(VehicleId, PickupUtc, ReturnUtc)`
- `IX_Bookings_VehicleId_Status_PickupUtc_ReturnUtc` on `(VehicleId, Status, PickupUtc, ReturnUtc)` as a query-support index
- `CHECK (ReturnUtc > PickupUtc)`
- `Status` constraint limited to the approved lifecycle values
- `RowVersion` for optimistic protection on updates and state transitions
- `IdempotencyKeys` table with unique `(CustomerUserId, IdempotencyKey)`, a normalized request hash, linked BookingId, and the stored successful response.

The exact schema may vary, but the important design requirement is that the booking overlap predicate must be supported by a DB index that begins with `VehicleId` and then uses time values.

### 5.3 Transaction boundary

The transaction boundary is the Booking Service database transaction, not a cross-service transaction.

This is required because:

- The master vehicle information is owned by the Vehicle Service.
- Cross-service joins are forbidden.
- The Booking Service must remain the source of truth for booking validity.

The service may call the Vehicle Service for metadata, but the actual booking correctness check must happen in the Booking DB within the booking transaction.

---

## 6. Exact Transaction Pattern

### 6.1 Recommended database-level behavior

Use SQL Server's default `READ COMMITTED` isolation plus an explicit exclusive application lock owned by the transaction. The application lock, not range-lock behavior or a particular query plan, serializes all writes that may claim or release a vehicle's rental periods.

Conceptually:

```text
-- Before opening this transaction, look up a committed key:
-- same hash => return its stored successful result; different hash => 409.

BEGIN TRANSACTION
-- Insert an uncommitted claim with CustomerUserId, IdempotencyKey, RequestHash.
-- The unique key serializes concurrent submissions of the same key.

EXEC sp_getapplock
    @Resource = @VehicleScopedLockName,
    @LockMode = 'Exclusive',
    @LockOwner = 'Transaction',
    @LockTimeout = @ConfiguredLockTimeout

-- validate period

SELECT ...
FROM Bookings
WHERE VehicleId = @VehicleId
  AND Status IN ('Pending','Confirmed','Active')
  AND PickupUtc < @ReturnUtc
  AND ReturnUtc > @PickupUtc

IF any overlap exists:
    ROLLBACK
    RETURN Conflict

INSERT Booking ...
INSERT BookingStatusHistory ...
-- finalize the idempotency row with BookingId, 201, and response body

COMMIT
```

If the idempotency insert hits the unique constraint because a concurrent request has committed the same key, roll back this attempt, read the committed record, compare request hashes, and return the stored result or 409 as appropriate. The idempotency claim remains uncommitted and invisible to other requests until the transaction commits with the booking and complete response.

The application-lock call must succeed before the overlap query. A negative return code is an operation failure: roll back and return a retryable concurrency/service error; never proceed without the lock. The idempotency result and booking write are committed atomically.

### 6.2 Why the per-vehicle lock is safe

SQL Server grants an exclusive application lock for a named resource. The resource name is stable and includes a service prefix and vehicle identifier. Every code path that can add, remove, or change a reservation-holding booking for that vehicle must take the same lock before checking and changing reservation state.

With transaction ownership, SQL Server holds the lock until commit or rollback. If request A commits a reservation first, request B obtains the lock afterward and sees A's booking in the overlap query. If A rolls back, B obtains the lock and sees no committed booking from A.

This guarantee depends on all Booking Service write paths following the same lock protocol. Direct writes to Booking DB outside Booking Service are prohibited. The lock is not a substitute for the overlap predicate or basic database constraints.

---

## 7. Adjacent Periods

Adjacent periods are permitted because the interval is half-open:

- Existing: `[09:00, 12:00)`
- New: `[12:00, 15:00)`

These do not overlap because:

```text
Existing.PickupUtc < New.ReturnUtc = 15:00   -- true
Existing.ReturnUtc > New.PickupUtc = 12:00   -- 12:00 > 12:00 is false
```

Therefore no conflict.

This is the required semantics for same-day and sequential bookings.

---

## 8. Concurrent Request Analysis

### 8.1 Two concurrent requests for the same vehicle and overlapping periods

Scenario:

- Request A: vehicle 42, pickup `10:00`, return `15:00`
- Request B: vehicle 42, pickup `12:00`, return `18:00`

Outcome under recommended strategy:

1. Transaction A starts and takes the exclusive application lock for vehicle 42.
2. Transaction B waits for the same vehicle-scoped application lock.
3. Transaction A validates and inserts the booking.
4. Transaction A commits.
5. Transaction B acquires the lock and evaluates the overlap predicate against committed rows.
6. Transaction B finds the existing booking and rejects the request with conflict.

Exactly one booking succeeds.

### 8.2 Adjacent periods

Scenario:

- Request A: `[10:00, 15:00)`
- Request B: `[15:00, 18:00)`

Outcome:

- The per-vehicle lock serializes the requests, then the half-open overlap predicate identifies them as non-overlapping.
- Both can be valid if the business rules allow two consecutive bookings on the same vehicle.
- No conflict is raised because the overlap predicate is false.

### 8.3 Different vehicles

Scenario:

- Request A: vehicle 42, overlapping period
- Request B: vehicle 43, overlapping period

Outcome:

- They acquire different vehicle-scoped application locks.
- The transactions are independent.
- Both may proceed concurrently without violating the same-vehicle booking rule.

### 8.4 Transaction rollback

If a booking transaction fails after the overlap check but before commit:

- the transaction rolls back
- no booking is inserted
- no state transition is persisted
- no idempotency result is committed unless the transaction explicitly records it

This guarantees atomicity.

### 8.5 Request retry

If a request is retried after a timeout or transient service issue:

- the client should use the same idempotency key
- the Booking Service must check the idempotency record before creating a second booking
- the result should be returned from the stored prior result if it already exists

A retry without a key is not safe from a business correctness perspective because the client may create a duplicate logical request; therefore the system should require an idempotency key for booking creation.

### 8.6 Duplicate request

If the same logical booking request is sent twice with the same idempotency key:

- the first request commits its result
- the second request finds the previously stored idempotency result
- the service returns the same result without creating a second booking

This prevents the common double-submit problem and is required for reliable client retries.

### 8.7 Service failure between validation and response

Failure modes:

- service crashes before commit: transaction rolls back and no booking exists
- service crashes after commit but before response: the booking might exist and the client may retry; idempotency key resolves the duplicate creation problem
- network timeout after commit: retry with same key returns the previous successful booking result

This is the correct pattern for a small system seeking correctness with minimal complexity.

---

## 9. Booking State Transition Interaction

### 9.1 Booking creation

New booking creation occurs in the same transaction as overlap validation and booking insert. This ensures the business invariant is not violated between validation and persistence.

### 9.2 Booking cancellation

Cancellation is a separate state transition and should be handled as a distinct transaction. It must acquire the same vehicle application lock before re-reading the booking and changing its state, so a concurrent create cannot observe inconsistent reservation state.

Rules:

- A booking may cancel only if it is in a state eligible for cancellation.
- A cancelled booking is not considered a conflicting booking for future overlap checks.
- Cancellation from eligible states should update the row and persist the status history record atomically. `Active` cancellation remains forbidden.
- The transition `Pending -> Rejected` also releases a reservation and must acquire the same vehicle lock.

### 9.3 Booking completion

Booking completion updates the booking state to `Completed` and is subject to the lifecycle rules. Completed bookings are not treated as active conflicting reservations for overlap purposes.

### 9.4 State transition concurrency

The rowversion field on `Bookings` is used for state updates such as cancellation or completion to ensure stale updates do not overwrite newer changes. This is important for correctness when multiple administrative or customer actions target the same booking concurrently.

However, rowversion is not the primary overlap-prevention mechanism for booking creation. The primary guarantee comes from the transaction-owned application lock and overlap check.

---

## 10. Failure Behavior and Retry Decisions

### 10.1 Deadlock, lock timeout, or transient database failure

Under concurrent load, SQL Server may abort a transaction due to deadlock, the application-lock request may time out, or a transient database failure may interrupt the operation. When this happens:

- the transaction must roll back
- the application must retry the operation with bounded backoff
- the same idempotency key should be reused across retries

This provides resilience without violating correctness.

### 10.2 Validation failure

If the request fails validation or the booking period is invalid:

- no booking is created
- no overlap check is required beyond the invalid condition
- the response returns a normal validation error

### 10.3 Business conflict

If the overlap check finds a conflicting booking:

- the transaction rolls back
- the service returns a conflict or non-availability result
- the client may retry later or choose a different period

---

## 11. Why This Strategy Fits the Project

This design is appropriate for the current project because it is:

- concrete enough to be implemented without ambiguity
- consistent with the service ownership rules
- consistent with the business rules for booking overlap and half-open intervals
- practical for a small learning project
- explicit about the exact transaction behavior and failure handling
- not more complex than required by the requirements

Implementation note:
- Booking creation claims the customer-scoped idempotency key, acquires `BookingService:Vehicle:{vehicleId}` through transaction-owned `sp_getapplock`, checks overlap, and commits the booking, initial history, and stored response in one Booking DB transaction.
- Customer cancellation, Admin rejection, and Admin return acquire the same vehicle lock before changing a reservation-holding state to a non-holding state.
- The public availability response is advisory and may race with another create; only the locked create transaction guarantees no double booking.
- Active vehicle and location checks are remote Vehicle Service reads performed before the Booking DB transaction. Vehicle deactivation remains a separately owned operation and can race with these reads.

It also avoids overengineering by not introducing distributed coordination, a separate reservation service, or speculative message-based conflict resolution.

---

## 12. Final Recommendation

The recommended implementation strategy is:

1. Keep booking uniqueness and overlap validation inside the Booking DB.
2. In one transaction, acquire an exclusive transaction-owned SQL Server application lock per vehicle before checking overlaps.
3. Use the same lock for every lifecycle transition that claims or releases a reservation period.
4. Require an `Idempotency-Key` header for booking creation and atomically store successful results with the booking.
5. Keep `RowVersion` for booking state update protection and stale-write prevention.
6. Roll back all booking, history, and idempotency writes on failure.
7. Retry only in a bounded manner with the same idempotency key.

This is the most practical design that satisfies the project’s correctness requirement without introducing unnecessary complexity or unproven concurrency claims.

---

## 13. Validation Against Existing Documentation

This approach remains consistent with the approved documentation because it:

- respects the service ownership model
- keeps the Booking Service as the source of truth for booking correctness
- matches the defined half-open time semantics
- enforces the overlap rule through a transaction-owned vehicle lock instead of an unsafe application pre-check or query-plan-dependent range-lock claim
- fits the architecture and business constraints without introducing new services

Open details that remain `TBD`:

- exact final status transition matrix beyond the initial business rule set
- exact admin approval and transition preconditions beyond the initial business rule set
- exact idempotency record retention policy
- exact retry/backoff strategy beyond a sane bounded retry model
