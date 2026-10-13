# 06. API Design

## 1. Purpose

This document defines the initial REST API contract for the Vehicle Rental System at a minimal, business-justified level.

The design is intentionally narrow and limited to the requirements defined in the approved documentation. It does not define implementation code or detailed validation frameworks.

---

## 2. API Design Principles

- Keep the API minimal.
- Expose only endpoints required by the approved business use cases.
- Keep customer and admin authorization clear.
- Do not add endpoints for speculative features.
- Use explicit validation and business-error responses.

---

## 3. Shared API Conventions

### Authentication
- Most endpoints require authentication unless explicitly marked as public.
- Public endpoints are registration and login.

### Authorization
- Customer endpoints are restricted to the current authenticated customer.
- Admin endpoints are restricted to administrators.

### Common error response
Errors use the Problem Details style structure defined in `09-error-handling-and-validation.md`, with stable `code`, `traceId`, and optional field-level `errors`.

### Common HTTP status codes
- 200 OK
- 201 Created
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 422 Unprocessable Entity
- 503 Service Unavailable
- 504 Gateway Timeout
- 500 Internal Server Error

---

## 4. User Service API

### 4.1 Public endpoints

#### POST /auth/register
Purpose:
- Register a customer account.

Authentication requirement:
- None

Authorization requirement:
- None

Request:
- name
- email
- password

Role is not accepted from the client; public registration creates a Customer account only.

Response:
- user summary or created user identifier

Success status:
- 201 Created

Validation errors:
- missing name/email/password
- invalid email format
- weak password (if policy applies)

Business errors:
- duplicate email
- account already exists

#### POST /auth/login
Purpose:
- Authenticate a user and return a token.

Authentication requirement:
- None

Authorization requirement:
- None

Request:
- email
- password

Response:
- access token
- token type
- expiry metadata
- user info summary

Success status:
- 200 OK

Validation errors:
- missing email/password
- invalid credentials format

Business errors:
- invalid credentials
- user disabled or inactive

#### GET /users/me
Purpose:
- Retrieve the authenticated user profile.

Authentication requirement:
- Required

Authorization requirement:
- Customer or Admin, but only for the current user

Request:
- none

Response:
- user profile summary

Success status:
- 200 OK

Errors:
- 401 Unauthorized
- 404 Not Found

---

## 5. Vehicle Service API

### 5.1 Customer-facing pages

#### GET /api/vehicles
Purpose:
- List vehicles with optional filtering.

Authentication requirement:
- Anonymous read-only access for the active, available customer catalog; Admin requests may also be authenticated

Authorization requirement:
- No role required for the public catalog response; Admin catalog endpoints remain Admin-only

Query parameters:
- vehicleTypeId
- locationId
- search
- page
- pageSize

The customer-facing catalog includes only active vehicles whose operational status is `Available`, and whose vehicle type and location are active. Inactive records are visible only through administrator endpoints.

Response:
- list of vehicles with summary details

Success status:
- 200 OK

Validation errors:
- invalid filter values
- invalid pagination values

Business errors:
- no vehicles found (empty list is acceptable)

#### GET /api/vehicles/{vehicleId}
Purpose:
- Retrieve vehicle details.

Authentication requirement:
- Anonymous read-only access to available public vehicle details; Admin requests may also be authenticated

Authorization requirement:
- No role required for the public detail response; Admin detail endpoints remain Admin-only

Response:
- vehicle detail information

Success status:
- 200 OK

Errors:
- 404 Not Found

### 5.2 Admin endpoints

#### GET /api/admin/vehicles
Purpose:
- List and filter all vehicles, including inactive records.

Authentication requirement:
- Required

Authorization requirement:
- Admin only

#### GET /api/admin/vehicles/{vehicleId}
Purpose:
- Retrieve any vehicle, including inactive records, for administration.

Authentication requirement:
- Required

Authorization requirement:
- Admin only

#### POST /api/admin/vehicles
Purpose:
- Create a vehicle.

Authentication requirement:
- Required

Authorization requirement:
- Admin only

Request:
- vehicleTypeId
- locationId
- licensePlate
- brand
- model
- year

The service creates vehicles as active with status `Available`. Status changes and deactivation use separate operations.

Response:
- created vehicle detail

Success status:
- 201 Created

Validation errors:
- missing required fields
- invalid license plate
- invalid year
- invalid status

Business errors:
- vehicle type not found
- location not found
- duplicate license plate

#### PUT /api/admin/vehicles/{vehicleId}
Purpose:
- Update vehicle information.

Authentication requirement:
- Required

Authorization requirement:
- Admin only

Request:
- editable fields only

Response:
- updated vehicle detail

Success status:
- 200 OK

Errors:
- 404 Not Found
- 409 Conflict if business rule prevents update

#### PATCH /api/admin/vehicles/{vehicleId}/deactivate
Purpose:
- Soft-deactivate or disable the vehicle.

Authentication requirement:
- Required

Authorization requirement:
- Admin only

Response:
- updated vehicle record or confirmation

Success status:
- 204 No Content

Business errors:
- cannot deactivate if future booking rules disallow it (if defined later)

#### GET /api/vehicle-types
Purpose:
- List vehicle types.

Authentication requirement:
- Anonymous read-only access to active vehicle types

Authorization requirement:
- No role required

Response:
- list of vehicle types

#### GET /api/admin/vehicle-types
Purpose:
- List vehicle types, including inactive types.

Authentication requirement:
- Required

Authorization requirement:
- Admin only

#### POST /api/admin/vehicle-types
Purpose:
- Create a vehicle type.

Authentication requirement:
- Required

Authorization requirement:
- Admin only

#### PUT /api/admin/vehicle-types/{vehicleTypeId}
Purpose:
- Update a vehicle type.

Authentication requirement:
- Required

Authorization requirement:
- Admin only

#### PATCH /api/admin/vehicle-types/{vehicleTypeId}/deactivate
Purpose:
- Deactivate a vehicle type while preserving references from existing vehicles.

Authentication requirement:
- Required

Authorization requirement:
- Admin only

#### GET /api/locations
Purpose:
- List rental locations.

Authentication requirement:
- Anonymous read-only access to active rental locations

Authorization requirement:
- No role required

#### GET /api/admin/locations
Purpose:
- List locations, including inactive locations.

Authentication requirement:
- Required

Authorization requirement:
- Admin only

#### POST /api/admin/locations
Purpose:
- Create a rental location.

Authentication requirement:
- Required

Authorization requirement:
- Admin only

#### PUT /api/admin/locations/{locationId}
Purpose:
- Update rental location metadata.

Authentication requirement:
- Required

Authorization requirement:
- Admin only

#### PATCH /api/admin/locations/{locationId}/deactivate
Purpose:
- Deactivate a location without deleting records that reference it.

Authentication requirement:
- Required

Authorization requirement:
- Admin only

---

## 6. Booking Service API

> **Implementation status:** B04-B07 are implemented: the API checks Vehicle Service eligibility, performs transaction-locked overlap prevention, requires `Idempotency-Key` on creation, and exposes the documented customer and Admin lifecycle operations. The availability endpoint is advisory; creation rechecks overlap under the database lock.

### 6.1 Booking availability and creation

#### POST /bookings/availability
Purpose:
- Check whether a vehicle is available for a requested rental period.

Authentication requirement:
- Required

Authorization requirement:
- Customer or Admin

Request:
- vehicleId
- pickupUtc
- returnUtc
- pickupLocationId
- returnLocationId

Response:
- `isAvailable`
- `reason` (`VehicleUnavailable`, `LocationUnavailable`, or `OverlappingBooking`) when unavailable
- `overlappingBookingId` when an existing reservation causes the conflict

Success status:
- 200 OK

Validation errors:
- missing vehicleId or dates
- return time not after pickup time

Business errors:
- vehicle not found
- vehicle inactive or unavailable under domain rules
- overlapping booking exists

The response is advisory and is not a reservation. Booking creation repeats the overlap check while holding the vehicle-scoped database lock.

The response is advisory and is not a reservation. Booking creation repeats the overlap check while holding the vehicle-scoped database lock.

#### POST /bookings
Purpose:
- Create a booking.

Authentication requirement:
- Required

Authorization requirement:
- Customer only for self-booking

Request:
- vehicleId
- pickupLocationId
- returnLocationId
- pickupUtc
- returnUtc

Required header:
- `Idempotency-Key` (required for booking creation; scoped to the authenticated customer)

Response:
- booking detail
- status

Success status:
- 201 Created

Validation errors:
- invalid date range
- missing required fields
- invalid vehicle or location references

Business errors:
- vehicle or rental location is inactive or unavailable
- overlapping booking exists
- idempotency key reused with a different request payload

Conflict status:
- 409 Conflict when overlap is rejected

Idempotent retry:
- A retry with the same key and same normalized request after a successful booking returns the original booking result.
- The same key with a different request returns 409 Conflict.
- The key is scoped to the authenticated customer and is case-sensitive.
- A failed availability/conflict attempt does not consume the key; it may be evaluated again on retry.

Dependency failures:
- Vehicle Service failure returns 502 Bad Gateway.
- A vehicle-scoped booking-lock timeout or database deadlock returns 503 Service Unavailable; clients retry using the same idempotency key.

#### GET /bookings/{bookingId}
Purpose:
- Retrieve booking details for a specific booking.

Authentication requirement:
- Required

Authorization requirement:
- Customer may only access their own booking; Admin may access all bookings.

Response:
- booking details

Success status:
- 200 OK

Errors:
- 404 Not Found
- 403 Forbidden when customer is not owner

#### GET /bookings
Purpose:
- List bookings for the current customer or for admin query purposes.

Authentication requirement:
- Required

Authorization requirement:
- Customer: own bookings only
- Admin: all bookings

Query parameters:
- status
- vehicleId
- customerUserId (admin only)
- fromUtc
- toUtc
- page
- pageSize

Response:
- booking list

Success status:
- 200 OK

### 6.2 Booking lifecycle endpoints

The initial lifecycle is persisted as `Pending -> Confirmed -> Active -> Returned -> Completed`, with `Pending -> Rejected` and `Pending/Confirmed -> Cancelled` as defined in the business rules. Customers may create and cancel their own eligible bookings; Admin performs the other lifecycle operations. These operations are explicit and may not be replaced by an unrestricted status update.

#### POST /bookings/{bookingId}/confirm
Purpose:
- Confirm a pending booking.

Authentication requirement:
- Required

Authorization requirement:
- Admin only

Request:
- none

Response:
- updated booking detail

Success status:
- 200 OK

Business errors:
- booking not found
- booking is not pending
- vehicle/booking is no longer eligible
- concurrent state or reservation conflict

The Booking Service rechecks active vehicle and location eligibility through Vehicle Service before confirming.

#### POST /bookings/{bookingId}/reject
Purpose:
- Reject a pending booking.

Authentication requirement:
- Required

Authorization requirement:
- Admin only

Request:
- optional reason

Response:
- updated booking detail

Success status:
- 200 OK

Business errors:
- booking not found
- booking is not pending

#### POST /bookings/{bookingId}/pickup
Purpose:
- Record vehicle pickup and transition a confirmed booking to active.

Authentication requirement:
- Required

Authorization requirement:
- Admin only

Request:
- none

Response:
- updated booking detail

Success status:
- 200 OK

Business errors:
- booking not found
- booking is not confirmed
- required pickup conditions are not met

#### POST /bookings/{bookingId}/return
Purpose:
- Record vehicle return and transition an active booking to returned.

Authentication requirement:
- Required

Authorization requirement:
- Admin only

Request:
- optional note

Response:
- updated booking detail

Success status:
- 200 OK

Business errors:
- booking not found
- booking is not active

#### POST /bookings/{bookingId}/complete
Purpose:
- Complete processing for a returned booking.

Authentication requirement:
- Required

Authorization requirement:
- Admin only

Request:
- none

Response:
- updated booking detail

Success status:
- 200 OK

Business errors:
- booking not found
- booking is not returned

#### POST /bookings/{bookingId}/cancel
Purpose:
- Cancel an eligible booking.

Authentication requirement:
- Required

Authorization requirement:
- Customer may cancel own booking if eligible
- Admin cancellation is not supported in the MVP; Admin lifecycle actions are limited to the explicitly listed operations.

Request:
- optional reason

The cancellation reason, when supplied, is stored in booking status history.

Response:
- updated booking result

Success status:
- 200 OK

Business errors:
- booking not found
- booking already cancelled/completed/rejected
- cancellation not allowed in current state
- unauthorized customer access

---

## 7. Validation and Error Handling Expectations

### Validation errors
These are expected when the request is malformed or semantically invalid.
Examples:
- missing pickupUtc
- returnUtc earlier than pickupUtc
- unknown vehicleId
- invalid user role

### Business errors
These emerge from the booking or domain rules.
Examples:
- overlapping booking exists
- vehicle not available for the requested period
- attempted invalid state transition
- cancellation not allowed in current state

### Security errors
- 401 Unauthorized for missing or invalid token
- 403 Forbidden for access outside the current user or admin scope

---

## 8. Authorization Matrix

| Action | Customer | Admin |
|---|---|---|
| Register account | Yes | No |
| Login | Yes | Yes |
| View own booking | Yes | Yes (for own booking) |
| View all bookings | No | Yes |
| Create booking | Yes, for self | No |
| Cancel own booking | Yes, if eligible | No |
| Cancel another customer’s booking | No | No |
| Confirm/reject booking | No | Yes |
| Record pickup/return | No | Yes |
| Complete returned booking | No | Yes |
| Create vehicle | No | Yes |
| Update vehicle | No | Yes |
| View all vehicle data | Yes | Yes |

---

## 9. API Scope Validation

This initial API surface is consistent with the approved documentation because it covers the required customer and admin flows while keeping the contract intentionally small.

The following remain `TBD`:
- exact token expiry and refresh semantics
- final status codes for some domain-specific error cases
- exact response envelope shape
- whether the booking availability check should be preview-only or part of booking creation flow
- exact admin approval rules beyond the baseline lifecycle
