# 02. Business Rules

## 1. Scope

This document defines the business rules that are explicitly supported by the project definition in `docs/00-project-overview.md`.

The rules are written to be explicit, testable, and implementation-independent.

Where the project definition does not yet specify a business policy, the rule is marked as `TBD`.

For the end-to-end customer/admin flow and an evidence-linked review of open decisions, see [`docs/architecture/04-business-flow-and-gaps.md`](architecture/04-business-flow-and-gaps.md). The review is a companion document and does not override the rules below.

This document defines **what the system must do**, not how the system must implement it.

Technical implementation details such as database schema, transaction isolation, locking strategy, Kafka configuration, Redis usage, API structure, and framework-specific implementation are defined in separate technical design documents.

---

# 2. User Rules

## 2.1 User Roles

* **BR-USER-01:** A user shall have one of the supported roles:

  * `Customer`
  * `Admin`

* **BR-USER-02:** A user must be authenticated before accessing protected functionality.

* **BR-USER-03:** A customer shall be able to:

  * Register an account
  * Authenticate
  * Search vehicles
  * View vehicle details
  * Check vehicle availability
  * Create bookings
  * View their own bookings
  * View booking details
  * Cancel eligible bookings

* **BR-USER-04:** An administrator shall be able to manage the administrative functions explicitly defined by the project.

These include:

* Vehicle management

* Vehicle type management

* Location management

* Booking management

* Booking lifecycle operations where permitted

* Administrative dashboard and reporting within the defined project scope

* **BR-USER-05:** A customer shall only access data associated with their own account or bookings unless a separate authorization rule explicitly permits broader access.

* **BR-USER-06:** An administrator may access operational data required to perform authorized administrative functions.

* **BR-USER-07:** A user shall not be able to change their own role through normal user-facing operations.

* **BR-USER-08:** Detailed password policy, account lockout, role assignment, profile validation, and account recovery rules are `TBD`.

---

# 3. Vehicle Rules

## 3.1 Vehicle Ownership

* **BR-VEH-01:** A vehicle shall represent a rentable physical asset managed by the Vehicle Service.

* **BR-VEH-02:** The Vehicle Service shall be the authoritative owner of vehicle data.

* **BR-VEH-03:** A vehicle shall belong to exactly one vehicle type at a given time.

* **BR-VEH-04:** A vehicle shall be associated with a rental location for operational assignment purposes.

* **BR-VEH-05:** A vehicle shall have:

  * A lifecycle status
  * An active/inactive indicator

* **BR-VEH-06:** `IsActive` and `Status` represent different concepts.

`IsActive` represents whether the vehicle record is active in the system.

`Status` represents the current operational state of the vehicle.

Example:

```text
IsActive = true
Status   = Available
```

or:

```text
IsActive = true
Status   = Maintenance
```

A vehicle may be active in the system while temporarily unavailable for rental.

---

# 4. Vehicle Status Rules

## 4.1 Supported Vehicle Statuses

The initial system supports:

| Status        | Meaning                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| `Available`   | Vehicle is operationally eligible for rental, subject to booking availability |
| `Reserved`    | Derived indication that a pending or confirmed booking reserves the vehicle |
| `Rented`      | Derived indication that an active booking currently uses the vehicle    |
| `Maintenance` | Vehicle is unavailable because it requires or is undergoing maintenance |
| `Unavailable` | Vehicle is temporarily unavailable for another operational reason       |
| `Retired`     | Vehicle has permanently left the rental fleet                           |

`Reserved` and `Rented` are derived from Booking Service data and are not persisted as Vehicle Service operational status values. `Available`, `Maintenance`, `Unavailable`, and `Retired` are Vehicle Service operational states.

---

## 4.2 Vehicle Lifecycle

The normal rental lifecycle is:

```text
Available (operational state)
    |
    | Booking data indicates Pending or Confirmed
    v
Reserved (derived)
    |
    | Booking data indicates Active
    v
Rented (derived)
    |
    | Booking data indicates Returned / Completed
    v
Available (operational state, if not otherwise unavailable)
```

Maintenance lifecycle:

```text
Available
    |
    v
Maintenance
    |
    v
Available
```

Temporary unavailable lifecycle:

```text
Available
    |
    v
Unavailable
    |
    v
Available
```

Retirement:

```text
Available / Maintenance / Unavailable
                |
                v
             Retired
```

* **BR-VEH-07:** A `Retired` vehicle shall not be used for new bookings.

* **BR-VEH-08:** A vehicle in `Maintenance` shall not be available for new bookings.

* **BR-VEH-09:** A vehicle in `Unavailable` shall not be available for new bookings.

* **BR-VEH-10:** `Reserved` is derived from pending or confirmed bookings and shall not be assigned another conflicting booking for the same reserved period.

* **BR-VEH-11:** `Rented` is derived from an active booking; the booking overlap rule shall prevent conflicting reservations.

* **BR-VEH-12:** The system shall not allow arbitrary vehicle status transitions that violate the defined lifecycle.

* **BR-VEH-13:** A `Retired` vehicle cannot return to an active rental status through normal operations.

* **BR-VEH-14:** Exact rules for manual administrative status changes, reactivation, maintenance completion, and retirement approval are `TBD`.

---

# 5. Vehicle Activation Rules

* **BR-VEH-ACT-01:** An administrator may deactivate a vehicle.

* **BR-VEH-ACT-02:** A deactivated vehicle shall not be eligible for new bookings.

* **BR-VEH-ACT-03:** Deactivating a vehicle shall not automatically delete historical bookings associated with the vehicle.

* **BR-VEH-ACT-04:** Historical booking information must remain available after vehicle deactivation.

* **BR-VEH-ACT-05:** The exact behavior for deactivating a vehicle that has future confirmed bookings is `TBD`.

* **BR-VEH-ACT-06:** The exact reactivation rules are `TBD`.

---

# 6. Location Rules

* **BR-LOC-01:** A location shall represent a rental location such as an airport, downtown location, station, or other supported rental point.

* **BR-LOC-02:** A location may contain multiple vehicles.

* **BR-LOC-03:** A vehicle shall have one current operational location assignment at a given time.

* **BR-LOC-04:** A booking shall include:

  * Pickup location
  * Return location

* **BR-LOC-05:** Pickup and return locations may be different.

* **BR-LOC-06:** A location may be activated or deactivated by an administrator.

* **BR-LOC-07:** A deactivated location shall not be selectable for new bookings.

* **BR-LOC-08:** Deactivating a location shall not delete historical booking data referencing that location.

* **BR-LOC-09:** The exact behavior for vehicles and future bookings associated with a deactivated location is `TBD`.

* **BR-LOC-10:** Location naming conventions, address validation, geographical coordinates, hierarchy, and operating hours are `TBD`.

---

# 7. Vehicle Type Rules

* **BR-VTYPE-01:** A vehicle type shall represent a category such as:

  * Sedan
  * SUV
  * Hatchback
  * Motorbike
  * Van

* **BR-VTYPE-02:** Vehicle types shall be managed by the Vehicle Service.

* **BR-VTYPE-03:** A vehicle shall have exactly one vehicle type at a given time.

* **BR-VTYPE-04:** A vehicle type may be used by multiple vehicles.

* **BR-VTYPE-05:** Deactivating a vehicle type shall not delete vehicles or historical bookings using that type.

* **BR-VTYPE-06:** A deactivated vehicle type shall not be selectable for new vehicle creation or reassignment where the business rules require an active type.

* **BR-VTYPE-07:** Existing vehicles may retain their historical vehicle type association after the type is deactivated.

* **BR-VTYPE-08:** Exact vehicle type deletion, archive, reassignment, and reactivation rules are `TBD`.

---

# 8. Booking Rules

## 8.1 Booking Ownership

* **BR-BOOK-01:** A booking shall represent a customer's request to rent one vehicle for a defined rental period.

* **BR-BOOK-02:** A booking shall reference exactly:

  * One customer
  * One vehicle
  * One pickup location
  * One return location

* **BR-BOOK-03:** A booking shall be owned by the Booking Service.

* **BR-BOOK-04:** The Booking Service shall be the authoritative service for booking lifecycle and booking consistency.

---

## 8.2 Booking Data

A booking shall contain, at minimum, information representing:

```text
Booking
├── Customer
├── Vehicle
├── Pickup Location
├── Return Location
├── Pickup Time
├── Return Time
└── Status
```

* **BR-BOOK-05:** Pickup and return timestamps shall be represented in UTC.

* **BR-BOOK-06:** A booking shall contain a valid rental period.

* **BR-BOOK-07:** A booking shall have a valid lifecycle status.

* **BR-BOOK-08:** Storing or calculating a total price is outside the MVP scope.

* **BR-BOOK-09:** A future pricing requirement, including currency, calculation, and whether a price is stored on a booking, remains `TBD` and requires a documented scope change.

* **BR-BOOK-10:** The system shall preserve historical booking information even when the associated vehicle, vehicle type, or location is later deactivated.

---

# 9. Booking Status Rules

## 9.1 Persisted Booking Statuses

The initial system supports:

| Status      | Meaning                                                      |
| ----------- | ------------------------------------------------------------ |
| `Pending`   | Booking has been created and reserves the vehicle while waiting for confirmation |
| `Confirmed` | Booking has been successfully confirmed and continues to reserve the vehicle |
| `Rejected`  | Booking has been rejected                                    |
| `Cancelled` | Booking has been cancelled before rental completion          |
| `Active`    | Administrator has recorded pickup; rental is in progress     |
| `Returned`  | Customer has returned the vehicle                            |
| `Completed` | Rental processing has been fully completed                   |

The system also has:

| Status    | Type    | Meaning                                           |
| --------- | ------- | ------------------------------------------------- |
| `Overdue` | Derived | Active rental has passed the expected return time |

---

# 10. Booking Lifecycle Rules

The initial lifecycle is:

```text
Pending
   |
   +--------------------> Rejected
   |
   v
Confirmed
   |
   +--------------------> Cancelled
   |
   v
Active
   |
   +--------------------> Returned
   |
   v
Completed
```

An active booking may be **effectively overdue**:

```text
Active
  |
  | CurrentUtc >= ExpectedReturnUtc
  v
Overdue
```

`Overdue` is initially a derived status and does not replace the persisted `Active` status.

---

## 10.1 Valid State Transitions

The supported transitions are:

| From        | To          | Meaning                                 |
| ----------- | ----------- | --------------------------------------- |
| `Pending`   | `Confirmed` | Booking accepted                        |
| `Pending`   | `Rejected`  | Booking rejected                        |
| `Pending`   | `Cancelled` | Customer cancels own eligible booking   |
| `Confirmed` | `Active`    | Administrator records pickup            |
| `Confirmed` | `Cancelled` | Booking cancelled before pickup         |
| `Active`    | `Returned`  | Administrator records return            |
| `Returned`  | `Completed` | Rental processing completed             |

Derived:

```text
Active + past expected return time = Overdue
```

---

## 10.2 Invalid State Transitions

The following are invalid under the initial rules:

```text
Rejected   -> Pending
Rejected   -> Confirmed
Rejected   -> Active

Cancelled  -> Pending
Cancelled  -> Confirmed
Cancelled  -> Active

Completed  -> Pending
Completed  -> Confirmed
Completed  -> Active
Completed  -> Cancelled

Returned   -> Active
Returned   -> Cancelled
```

* **BR-LC-01:** Invalid state transitions shall be rejected.

* **BR-LC-02:** A booking status shall not be changed arbitrarily through an unrestricted status-update operation.

* **BR-LC-03:** Each lifecycle operation shall validate the current booking state before applying the transition.

---

# 11. Booking Lifecycle Operation Rules

The system should model important lifecycle operations explicitly.

Examples:

```text
Confirm Booking
Reject Booking
Cancel Booking
Pickup Vehicle
Return Vehicle
Complete Booking
```

Each operation shall validate:

1. Current booking status
2. User authorization
3. Required business conditions
4. Vehicle state
5. Concurrency conditions where applicable

* **BR-LC-04:** `Pending -> Confirmed` requires the booking to remain valid and the vehicle to remain eligible.

* **BR-LC-05:** `Confirmed -> Active` represents successful vehicle pickup recorded by an Admin.

* **BR-LC-06:** `Active -> Returned` represents successful vehicle return recorded by an Admin.

* **BR-LC-07:** `Returned -> Completed` represents completion of the rental process.

* **BR-LC-08:** The exact approval authority for each transition is defined by the authorization matrix.

---

# 12. Overdue Rules

* **BR-OVERDUE-01:** A booking shall be considered overdue when:

```text
Booking.Status = Active
AND
CurrentUtc >= ExpectedReturnUtc
```

* **BR-OVERDUE-02:** `Overdue` shall initially be treated as a derived state.

* **BR-OVERDUE-03:** An overdue booking remains an active rental until the vehicle is actually returned.

* **BR-OVERDUE-04:** Returning an overdue vehicle shall transition the booking from its effective overdue state to `Returned`.

* **BR-OVERDUE-05:** The system shall not require a scheduled process solely to maintain the correctness of the overdue state.

* **BR-OVERDUE-06:** Late fees and additional charges resulting from overdue rentals are `TBD`.

---

# 13. Cancellation Rules

* **BR-CANCEL-01:** A booking may only be cancelled from a cancellation-eligible state.

* **BR-CANCEL-02:** `Pending -> Cancelled` is supported for an eligible booking owned by the cancelling Customer.

* **BR-CANCEL-03:** `Confirmed -> Cancelled` is supported for an eligible booking owned by the cancelling Customer.

* **BR-CANCEL-04:** An `Active` booking cannot be cancelled under the initial business rules.

* **BR-CANCEL-05:** A `Returned`, `Completed`, `Rejected`, or already `Cancelled` booking cannot be cancelled.

* **BR-CANCEL-06:** A cancelled booking shall no longer reserve the vehicle for its future rental period.

* **BR-CANCEL-07:** The system shall record the cancellation timestamp.

* **BR-CANCEL-08:** The system should record the actor responsible for cancellation where audit information is available.

* **BR-CANCEL-09:** Cancellation reason may be recorded.

* **BR-CANCEL-10:** Exact cancellation windows, refund rules, cancellation fees, and approval requirements are `TBD`.

---

# 14. Rental Period Rules

* **BR-PERIOD-01:** A rental period shall be represented as a half-open interval:

```text
[PickupUtc, ReturnUtc)
```

* **BR-PERIOD-02:** Pickup and return timestamps shall use UTC.

* **BR-PERIOD-03:** A booking is invalid when:

```text
ReturnUtc <= PickupUtc
```

* **BR-PERIOD-04:** Two rental periods overlap when:

```text
Existing.PickupUtc < New.ReturnUtc
AND
Existing.ReturnUtc > New.PickupUtc
```

* **BR-PERIOD-05:** Two bookings in a reservation-holding state (`Pending`, `Confirmed`, or `Active`) for the same vehicle shall not overlap.

* **BR-PERIOD-06:** A booking in a state that no longer reserves a future rental period shall not block a new booking.

* **BR-PERIOD-07:** A booking ending exactly when another booking starts shall not be considered overlapping.

Example:

```text
Booking A:
10:00 -> 12:00

Booking B:
12:00 -> 14:00

Result:
No overlap
```

* **BR-PERIOD-08:** The same rental-period definition shall be used consistently for availability checking and booking creation.

* **BR-PERIOD-09:** Minimum rental duration, maximum rental duration, advance booking limits, date-only booking, and timezone display rules are `TBD`.

---

# 15. Availability Rules

## 15.1 General Availability

* **BR-AVAIL-01:** Availability is a time-dependent business concept.

* **BR-AVAIL-02:** Availability shall not be represented only by a permanent boolean such as `IsAvailable`.

* **BR-AVAIL-03:** Availability shall consider:

  1. Vehicle active state
  2. Vehicle operational status
  3. Existing pending, confirmed, or active bookings
  4. Requested rental period

---

## 15.2 Vehicle Operational Availability

A vehicle shall not be eligible for a new booking when:

```text
IsActive = false
```

or when its operational status is:

```text
Maintenance
Unavailable
Retired
```

`Reserved` and `Rented` are derived booking indications, not persisted operational states. A vehicle in `Maintenance`, `Unavailable`, or `Retired` is ineligible for new bookings regardless of booking status.

---

## 15.3 Booking-Based Availability

* **BR-AVAIL-04:** A vehicle shall be unavailable for a requested period if another booking reserves the same vehicle during an overlapping period.

* **BR-AVAIL-05:** The availability check must use the same overlap rule as booking creation.

* **BR-AVAIL-06:** An availability check shall not be considered a guarantee that a subsequent booking will succeed.

This is important because another request may attempt to reserve the same vehicle concurrently.

* **BR-AVAIL-07:** Final booking creation shall revalidate availability under the booking consistency mechanism.

---

# 16. Vehicle and Booking Status Relationship

Vehicle Status and Booking Status represent different domains.

Example:

```text
Booking:
Pending or Confirmed

Vehicle:
Reserved (derived from Booking Service data)
```

After pickup:

```text
Booking:
Active

Vehicle:
Rented (derived from Booking Service data)
```

After return:

```text
Booking:
Returned

Vehicle:
No longer Rented (operational state remains owned by Vehicle Service)
```

If the vehicle requires maintenance:

```text
Booking:
Returned

Vehicle:
Maintenance
```

* **BR-REL-01:** Booking status and Vehicle operational status are separate concepts; neither is a substitute for the other.

* **BR-REL-02:** `Reserved` and `Rented` are derived display/availability indications based on Booking Service data. They shall not be persisted as Vehicle Service operational status changes during booking lifecycle operations.

* **BR-REL-03:** Vehicle operational status (`Available`, `Maintenance`, `Unavailable`, or `Retired`) remains owned and updated by the Vehicle Service. Booking Service shall not write to the Vehicle DB.

---

# 17. Booking and Vehicle Consistency

The following business relationships must remain consistent.

## 17.1 Pending or Confirmed Booking

When a booking is `Pending` or `Confirmed`:

```text
Vehicle reservation indication = Reserved (derived)
```

subject to the defined operational rules. The Booking Service is the source of truth for this indication.

## 17.2 Pickup

When an administrator records successful pickup:

```text
Booking = Active
Vehicle rental indication = Rented (derived)
```

## 17.3 Return

When an administrator records return:

```text
Booking = Returned
Vehicle rental indication is no longer Rented
```

unless the vehicle requires another operational state such as:

```text
Maintenance
```

or:

```text
Unavailable
```

* **BR-REL-04:** Booking lifecycle operations update only the Booking DB. Reserved/Rented indications are derived when reading vehicle/availability data; no cross-service transaction is required for these indications.

---

# 18. Authorization Rules

## 18.1 General

* **BR-AUTH-01:** Customer and Admin access shall be enforced through authentication and authorization.

* **BR-AUTH-02:** Customers shall only perform actions permitted for the Customer role.

* **BR-AUTH-03:** Administrators shall only perform actions permitted for the Admin role.

---

## 18.2 Customer Rules

* **BR-AUTH-04:** A customer may view their own bookings.

* **BR-AUTH-05:** A customer shall not view or modify another customer's booking through normal customer operations.

* **BR-AUTH-06:** A customer may cancel only bookings that are eligible for customer cancellation.

* **BR-AUTH-07:** A customer shall not directly change booking status to `Confirmed`, `Active`, `Returned`, or `Completed`.

---

## 18.3 Admin Rules

* **BR-AUTH-08:** An administrator may manage vehicles, vehicle types, locations, and bookings within the approved administrative scope.

* **BR-AUTH-09:** An administrator shall not bypass rental-period overlap rules.

* **BR-AUTH-10:** An administrator shall not perform an invalid booking state transition.

* **BR-AUTH-11:** Administrative operations shall not directly modify another service's database.

* **BR-AUTH-12:** Exact permission granularity within the Admin role is `TBD`.

* **BR-AUTH-13:** A Customer may create bookings for themself and cancel their own eligible bookings. Customers shall not perform booking confirmation, rejection, pickup, return, or completion operations.

* **BR-AUTH-14:** An authenticated Admin performs booking confirmation, rejection, pickup, return, and completion operations. Each operation must still obey the lifecycle transition rules.

---

# 19. Administrative Management Rules

## 19.1 Vehicle Management

Admin shall be able to:

* View vehicles
* Search/filter vehicles
* Create vehicles
* Update vehicle information
* Activate/deactivate vehicles
* Manage vehicle operational status according to permitted transitions

Historical booking records shall remain valid after vehicle deactivation.

---

## 19.2 Vehicle Type Management

Admin shall be able to:

* View vehicle types
* Create vehicle types
* Update vehicle types
* Activate/deactivate vehicle types

A vehicle type that is referenced by existing vehicles or historical bookings shall not be physically deleted without an explicit business rule.

---

## 19.3 Location Management

Admin shall be able to:

* View locations
* Create locations
* Update locations
* Activate/deactivate locations

Deactivating a location shall not delete historical booking information.

---

## 19.4 Booking Management

Admin shall be able to:

* View booking list
* Search/filter bookings
* View booking details
* Perform permitted booking lifecycle operations

Admin operations must follow the same lifecycle and consistency rules as customer operations.

---

# 20. Data Ownership Rules

* **BR-DATA-01:** User Service owns user and authentication-related user data.

* **BR-DATA-02:** Vehicle Service owns:

  * Vehicles
  * Vehicle Types
  * Locations

* **BR-DATA-03:** Booking Service owns:

  * Bookings
  * Booking lifecycle
  * Booking consistency

* **BR-DATA-04:** A service shall not directly modify another service's database.

* **BR-DATA-05:** Cross-service information shall be obtained through defined service interfaces or asynchronous events.

* **BR-DATA-06:** The system shall follow the database-per-service ownership model.

* **BR-DATA-07:** Any cached data shall remain non-authoritative. It shall not replace service-owned data as the source of truth or weaken booking validation and consistency rules.

* **BR-DATA-08:** Application-level caching remains deferred until measured read-access evidence justifies a specific use case and its cache behavior has been reviewed.

---

# 21. Booking Consistency and Concurrency Rules

* **BR-CON-01:** The system must prevent two valid bookings from overlapping for the same vehicle.

* **BR-CON-02:** Availability checking and booking creation shall not be treated as two independent business guarantees.

* **BR-CON-03:** The final booking creation operation must protect against concurrent requests attempting to reserve the same vehicle and period.

* **BR-CON-04:** The Booking Service is authoritative for booking consistency.

* **BR-CON-05:** The system shall remain correct when multiple booking requests are processed concurrently.

* **BR-CON-06:** An optimistic concurrency mechanism may be used for entity updates where appropriate.

* **BR-CON-07:** Entity versioning alone shall not be assumed to solve rental-period overlap.

* **BR-CON-08:** The exact transaction, isolation, locking, and concurrency strategy is defined in the backend concurrency design.

---

# 22. Idempotency Rules

* **BR-IDEMP-01:** Booking creation is a business operation that may be retried by clients or infrastructure.

* **BR-IDEMP-02:** Retrying the same booking creation request must not unintentionally create multiple equivalent bookings.

* **BR-IDEMP-03:** The system shall support an idempotency mechanism for booking creation.

* **BR-IDEMP-04:** The exact idempotency-key format, storage strategy, expiration, and response behavior are defined in the technical design.

---

# 23. Audit Rules

Important lifecycle operations should preserve sufficient historical information for troubleshooting and business auditing.

At minimum, the system should be able to determine:

```text
What happened?
When did it happen?
Who performed it?
What was the previous state?
What was the new state?
```

This applies particularly to:

* Booking status changes
* Booking cancellation
* Vehicle status changes
* Vehicle activation/deactivation

The exact audit model and retention policy are `TBD`.

---

# 24. Financial Rules

Pricing, payment, and revenue reporting are outside the MVP.

* **BR-FIN-01:** A booking does not require a price value in the MVP.
* **BR-FIN-02:** The exact pricing calculation, currency, and any future booking price snapshot are `TBD` and require a documented scope change.
* **BR-FIN-03:** Revenue reporting is outside the MVP.
* **BR-FIN-04:** Expense Management is outside the MVP.
* **BR-FIN-05:** Payment processing and real payment gateway integration are outside the MVP.
* **BR-FIN-06:** Any future financial reporting policy, including recognized revenue, refunds, discounts, taxes, and payment settlement, is `TBD`.

---

# 25. Historical Data Rules

* **BR-HIST-01:** Deactivating a vehicle shall not delete historical bookings.

* **BR-HIST-02:** Deactivating a vehicle type shall not delete historical booking information.

* **BR-HIST-03:** Deactivating a location shall not delete historical booking information.

* **BR-HIST-04:** Completed bookings should remain immutable through normal user operations.

* **BR-HIST-05:** Historical information should preserve enough context to understand the booking at the time it occurred.

* **BR-HIST-06:** The exact snapshot strategy for vehicle type, location, pricing, and other historical attributes is `TBD`.

---

# 26. Error and Validation Rules

Business validation failures shall not silently modify system state.

Examples include:

```text
Invalid rental period
Vehicle unavailable
Vehicle inactive
Location inactive
Invalid booking transition
Unauthorized operation
Conflicting booking
Invalid vehicle status transition
```

* **BR-ERR-01:** Invalid business operations shall be rejected.

* **BR-ERR-02:** A rejected business operation shall not partially modify the business state.

* **BR-ERR-03:** Validation rules shall be applied consistently between availability checking and booking creation.

* **BR-ERR-04:** Technical implementation of error responses is defined separately in API and error-handling documentation.

---

# 27. Cross-Service Rules

* **BR-CORE-01:** The system shall follow database-per-service ownership.

* **BR-CORE-02:** No service shall directly query or modify another service's database.

* **BR-CORE-03:** Booking Service shall not directly access Vehicle Service's database.

* **BR-CORE-04:** Vehicle Service shall remain the authority for vehicle, vehicle type, and location data.

* **BR-CORE-05:** Booking Service shall remain the authority for booking state and booking consistency.

* **BR-CORE-06:** Cross-service consistency shall be achieved through service APIs and/or asynchronous events.

* **BR-CORE-07:** The system shall not assume that distributed operations are automatically atomic.

* **BR-CORE-08:** Distributed transaction behavior and event consistency are defined in technical architecture documents.

---

# 28. Business Rule Priorities

When business rules conflict, the following principles apply:

1. Data correctness
2. Booking consistency
3. Authorization
4. Valid lifecycle transition
5. Historical integrity
6. Operational availability
7. User convenience

For example:

```text
User convenience
       ↓
must not override
       ↓
Booking consistency
```

An administrator or customer cannot bypass the booking overlap rule merely because a vehicle appears available.

---

# 29. Explicitly Out of Scope

The following are not part of the current business scope:

* Full accounting system
* Expense Management
* Payroll
* Tax accounting
* General Ledger
* Invoice accounting workflow
* Real payment gateway
* Insurance claim management
* Accident workflow
* Detailed vehicle damage workflow
* Maintenance scheduling
* Repair history management
* GPS tracking
* Driver management
* Coupon/loyalty system
* Review/rating system
* Advanced pricing engine
* Recommendation engine

These may be considered future extensions.

---

# 30. TBD Items

The following decisions remain intentionally undefined until a future design phase:

## User

* Exact password policy
* Token expiration
* Account lockout
* Account recovery
* Profile validation
* Admin role assignment
* Admin permission granularity

## Vehicle

* Exact vehicle attributes
* Vehicle status transition authority
* Vehicle reactivation rules
* Vehicle maintenance workflow
* Vehicle replacement workflow
* Behavior when deactivating a vehicle with future confirmed bookings

## Vehicle Type

* Exact vehicle type catalog
* Type deletion/archive rules
* Type reassignment rules
* Type reactivation rules

## Location

* Location naming convention
* Address validation
* Geographic information
* Operating hours
* Location hierarchy
* Behavior when deactivating a location with future bookings

## Booking

* Exact pricing calculation
* Minimum rental duration
* Maximum rental duration
* Advance booking rules
* Booking modification rules
* Booking expiration
* No-show policy
* Exact administrative booking permissions

## Cancellation

* Cancellation deadline
* Cancellation fee
* Refund policy
* Admin approval requirements

## Rental

* Pickup verification
* Return verification
* Vehicle inspection
* Damage handling
* Mileage tracking
* Fuel/battery handling
* Late return policy
* Late fees

## Financial

* Revenue recognition rules
* Refund handling
* Discount handling
* Tax handling
* Payment settlement
* Future Expense Management

## Technical/Consistency

* Exact booking concurrency strategy
* Transaction isolation level
* Locking strategy
* Idempotency key format
* Idempotency retention period
* Audit storage model
* Event consistency model

---

# 31. Current MVP Business Rule Baseline

The current MVP must implement the following core model.

### User

```text
Customer
Admin
```

### Vehicle Status

```text
Available
Maintenance
Unavailable
Retired
```

`Reserved` and `Rented` are derived indications from pending/confirmed/active Booking records, not persisted Vehicle operational statuses.

### Booking Status

```text
Pending
Confirmed
Rejected
Cancelled
Active
Returned
Completed
```

### Derived Booking Status

```text
Overdue
```

### Rental Period

```text
[PickupUtc, ReturnUtc)
```

### Overlap Rule

```text
Existing.PickupUtc < New.ReturnUtc
AND
Existing.ReturnUtc > New.PickupUtc
```

### Core Booking Lifecycle

```text
Pending
   |
   +------> Rejected
   |
   v
Confirmed
   |
   +------> Cancelled
   |
   v
Active
   |
   v
Returned
   |
   v
Completed
```

### Core Vehicle Operational Lifecycle

```text
Available <-> Maintenance
Available <-> Unavailable
Available / Maintenance / Unavailable -> Retired
```

Booking-derived indications:

```text
Pending / Confirmed -> Reserved
Active -> Rented
Returned / Completed / Cancelled / Rejected -> no longer Reserved or Rented
```

This baseline shall be used as the source of truth for subsequent:

* Domain Model
* Service Boundaries
* Database Design
* API Design
* Concurrency Design
* Kafka/Event Design
* Frontend Screen Specification
* Admin Management
* Testing Strategy
* Implementation Tasks
