# 09. Error Handling and Validation

## 1. Purpose

This document defines consistent error handling and validation expectations for the User, Vehicle, and Booking Services. It builds on the API design and keeps error reporting explicit without exposing internal implementation details.

The design uses the existing ASP.NET Core platform and logging direction. It does not require a new service or a validation library.

---

## 2. Error Handling Principles

- Return an error response when an operation fails; never return success-shaped data as a fallback.
- Use the same error response structure across services.
- Distinguish malformed input, business-rule rejection, missing resources, authentication failure, authorization failure, concurrency conflict, dependency failure, and unexpected failure.
- Do not expose exception messages, stack traces, SQL details, secrets, or other internal diagnostics to API clients.
- Log unexpected failures with a correlation/trace identifier and enough safe context for investigation.
- Keep Booking Service as the authority for booking errors, lifecycle validity, and overlap conflicts.

---

## 3. Error Response Structure

Use a consistent JSON error object, based on the ASP.NET Core Problem Details convention:

```json
{
  "type": "about:blank",
  "title": "Booking conflict",
  "status": 409,
  "detail": "The vehicle is not available for the requested period.",
  "instance": "/bookings",
  "code": "booking.vehicle_unavailable",
  "traceId": "request-correlation-id",
  "errors": {
    "pickupUtc": ["The rental period is invalid."]
  }
}
```

Fields:

- `type`: problem type URI or `about:blank`.
- `title`: short, stable summary.
- `status`: HTTP status code.
- `detail`: safe, client-appropriate explanation.
- `instance`: request path, without sensitive query values.
- `code`: stable application error code suitable for client handling.
- `traceId`: correlation identifier for support and log lookup.
- `errors`: optional field-to-message map for request validation errors.

`errors` is omitted when there are no field-level validation messages. The exact serialization and whether the standard Problem Details media type is used are implementation details; the response semantics and stable error codes should remain consistent.

---

## 4. Error Categories and HTTP Behavior

| Category | HTTP status | Example stable codes | Behavior |
|---|---:|---|---|
| Malformed request | 400 Bad Request | `request.malformed`, `request.invalid_format` | Request cannot be parsed or has invalid field representation. |
| Request/domain validation | 422 Unprocessable Entity | `validation.failed`, `booking.invalid_period` | Request parses, but fields or domain invariants are invalid. |
| Not found | 404 Not Found | `resource.not_found`, `booking.not_found` | Requested resource does not exist or is not available in the caller's permitted scope. |
| Unauthorized | 401 Unauthorized | `auth.required`, `auth.invalid_token`, `auth.invalid_credentials` | Authentication is missing or invalid. |
| Forbidden | 403 Forbidden | `auth.forbidden`, `booking.not_owner` | Caller is authenticated but lacks permission for the operation. |
| Conflict | 409 Conflict | `booking.vehicle_unavailable`, `booking.invalid_transition`, `request.idempotency_conflict`, `concurrency.conflict` | Current state or a concurrent operation prevents the request. |
| Dependency unavailable | 503 Service Unavailable | `dependency.unavailable` | A required service or data store is unavailable; do not report a successful business result. |
| Dependency timeout | 504 Gateway Timeout | `dependency.timeout` | A required downstream operation exceeded its timeout. |
| Unexpected server failure | 500 Internal Server Error | `internal.error` | Unhandled or otherwise unexpected failure; return generic detail only. |

The API design already lists 400 and 422. Use 400 for malformed/unparseable requests and 422 for well-formed requests that fail semantic or domain validation. A booking overlap or stale state is a conflict (409), not a validation success or an unavailable-service fallback.

An empty search result is a successful response with an empty collection, not a 404.

---

## 5. Validation Responsibilities

Validation is applied in layers, with no layer treated as a replacement for another:

### Presentation/API layer

- Validate required fields, types, lengths, formats, enum representations, and request size.
- Reject malformed JSON and invalid representations as 400.
- Do not accept client-supplied identity or role as authoritative.
- Map validation failures to the common error structure.

### Application layer

- Validate use-case preconditions and cross-entity conditions using the service's permitted integration boundaries.
- Enforce authorization for the specific operation and resource.
- Convert known domain outcomes to stable application error codes.

### Domain layer

- Enforce invariants regardless of the caller or transport.
- Booking examples: `ReturnUtc > PickupUtc`, valid lifecycle transition, and no conflicting booking for the same vehicle and interval.
- Vehicle and booking status changes must follow the business rules.

### Persistence layer

- Retain database constraints as a final integrity safeguard.
- Translate known constraint/concurrency outcomes into a safe conflict or validation response.
- Do not expose raw SQL Server or ORM exception details.

---

## 6. Domain and Resource Error Rules

### Not found

- Return 404 when a requested vehicle, booking, location, or other owned resource does not exist.
- For customer booking access, retain the current API design's 403 behavior when the booking exists but belongs to another customer. Do not include another customer's identifying details.
- Whether to use 404 instead to prevent resource enumeration is a security-policy decision and remains `TBD`; changing the documented API behavior requires an explicit API-design update.

### Unauthorized and forbidden

- Return 401 for missing, invalid, expired, or otherwise unacceptable authentication credentials.
- Return 403 when the caller is authenticated but lacks the required role, ownership, or operation permission.
- Do not treat an authorization failure as a not-found or successful empty result unless an explicit policy is adopted.

### Conflict

Return 409 for a request that is valid in isolation but conflicts with current domain state, including:

- an overlapping booking
- a prohibited booking state transition
- a stale `rowversion` on a state update
- reuse of an idempotency key with a different request payload

For a repeated idempotency key with the same request after a successful booking, return the stored successful outcome rather than creating a second booking. A rejected conflict attempt does not consume the key.

---

## 7. Unexpected Errors and Service Failures

- A service must not catch an unexpected exception and return an empty collection, default object, or success response.
- At the API boundary, unexpected failures return a generic 500 response with `internal.error` and a trace identifier.
- Downstream service failures must be reported as dependency errors (503 or 504 as appropriate); they must not be converted into “vehicle not found,” “available,” or another business outcome.
- If Booking Service cannot validate required vehicle metadata because Vehicle Service is unavailable, it must not create the booking based on an assumed valid vehicle.
- Failed or interrupted booking transactions must roll back. The client can safely retry a booking creation only with the same idempotency key as defined in the concurrency design.
- Do not retry non-transient validation, authorization, not-found, or booking-conflict results.

---

## 8. Logging Responsibility

Each service is responsible for logging failures within its own process and ownership boundary:

- API boundary: request validation failures, authentication/authorization failures, and unhandled exceptions.
- Application/domain boundary: important business rejections and concurrency conflicts when operationally useful.
- Infrastructure boundary: database and downstream dependency failures, with exception details retained only in protected logs.

Logs should include, where available:

- timestamp and severity
- service and operation name
- trace/correlation identifier
- stable error code
- HTTP status
- safe resource identifiers (for example, a booking ID)
- exception details for server-side unexpected failures

Do not log passwords, password hashes, access/refresh tokens, signing keys, authorization headers, or full sensitive request bodies. Avoid logging personal or payment data; the system currently excludes payment processing. Authentication failures should be logged without revealing whether a specific email address exists.

Framework-native ASP.NET Core logging is the initial choice. Additional logging/telemetry infrastructure remains deferred unless justified by the project phase.

---

## 9. Validation Scenarios

At minimum, tests should verify:

- malformed request and invalid field formats return 400 with the common error shape
- invalid rental period returns 422 and creates no booking
- missing/invalid credentials return 401
- authenticated role or ownership violations return 403
- nonexistent resources return 404
- overlapping booking and invalid transition return 409
- stale rowversion updates return a conflict and do not overwrite newer state
- downstream failure is surfaced as 503/504 rather than as a successful or business-negative result
- unexpected exceptions return generic 500 responses without internal details
- validation and error logs contain trace IDs but no credentials or tokens

---

## 10. Open Decisions

- Whether unauthorized access to another customer's booking should remain 403 or use 404 to reduce resource enumeration.
- Exact stable error-code catalog and final Problem Details serialization.
- Exact log retention, access controls, and privacy/retention requirements.
- Exact retry/backoff limits for transient dependency or database failures; retries must remain bounded and must preserve booking idempotency.
