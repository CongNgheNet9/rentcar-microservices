# 16. Security Design

## 1. Purpose and Scope

This document defines the baseline security design for the Vehicle Rental System. It is appropriate for a small learning project and uses the existing User, Vehicle, and Booking Services without introducing an external identity platform or another service.

It builds on the project requirements for token authentication, Customer/Admin role separation, service-owned data, and protection of sensitive information. Decisions that the approved documentation does not determine remain `TBD`.

---

## 2. Security Principles

- Apply least privilege at the gateway and again at each service that handles protected operations.
- Treat the gateway as an entry point, not the sole authorization boundary.
- Keep identity and credential ownership in User Service.
- Keep vehicle and booking data access inside their owning services.
- Use TLS for all network traffic outside explicitly isolated local development.
- Validate all untrusted input on the server.
- Do not expose secrets, credentials, internal errors, or unnecessary personal data.
- Keep security controls proportionate to the learning project; do not introduce an external identity platform without a justified requirement.

---

## 3. Authentication

### 3.1 Responsibility and flow

- User Service owns customer registration, credential verification, account status, and access-token issuance.
- Login accepts credentials over TLS and returns a signed bearer access token after successful verification.
- The frontend sends the token in the `Authorization: Bearer` header for protected calls.
- The API Gateway and each receiving backend service validate the token before processing protected operations.
- User Service remains the source of truth for user identity and role; other services do not read its database.

The token-validation trust configuration must be provisioned to the gateway and services through protected configuration. Token verification must not require every request to call User Service, and a service must not trust an unvalidated identity header supplied by the client.

### 3.2 JWT access-token baseline

JWT is the selected project baseline, consistent with the approved backend technology decisions. Tokens are signed, not encrypted, and therefore must not contain secrets or sensitive personal information.

The issuer should include only claims required for authentication and authorization, such as:

- subject: stable user identifier
- role: `Customer` or `Admin`
- issuer and intended audience
- issued-at and expiry timestamps

Validation must check signature, trusted issuer, expected audience, expiry, and not-before time where present. Invalid, expired, malformed, or wrongly targeted tokens are rejected with 401.

Open token decisions:

- signing algorithm and key distribution/rotation procedure
- access-token lifetime
- clock-skew allowance
- whether refresh tokens are needed; no refresh-token endpoint is currently specified
- revocation behavior after account deactivation or role change before token expiry

Until these are decided, use short-lived access tokens as the recommended direction, keep signing keys outside source control, and do not add a refresh-token flow speculatively.

---

## 4. Authorization and Roles

The initial roles are `Customer` and `Admin`, matching the business rules.

### Customer

- May use customer capabilities only.
- May create bookings only for the authenticated user.
- May view and cancel only their own bookings, subject to booking lifecycle rules.
- Must not directly set booking status to `Confirmed`, `Active`, `Returned`, or `Completed`; lifecycle changes must use explicit operations permitted by the business rules and authorization policy.
- Must not assign themselves the Admin role.

### Admin

- May perform approved vehicle, vehicle-type, location, and booking-management operations.
- Must still obey booking overlap rules and valid lifecycle transitions.
- Must not directly access or modify another service's database.
- Exact permission granularity within the Admin role remains `TBD`.

Authorization must be enforced by the service that owns the action and resource, even if the Gateway performs an initial check. Booking Service checks both role and booking ownership for customer booking operations. Vehicle Service checks Admin authority for fleet-management operations. A role claim is not a substitute for resource-level authorization.

### Role assignment

- Public self-registration creates a Customer account only; any client-supplied role value is ignored or rejected.
- Admin role assignment is an administrative provisioning operation, not a customer-facing registration capability.
- The exact initial Admin provisioning procedure is `TBD`.
- Normal user-facing operations must not permit a user to change their own role.

---

## 5. Password and Credential Handling

- Accept passwords only over TLS.
- Store only a salted, adaptive password hash; never store plaintext passwords or reversibly encrypted passwords.
- Use a maintained password-hashing implementation with a work factor/configuration appropriate to the selected platform. The exact implementation and parameters are `TBD`.
- Compare credentials through the password-hashing implementation; do not implement custom cryptographic hashing.
- Never return password or password-hash fields from any API.
- Never log passwords, password hashes, login request bodies, or authentication headers.
- Do not reveal whether a login failed because the account does not exist, the password is wrong, or the account is inactive; use a generic invalid-credentials response.
- Password complexity, length, reuse, reset, lockout, and recovery policies remain `TBD` because the business requirements do not define them.

---

## 6. Service and Data Boundaries

### User Service

- Owns user records, credentials, account status, roles, and token issuance.
- Does not own vehicle or booking data.

### Vehicle Service

- Owns vehicle, vehicle-type, and location records.
- Does not own user credentials or booking lifecycle records.

### Booking Service

- Owns booking data, booking authorization checks, lifecycle, and overlap correctness.
- Stores user, vehicle, and location identifiers as logical references only.
- Does not access the User or Vehicle databases directly.

### Gateway and service trust

- The Gateway routes requests and may perform edge authentication checks.
- Backend services independently validate caller identity and enforce authorization for their own operations.
- Service-to-service calls use an explicit trusted mechanism and least-privilege identity; exact service credentials and token exchange are `TBD`.
- Do not trust caller identity, role, or ownership values copied from arbitrary client-supplied headers.

---

## 7. Input Validation and Common API Security

Every service treats request data, path values, query parameters, and headers as untrusted:

- Validate required values, type, length, format, range, enum membership, and allowed state transitions server-side.
- Enforce rental-time invariants and overlap rules in Booking Service even if the frontend has equivalent checks.
- Use parameterized database access/ORM parameter binding; never concatenate untrusted input into SQL.
- Do not rely on client-provided IDs, roles, owner IDs, price values, status values, or authorization decisions without server-side validation.
- Bound request body size and collection/page sizes.
- Use allow-listed CORS origins for deployed environments; do not combine wildcard origins with credentials.
- Apply reasonable rate limits to registration and login endpoints to reduce automated abuse. Exact thresholds are `TBD` and should be selected for the deployment environment.
- Return generic authentication errors and avoid resource-existence leaks where feasible.
- Keep error responses free of stack traces, database details, secret values, and sensitive downstream responses.
- Protect API documentation/diagnostic endpoints according to deployment needs; do not expose development-only diagnostics publicly.

Because the defined API uses bearer tokens in the Authorization header, the baseline does not use cookie authentication. If the frontend later stores authentication in cookies, CSRF protection and cookie flags must be designed before enabling that flow. Browser token-storage strategy is `TBD`; avoid assuming that local storage is safe from script compromise.

---

## 8. Sensitive Data and Secret Management

Sensitive data includes passwords, password hashes, access tokens, signing keys, database credentials, and personal user data.

- Keep signing keys, database credentials, and service credentials out of source control and ordinary application logs.
- Use local development secret storage for developer environments and an appropriate protected secret store/configuration mechanism for deployed environments.
- Restrict access to secrets to the processes and operators that require them.
- Rotate compromised credentials and signing keys; exact routine rotation and incident procedures are `TBD`.
- Transmit credentials and tokens only over TLS.
- Return only fields required for the use case; never expose internal credential or secret fields.
- Protect logs and diagnostic data with access controls and retention appropriate to their contents.
- Do not put secrets or sensitive personal data in JWT claims, URLs, trace baggage, or idempotency keys.

---

## 9. Transport and Deployment Baseline

- Require HTTPS/TLS for deployed client-to-gateway and service-to-service traffic.
- Local development may use a controlled local-only setup; it must not be treated as the deployed security configuration.
- Do not expose service/database ports publicly when they are intended for internal use.
- Keep SQL Server accessible only to its owning service and authorized local/deployment operators.
- Configure allowed hosts and CORS explicitly for deployed environments.
- Keep framework and runtime dependencies on supported versions and apply security updates as part of maintenance.

Specific TLS versions, certificate provisioning, network rules, and deployment secret-store choice are environment decisions and remain `TBD`.

---

## 10. Security Failure Behavior

- Missing or invalid authentication credentials return 401.
- Authenticated callers lacking permission return 403.
- Invalid input is rejected with the documented validation response and does not cause partial writes.
- Booking conflicts remain 409; authorization or dependency errors must not bypass booking correctness checks.
- Unexpected failures return a generic server error and a trace identifier; details are retained only in protected server logs.
- If a required dependency is unavailable, fail closed for operations that require its data. Do not create bookings using assumed identity, vehicle existence, or authorization.

---

## 11. Security Verification

At minimum, tests and review should verify:

- unauthenticated requests cannot access protected operations
- invalid, expired, wrong-issuer, or wrong-audience tokens are rejected
- Customer cannot invoke Admin operations or access another customer's booking
- Admin authorization does not bypass booking invariants or valid state transitions
- self-registration cannot grant Admin
- password values and token material are never returned or logged
- input is validated server-side and database access is parameterized
- service/database boundaries are respected
- dependency failures fail closed instead of producing a success-shaped result
- error responses do not expose stack traces, SQL details, or secrets

---

## 12. Open Security Decisions

- Password policy and password-hashing implementation/configuration.
- JWT signing algorithm, key lifecycle, token lifetime, clock skew, revocation, and any future refresh-token policy.
- Admin provisioning and detailed Admin permission matrix.
- Frontend token storage and any cookie/CSRF design if cookies are later selected.
- Exact rate limits, CORS origins, TLS/deployment configuration, secret store, and operational retention.
- Whether to conceal booking existence with 404 instead of the API design's current 403 for non-owner access.
