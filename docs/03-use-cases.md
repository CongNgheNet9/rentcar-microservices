# 03. Use Cases

## 1. Scope

This document defines the main customer and administrative use cases implied by `docs/00-project-overview.md`.

It focuses on business behavior, not API contracts or implementation details. Where a policy is unspecified, it is marked `TBD`.

---

## 2. Customer Use Cases

### UC-CUST-01: Register account

- Actor: Customer
- Preconditions:
  - The customer does not already have an active account with the same identity.
  - The system is available.
- Main flow:
  1. Customer enters registration details.
  2. System validates the provided identity data.
  3. System creates the customer account.
  4. System confirms successful registration.
- Alternative flow:
  1. Registration data is invalid or duplicate.
  2. System rejects registration and returns a clear validation or conflict result.
- Failure cases:
  - Duplicate identity or invalid input.
  - System unavailable or storage failure.
- Business rules involved:
  - BR-USER-01, BR-USER-02, BR-USER-05 (TBD)

### UC-CUST-02: Sign in

- Actor: Customer
- Preconditions:
  - Account exists and is active.
- Main flow:
  1. Customer submits credentials.
  2. System verifies identity and role.
  3. System authenticates the customer and issues an authenticated session or token.
- Alternative flow:
  1. Credentials are incorrect.
  2. System rejects login with an authentication failure.
- Failure cases:
  - Locked or inactive account.
  - Authentication service failure.
- Business rules involved:
  - BR-USER-01, BR-USER-02, BR-AUTH-01, BR-AUTH-02

### UC-CUST-03: Browse and filter vehicles

- Actor: Customer
- Preconditions:
  - Customer is authenticated.
  - Vehicle records are available.
- Main flow:
  1. Customer opens vehicle listing.
  2. Customer searches or filters by type, location, or other supported attributes.
  3. System returns matching vehicles.
- Alternative flow:
  1. No vehicles match the filters.
  2. System returns an empty result set with a relevant message.
- Failure cases:
  - Vehicle service unavailable.
  - Search criteria invalid.
- Business rules involved:
  - BR-VEH-01, BR-VEH-02, BR-VTYPE-01, BR-LOC-01, BR-AVAIL-01

### UC-CUST-04: View vehicle details

- Actor: Customer
- Preconditions:
  - Customer is authenticated.
  - The selected vehicle exists and is visible to customers.
- Main flow:
  1. Customer selects a vehicle.
  2. System retrieves vehicle details.
  3. System displays details and availability context.
- Alternative flow:
  1. Vehicle is inactive or unavailable.
  2. System presents a not-available or restricted message.
- Failure cases:
  - Vehicle record missing or archived.
  - Service timeout or data inconsistency.
- Business rules involved:
  - BR-VEH-04, BR-VEH-05, BR-AVAIL-02, BR-AVAIL-03

### UC-CUST-05: Check vehicle availability for a rental period

- Actor: Customer
- Preconditions:
  - Customer is authenticated.
  - Vehicle is selected.
  - Pickup and return times are provided.
- Main flow:
  1. Customer chooses pickup and return times.
  2. System evaluates the requested rental period.
  3. System checks vehicle operational status and overlapping pending/confirmed/active bookings.
  4. System reports the vehicle as available or unavailable for that period.
- Alternative flow:
  1. Selected period is invalid.
  2. System rejects the request and asks the customer to correct the dates.
- Failure cases:
  - Invalid date range.
  - Booking overlap check fails due to concurrent requests.
  - Vehicle deactivated in the meantime.
- Business rules involved:
  - BR-AVAIL-01 through BR-AVAIL-06, BR-PERIOD-01 through BR-PERIOD-07

### UC-CUST-06: Create booking

- Actor: Customer
- Preconditions:
  - Customer is authenticated.
  - Vehicle is available for the requested rental period.
  - Pickup and return details are valid.
- Main flow:
  1. Customer selects a vehicle, location(s), and rental period.
  2. System validates the selected period and current availability.
  3. System creates a booking in a valid initial lifecycle state.
  4. System confirms booking creation.
- Alternative flow:
  1. Vehicle is unavailable due to overlap or deactivation.
  2. System blocks booking creation and explains the reason.
- Failure cases:
  - Overlap with another pending/confirmed/active booking.
  - Invalid period.
  - Concurrent booking race condition.
  - Reservation creation failure.
- Business rules involved:
  - BR-BOOK-01 through BR-BOOK-07, BR-AVAIL-01 through BR-AVAIL-06, BR-PERIOD-01 through BR-PERIOD-07, BR-LC-01, BR-CORE-04

### UC-CUST-07: View booking history and details

- Actor: Customer
- Preconditions:
  - Customer is authenticated.
  - Booking records exist for the customer.
- Main flow:
  1. Customer requests booking history.
  2. System retrieves all bookings linked to the customer.
  3. System presents booking status, dates, and vehicle summary.
- Alternative flow:
  1. No bookings exist.
  2. System displays an empty list.
- Failure cases:
  - Missing booking data.
  - Authorization mismatch.
- Business rules involved:
  - BR-USER-04, BR-BOOK-01, BR-BOOK-04, BR-AUTH-02

### UC-CUST-08: Cancel booking

- Actor: Customer
- Preconditions:
  - Customer is authenticated.
  - Booking exists and is linked to the customer.
  - Booking is in a cancellable state.
- Main flow:
  1. Customer selects a booking for cancellation.
  2. System validates whether the booking is eligible for cancellation.
  3. System updates the booking status to `Cancelled` and records the cancellation timestamp.
  4. System confirms the cancellation.
- Alternative flow:
  1. Booking is already completed, rejected, or cancelled.
  2. System rejects cancellation.
- Failure cases:
  - Booking not found.
  - Cancellation policy not satisfied.
  - Concurrent changes to booking state.
- Business rules involved:
  - BR-CANCEL-01 through BR-CANCEL-05, BR-LC-01 through BR-LC-06, BR-AUTH-02

---

## 3. Admin Use Cases

### UC-ADMIN-01: Create vehicle

- Actor: Administrator
- Preconditions:
  - Administrator is authenticated and authorized.
  - Required vehicle metadata is available.
- Main flow:
  1. Administrator enters vehicle details.
  2. System validates required information.
  3. System creates the vehicle record and assigns it to a vehicle type and location.
  4. System confirms creation.
- Alternative flow:
  1. Required fields are missing or invalid.
  2. System rejects the request with validation feedback.
- Failure cases:
  - Duplicate license plate or conflicting vehicle data.
  - Location or type not found.
- Business rules involved:
  - BR-VEH-01, BR-VEH-02, BR-VEH-03, BR-VTYPE-03, BR-LOC-03, BR-AUTH-03

### UC-ADMIN-02: Update vehicle

- Actor: Administrator
- Preconditions:
  - Administrator is authenticated.
  - Vehicle exists.
- Main flow:
  1. Administrator changes vehicle details.
  2. System validates the update.
  3. System saves the updated vehicle record.
- Alternative flow:
  1. Update attempts to assign an invalid status or type.
  2. System rejects the update.
- Failure cases:
  - Missing vehicle.
  - Invalid state change.
- Business rules involved:
  - BR-VEH-02, BR-VEH-04, BR-VEH-05, BR-VEH-06, BR-AUTH-03

### UC-ADMIN-03: Deactivate vehicle

- Actor: Administrator
- Preconditions:
  - Administrator is authenticated.
  - Vehicle exists.
- Main flow:
  1. Administrator marks a vehicle as inactive or deactivated.
  2. System updates the vehicle state.
  3. System prevents new bookings for the vehicle while it remains inactive.
- Alternative flow:
  1. Vehicle has active bookings that prevent deactivation under business policy.
  2. System blocks the deactivation until the business rule is satisfied.
- Failure cases:
  - Active booking conflicts with deactivation.
  - Invalid state transition.
- Business rules involved:
  - BR-VEH-04, BR-VEH-05, BR-AVAIL-02, BR-AUTH-03

### UC-ADMIN-04: Manage vehicle type

- Actor: Administrator
- Preconditions:
  - Administrator is authenticated.
- Main flow:
  1. Administrator creates or updates a vehicle type.
  2. System validates type data.
  3. System stores the type for reuse by vehicles.
- Alternative flow:
  1. Type data is invalid or the type is in use under a retention rule.
  2. System rejects or limits the operation.
- Failure cases:
  - Duplicate type definition.
  - Type in use by active vehicles.
- Business rules involved:
  - BR-VTYPE-01 through BR-VTYPE-05

### UC-ADMIN-05: Manage location

- Actor: Administrator
- Preconditions:
  - Administrator is authenticated.
- Main flow:
  1. Administrator creates or updates a location.
  2. System validates location data.
  3. System stores the location for vehicle and booking use.
- Alternative flow:
  1. Location is invalid or inactive.
  2. System rejects the change.
- Failure cases:
  - Duplicate location name or invalid location data.
  - Existing bookings rely on a location that cannot be deactivated.
- Business rules involved:
  - BR-LOC-01 through BR-LOC-05, BR-AUTH-03

### UC-ADMIN-06: View and manage bookings

- Actor: Administrator
- Preconditions:
  - Administrator is authenticated.
- Main flow:
  1. Administrator retrieves bookings or filters by status or customer.
  2. System displays booking details.
  3. Administrator transitions a booking to an allowed lifecycle state.
- Alternative flow:
  1. Booking state transition is invalid.
  2. System rejects the update.
- Failure cases:
  - Invalid state change.
  - Unauthorized change attempt.
  - Missing booking reference.
- Business rules involved:
  - BR-BOOK-01 through BR-BOOK-07, BR-LC-01 through BR-LC-07, BR-AUTH-03, BR-AUTH-05

### UC-ADMIN-07: Operate booking lifecycle

- Actor: Administrator
- Preconditions:
  - Administrator is authenticated and authorized.
  - Booking exists.
- Main flow:
  1. Administrator selects the explicit operation appropriate to the current booking state: confirm, reject, record pickup, record return, or complete.
  2. Booking Service verifies the current state, required conditions, and row version.
  3. Booking Service applies only the defined transition and records its audit history in the Booking DB transaction.
  4. System returns the updated booking state.
- Alternative flow:
  - If the transition is not allowed from the current state, the system rejects it without changing the booking.
- Failure cases:
  - Booking not found.
  - Administrator is unauthorized.
  - Concurrent state update made the submitted state stale.
  - Booking DB or required dependency is unavailable.
- Business rules involved:
  - BR-LC-01 through BR-LC-08, BR-AUTH-03, BR-AUTH-10, BR-CON-04, BR-REL-04

---

## 4. High-Priority Use Cases Summary

The following use cases are the most important for project correctness:

- UC-CUST-05: Check vehicle availability for a rental period
- UC-CUST-06: Create booking
- UC-CUST-08: Cancel booking
- UC-ADMIN-06: View and manage bookings
- UC-ADMIN-07: Operate booking lifecycle

These are the primary paths that enforce availability correctness, limit overlap, and validate booking lifecycle behavior.

---

## 5. TBD Items

The following use-case details are not specified by the current project definition and remain `TBD`:

- exact login and registration validation rules
- exact password policy and authentication flow details
- exact vehicle search filters beyond type and location
- exact cancellation approval and fee rules
- exact admin workflow for booking approval or rejection
- exact timing of booking confirmation and activation
- exact vehicle deactivation rules when active bookings exist
- exact admin permission matrix beyond Customer/Admin distinction
