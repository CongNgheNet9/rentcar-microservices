# 07. Domain and Application Design

## 1. Purpose

This document defines the internal structure of the backend services at the application/domain design level.

It follows the approved architecture and business rules without introducing unnecessary architectural patterns or speculative infrastructure.

---

## 2. Architectural Principles

- Keep the service layers simple and practical.
- Maintain dependency direction from the outer layers inward.
- Use the domain model as the authority for business rules.
- Keep infrastructure details behind interfaces.
- Do not introduce CQRS, MediatR, event-sourcing, or heavy DDD infrastructure unless the project later shows a clear need.

---

## 3. Dependency Direction

The layers should follow this direction:

```text
Presentation / API
    ↓
Application / Use Cases
    ↓
Domain
    ↓
Infrastructure
```

The domain layer does not depend on infrastructure or API contracts.

---

## 4. Service Structure Overview

### User Service
- Presentation: authentication and user endpoints
- Application: register, login, get current user
- Domain: User aggregate, role validation, auth policy anchor
- Infrastructure: user repository, password hashing, token generation

### Vehicle Service
- Presentation: vehicle, type, and location endpoints
- Application: create/update vehicle, list vehicles, manage types and locations
- Domain: Vehicle, VehicleType, Location aggregates or value objects
- Infrastructure: repository implementations and lookup adapters

### Booking Service
- Presentation: booking and availability endpoints
- Application: create booking, cancel booking, complete booking, query bookings
- Domain: Booking aggregate, booking lifecycle, rental-period logic, overlap policy, booking validation
- Infrastructure: booking repository, vehicle metadata client, user context provider, idempotency store

---

## 5. User Service Design

### Presentation layer
- Auth controller
- User profile controller

Responsibilities:
- handle HTTP requests
- validate request DTOs
- map domain results to response models

### Application layer
Commands:
- RegisterCustomerCommand
- LoginUserCommand

Queries:
- GetCurrentUserQuery

Responsibilities:
- coordinate validation and user creation
- call domain logic and infrastructure services

### Domain layer
- User aggregate
- UserRole enumeration or equivalent
- UserStatus model
- password validation helper (conceptual)

Rules:
- a user must have a valid role
- a customer can access only their own records
- admin access is separate from customer access

### Infrastructure layer
- IUserRepository
- IPasswordHasher
- ITokenService

Responsibilities:
- persistence
- credential hashing
- token generation or validation

---

## 6. Vehicle Service Design

### Presentation layer
- VehicleController
- VehicleTypeController
- LocationController

Responsibilities:
- expose admin and browse endpoints
- map DTOs

### Application layer
Commands:
- CreateVehicleCommand
- UpdateVehicleCommand
- DeactivateVehicleCommand
- CreateVehicleTypeCommand
- CreateLocationCommand

Queries:
- GetVehicleListQuery
- GetVehicleByIdQuery
- GetLocationListQuery

Responsibilities:
- coordinate validation and persistence
- ensure that vehicle lifecycle state changes are authorized

### Domain layer
- Vehicle aggregate
- VehicleType aggregate
- Location aggregate

Rules:
- a vehicle belongs to one vehicle type
- a vehicle has one current location assignment
- a vehicle may be deactivated
- availability is not a permanent static flag

### Infrastructure layer
- IVehicleRepository
- IVehicleTypeRepository
- ILocationRepository

Responsibilities:
- persistence implementation
- read model retrieval for external integration

---

## 7. Booking Service Design

### Presentation layer
- BookingController
- BookingAvailabilityController

Responsibilities:
- handle customer and admin booking requests
- return booking and validation errors in a consistent format

### Application layer
Commands:
- CreateBookingCommand
- CancelBookingCommand
- CompleteBookingCommand
- UpdateBookingStatusCommand (admin lifecycle operation)

Queries:
- CheckBookingAvailabilityQuery
- GetBookingByIdQuery
- GetCustomerBookingsQuery
- GetAdminBookingsQuery

Responsibilities:
- validate user identity and authorization
- verify business rules before persistence
- coordinate transactional operations
- manage idempotent retry behavior when the request carries an idempotency key

### Domain layer
Core domain types:
- Booking aggregate
- RentalPeriod value object or equivalent
- BookingStatus enum/value domain
- BookingPolicy / AvailabilityPolicy domain service
- BookingOverlapChecker domain service
- BookingLifecycleValidator domain service

Domain rules:
- booking period is half-open: `[PickupUtc, ReturnUtc)`
- `ReturnUtc <= PickupUtc` is invalid
- overlapping pending/confirmed/active bookings for the same vehicle are not allowed
- invalid state transitions are rejected
- cancellation may only occur in an eligible state

### Infrastructure layer
- IBookingRepository
- IBookingStatusHistoryRepository (optional but justified)
- IIdempotencyStore
- IVehicleCatalogClient (integration with Vehicle Service)
- IUserContextProvider or equivalent auth claims adapter

Responsibilities:
- persist booking and status history
- provide access to vehicle metadata and user context
- support idempotency checks

---

## 8. Validation Responsibility

Validation should be split by layer:

- API layer: request shape and authentication/authorization check
- Application layer: business validation and orchestration
- Domain layer: invariant enforcement and lifecycle rules
- Infrastructure layer: persistence validation and data consistency checks

This keeps validation responsibilities clear without over-abstracting the system.

---

## 9. Transaction Boundary

### Booking Service transaction boundary
The critical transaction boundary is around booking creation and validation.

Recommended boundary:
- validate actor identity and authorization
- validate rental period
- check overlapping bookings and current state
- create booking record
- persist booking status history if used
- commit a single transaction in the Booking DB

This is the minimum unit needed to keep booking consistency intact.

Important note:
- The booking transaction boundary is inside the Booking Service DB; service-to-service calls to Vehicle Service for metadata are not part of the same transactional scope.
- Vehicle `Reserved` and `Rented` indications are derived from Booking Service state; booking lifecycle operations do not write to the Vehicle DB.
- This is consistent with the approved database-per-service model.

---

## 10. Repository and Persistence Boundary

Repositories are owned by each service and persist only that service’s domain model.

Examples:
- User Service: user repository
- Vehicle Service: vehicle, type, and location repositories
- Booking Service: booking repository and status-history repository

This keeps persistence owned by the service that owns the domain.

---

## 11. Use Cases and Commands

### User Service use cases
- RegisterCustomer
- LoginUser
- GetCurrentUser

### Vehicle Service use cases
- CreateVehicle
- UpdateVehicle
- DeactivateVehicle
- CreateVehicleType
- UpdateVehicleType
- ListVehicleTypes
- ListLocations
- CreateLocation

### Booking Service use cases
- CheckAvailability
- CreateBooking
- GetBookingDetails
- GetBookingsForCustomer
- GetBookingsForAdmin
- CancelBooking
- CompleteBooking

---

## 12. Practical Design Constraints

The design intentionally avoids:

- CQRS for simple CRUD and booking flows
- MediatR as an unneeded abstraction layer
- event sourcing for a small learning project
- distributed domain services that are not justified by the current business requirements
- unnecessary application infrastructure beyond repository interfaces and service adapters

---

## 13. Final Validation

This application/domain design is consistent with the approved project documentation because it:

- preserves service ownership boundaries
- keeps the Booking Service as the authority for booking correctness
- separates domain rules from API and infrastructure concerns
- avoids unnecessary patterns and complexity
- keeps transaction scope focused on the booking creation and lifecycle process

Open elements that remain `TBD`:
- exact external client contract between Booking Service and Vehicle Service
- exact idempotency storage pattern
- final permission rules for admin cancellation or booking lifecycle administration
- final validation framework choice if complexity grows beyond native ASP.NET Core validation
