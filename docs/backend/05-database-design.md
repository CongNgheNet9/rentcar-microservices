# 05. Database Design

## 1. Purpose

This document defines the initial database design for the Vehicle Rental System based on the approved requirements, domain model, and service boundaries.

It is intentionally architecture-level and service-owned. It does not define partitioning, sharding, or any distributed database strategy.

---

## 2. Architectural Rules

- Each service owns its own database.
- The User Service owns the User DB.
- The Vehicle Service owns the Vehicle DB.
- The Booking Service owns the Booking DB.
- No cross-service foreign keys are allowed.
- Cross-service references are represented as IDs only, not database-level foreign keys.
- The Booking Service is the source of truth for booking correctness.

---

## 3. User Service Database

### 3.1 Source of truth
- User identity and authorization state.

### 3.2 Data ownership
- User Service owns all user records and authentication data.

### 3.3 Tables

#### Users

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| UserId | uniqueidentifier | PK | Unique user identity |
| Name | nvarchar(200) | NOT NULL | Display name |
| Email | nvarchar(320) | NOT NULL, UNIQUE | Login identity |
| PasswordHash | nvarchar(512) | NOT NULL | Hashed credential |
| Role | nvarchar(30) | NOT NULL | Customer or Admin |
| Status | nvarchar(30) | NOT NULL | Active/inactive user state |
| CreatedAtUtc | datetime2 | NOT NULL | Record creation time |
| UpdatedAtUtc | datetime2 | NOT NULL | Last update time |
| DeletedAtUtc | datetime2 | NULL | Soft-delete marker when used |

Indexes:
- IX_Users_Email unique on Email
- IX_Users_Role_Status on Role, Status
- IX_Users_DeletedAtUtc on DeletedAtUtc

Notes:
- PasswordHash is treated as sensitive data and is not exposed outside the User Service.
- Exact password policy and session/token details remain `TBD`.

---

## 4. Vehicle Service Database

### 4.1 Source of truth
- Vehicle master data, vehicle types, and locations.

### 4.2 Data ownership
- Vehicle Service owns vehicle catalog data and location metadata.

### 4.3 Tables

#### VehicleTypes

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| Id | bigint | PK | Type identifier |
| Name | nvarchar(100) | NOT NULL, UNIQUE | Vehicle category name |
| Description | nvarchar(500) | NULL | Optional metadata |
| IsActive | bit | NOT NULL default 1 | Type availability |
| CreatedAtUtc | datetimeoffset | NOT NULL | Creation time in UTC |
| UpdatedAtUtc | datetimeoffset | NOT NULL | Update time in UTC |

Indexes:
- Unique index on Name

#### Locations

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| Id | bigint | PK | Location identifier |
| Name | nvarchar(150) | NOT NULL, UNIQUE | Location name |
| Description | nvarchar(500) | NULL | Optional metadata |
| IsActive | bit | NOT NULL default 1 | Location active status |
| CreatedAtUtc | datetimeoffset | NOT NULL | Creation time in UTC |
| UpdatedAtUtc | datetimeoffset | NOT NULL | Update time in UTC |

Indexes:
- Unique index on Name

#### Vehicles

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| Id | bigint | PK | Vehicle identifier |
| VehicleTypeId | bigint | NOT NULL | Vehicle category |
| LocationId | bigint | NOT NULL | Current operational location |
| LicensePlate | nvarchar(50) | NOT NULL, UNIQUE | Unique vehicle identifier |
| Brand | nvarchar(100) | NOT NULL | Vehicle brand |
| Model | nvarchar(100) | NOT NULL | Vehicle model |
| Year | int | NOT NULL | Vehicle year |
| Status | nvarchar(30) | NOT NULL | Operational status |
| IsActive | bit | NOT NULL default 1 | Whether the record is active |
| CreatedAtUtc | datetimeoffset | NOT NULL | Creation time in UTC |
| UpdatedAtUtc | datetimeoffset | NOT NULL | Last update time in UTC |

Constraints:
- FK_Vehicles_VehicleTypeId -> VehicleTypes(Id)
- FK_Vehicles_LocationId -> Locations(Id)
- CHECK (Year >= 1900)
- CHECK (Status IN ('Available','Maintenance','Unavailable','Retired'))

Indexes:
- IX_Vehicles_VehicleTypeId on VehicleTypeId
- IX_Vehicles_LocationId on LocationId
- IX_Vehicles_IsActive_Status_VehicleTypeId_LocationId on IsActive, Status, VehicleTypeId, LocationId
- Unique index on LicensePlate

Notes:
- Vehicle availability is not treated as a permanent static flag; it is derived in the booking logic and the availability domain.
- `Reserved` and `Rented` are derived from Booking Service records and are not persisted in `Vehicles.Status`.
- Deactivation uses `IsActive` and preserves historical references without deleting the vehicle record.

---

## 5. Booking Service Database

### 5.1 Source of truth
- Booking data, booking lifecycle, period values, and overlap prevention logic.

### 5.2 Data ownership
- Booking Service owns the booking records and all booking lifecycle data.

### 5.3 Tables

#### Bookings

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| BookingId | uniqueidentifier | PK | Booking identifier |
| CustomerUserId | uniqueidentifier | NOT NULL | Customer who created the booking |
| VehicleId | bigint | NOT NULL | Vehicle being booked |
| PickupLocationId | bigint | NOT NULL | Pickup location |
| ReturnLocationId | bigint | NOT NULL | Return location |
| PickupUtc | datetime2 | NOT NULL | Rental start |
| ReturnUtc | datetime2 | NOT NULL | Rental end |
| Status | nvarchar(30) | NOT NULL | Booking lifecycle state |
| TotalPrice | decimal(18,2) | NULL | Reserved for future pricing scope; unused by MVP |
| CreatedAtUtc | datetime2 | NOT NULL | Booking creation time |
| UpdatedAtUtc | datetime2 | NOT NULL | Last update time |
| CancelledAtUtc | datetime2 | NULL | Cancellation time |
| CompletedAtUtc | datetime2 | NULL | Completion time |
| RowVersion | rowversion | NOT NULL | Optimistic concurrency token |
| DeletedAtUtc | datetime2 | NULL | Soft-delete marker if needed |

Constraints:
- CHECK (ReturnUtc > PickupUtc)
- CHECK (Status IN ('Pending','Confirmed','Rejected','Cancelled','Active','Returned','Completed'))

Indexes:
- IX_Bookings_CustomerUserId on CustomerUserId
- IX_Bookings_VehicleId_Status on VehicleId, Status
- IX_Bookings_VehicleId_PickupUtc_ReturnUtc on VehicleId, PickupUtc, ReturnUtc
- IX_Bookings_VehicleId_Status_PickupUtc_ReturnUtc on VehicleId, Status, PickupUtc, ReturnUtc
- IX_Bookings_Status on Status
- IX_Bookings_CreatedAtUtc on CreatedAtUtc
- IX_Bookings_DeletedAtUtc on DeletedAtUtc

Notes:
- The Booking Service stores references to customer and vehicle IDs as plain identifiers, not as cross-database foreign keys.
- A rowversion column is included to support optimistic concurrency checks at the booking aggregate level.

#### BookingStatusHistory

This table is optional but useful for an audit trail and is justified by the booking lifecycle requirement.

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| BookingStatusHistoryId | bigint | PK | Row identity |
| BookingId | uniqueidentifier | NOT NULL | Linked booking |
| PreviousStatus | nvarchar(30) | NULL | State before transition |
| NewStatus | nvarchar(30) | NOT NULL | State after transition |
| ChangedAtUtc | datetime2 | NOT NULL | Transition timestamp |
| ChangedByUserId | uniqueidentifier | NULL | User who performed the transition |
| Reason | nvarchar(500) | NULL | Optional transition reason |

Constraints:
- FK_BookingStatusHistory_BookingId -> Bookings(BookingId)

Indexes:
- IX_BookingStatusHistory_BookingId on BookingId
- IX_BookingStatusHistory_ChangedAtUtc on ChangedAtUtc

Notes:
- This table is within the Booking DB and remains within the Booking Service’s ownership boundary.

#### IdempotencyKeys

Stores the result of successfully committed booking-creation requests so retries do not create a second booking. Only Booking Service owns this table. The idempotency record and its booking are committed in the same Booking DB transaction.

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| CustomerUserId | uniqueidentifier | PK (part of composite key) | Authenticated customer scope |
| IdempotencyKey | nvarchar(128) | PK (part of composite key) | Client-generated logical request key |
| RequestHash | varbinary(32) | NOT NULL | Hash of normalized request fields |
| BookingId | uniqueidentifier | NULL, FK to Bookings(BookingId) | Booking created by the successful request |
| ResponseStatusCode | smallint | NULL until booking commits | Stored successful HTTP status |
| ResponseBody | nvarchar(max) | NULL until booking commits | Safe response representation for retry |
| CreatedAtUtc | datetime2 | NOT NULL | Record creation time |
| ExpiresAtUtc | datetime2 | NULL | Optional expiry; retention policy TBD |

Constraints and indexes:
- PK_IdempotencyKeys on `(CustomerUserId, IdempotencyKey)`
- FK_IdempotencyKeys_BookingId -> Bookings(BookingId), within the Booking DB
- A key reused with a different request hash returns a conflict.

The idempotency claim is inserted and finalized inside the booking transaction. Its response fields are populated before commit and are therefore non-null for every committed row. The MVP stores successful booking-creation outcomes only. A rejected availability/conflict attempt rolls back and does not reserve the key; a later retry can be evaluated again. Retention/expiry remains TBD.

---

## 6. Cross-Service References

The project forbids cross-service foreign keys. The schema therefore uses IDs only for cross-service references.

Examples:
- Booking.CustomerUserId references a User ID owned by the User Service.
- Booking.VehicleId references a Vehicle ID owned by the Vehicle Service.
- Booking.PickupLocationId and Booking.ReturnLocationId reference Location IDs owned by the Vehicle Service.

These are logical references, not database foreign keys.

---

## 7. Relationships

### User Service
- One User has many bookings logically, but no direct relational database join is created.

### Vehicle Service
- One VehicleType has many Vehicles.
- One Location has many Vehicles.
- One Location may be referenced by many bookings as a pickup or return location.

### Booking Service
- One Booking belongs to one customer user logically.
- One Booking belongs to one vehicle logically.
- One Booking belongs to one pickup location and one return location logically.
- One Booking may have many historical status transitions.

---

## 8. Audit Fields

Audit fields are included in each service-owned table as appropriate:

- CreatedAtUtc
- UpdatedAtUtc
- DeletedAtUtc when soft deletion is appropriate
- CancelledAtUtc / CompletedAtUtc in bookings
- BookingStatusHistory with ChangedAtUtc and ChangedByUserId

These fields are for operational accountability and do not change service ownership rules.

---

## 9. Soft Deactivation / Soft Delete

### User Service
- Users may use DeletedAtUtc for account deactivation or retention scenarios.

### Vehicle Service
- VehicleType, Location, and Vehicle records may use IsActive and DeletedAtUtc to maintain historical references without deleting records.

### Booking Service
- Bookings may use DeletedAtUtc only if the system must preserve history after logical deletion; otherwise, state-only lifecycle management is sufficient.

Note:
- The project does not define an explicit soft delete policy for all entities beyond the base active/inactive business model. These remain consistent with the current domain model and can be refined later.

---

## 10. Concurrency-Related Fields

### Booking DB
- RowVersion is included on Bookings to support optimistic concurrency checks in the booking aggregate.
- This is justified because the project explicitly requires concurrency correctness and booking validation under concurrent requests.

### Not yet introduced
- distributed locking, partitioning, sharding, and database-level lock strategies are intentionally not part of this design document.
- The Booking Service uses the transaction-owned per-vehicle SQL Server application-lock strategy defined in `docs/backend/08-concurrency-and-transaction.md`.

---

## 11. Validation Against Domain and Business Rules

This schema is consistent with the approved domain model and business rules:

- User records are owned by User Service.
- Vehicle, type, and location records are owned by Vehicle Service.
- Booking records are owned by Booking Service.
- Booking records store the required rental-period fields and lifecycle state.
- `Returned` is a persisted booking status; `Overdue` remains derived and is not persisted.
- Pending, confirmed, and active bookings hold the requested vehicle period.
- TotalPrice is nullable and explicitly unused in the MVP.
- Successful booking idempotency results are stored in the Booking DB in the same local transaction.
- Vehicle and booking overlap prevention is implemented in the Booking Service domain logic, not by direct cross-service database joins.
- The half-open interval requirement is captured in the booking table semantics: return must be after pickup.
- Vehicle deactivation and location deactivation are represented as active/inactive flags in the Vehicle DB.

Remaining unspecified policies:
- exact audit retention period
- exact user account lifecycle policy
- exact cancellation eligibility details beyond the base state model
- exact pricing rules and price source model, which are outside the MVP

These remain `TBD`.

---

## 12. Final Schema Summary

| Service | Main tables | Ownership |
|---|---|---|
| User Service | Users | User Service |
| Vehicle Service | VehicleTypes, Locations, Vehicles | Vehicle Service |
| Booking Service | Bookings, BookingStatusHistory, IdempotencyKeys | Booking Service |

All cross-service references are logical references via IDs only; there are no cross-service foreign keys.
