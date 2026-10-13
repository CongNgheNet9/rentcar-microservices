# 02. System Sequence Diagrams

## 1. Purpose

This document provides the main sequence diagrams for the system at the architecture level.

These diagrams are intentionally high-level and do not define concrete HTTP contracts, DTO shapes, or implementation details.

---

## 2. Customer Booking Sequence (Normal Flow)

```mermaid
sequenceDiagram
    participant C as Customer
    participant FE as Frontend
    participant GW as API Gateway
    participant B as Booking Service
    participant V as Vehicle Service
    participant DB as Booking DB

    C->>FE: Select vehicle and rental period
    FE->>GW: POST booking request
    GW->>B: Route request
    B->>V: Validate vehicle existence / lifecycle info
    V-->>B: Vehicle metadata
    B->>DB: Check overlapping bookings
    alt Vehicle available
        B->>DB: Store booking
        B-->>GW: Booking created
        GW-->>FE: Success response
        FE-->>C: Booking confirmation
    else Vehicle unavailable
        B-->>GW: Rejection reason
        GW-->>FE: Error response
        FE-->>C: Show validation/error message
    end
```

---

## 3. Concurrent Booking Attempt Sequence

```mermaid
sequenceDiagram
    participant C1 as Customer A
    participant C2 as Customer B
    participant FE1 as Frontend A
    participant FE2 as Frontend B
    participant GW as API Gateway
    participant B as Booking Service
    participant DB as Booking DB

    C1->>FE1: Submit booking request
    C2->>FE2: Submit booking request
    FE1->>GW: Request A
    FE2->>GW: Request B
    GW->>B: Route A
    GW->>B: Route B
    B->>DB: Acquire validation context for A
    B->>DB: Acquire validation context for B
    alt A validated first
        B->>DB: Create booking A
        B-->>GW: Success A
        GW-->>FE1: Created
        B-->>GW: Reject B due to overlap
        GW-->>FE2: Validation error
    else B validated first
        B->>DB: Create booking B
        B-->>GW: Success B
        GW-->>FE2: Created
        B-->>GW: Reject A due to overlap
        GW-->>FE1: Validation error
    end
```

The architecture requires the system to reject one request in the overlap case, but the exact concurrency mechanism remains `TBD`.

---

## 4. Invalid Booking Sequence

```mermaid
sequenceDiagram
    participant C as Customer
    participant FE as Frontend
    participant GW as API Gateway
    participant B as Booking Service

    C->>FE: Choose pickup > return
    FE->>GW: Submit booking request
    GW->>B: Route request
    B->>B: Validate rental period
    alt Return <= Pickup
        B-->>GW: Reject invalid booking
        GW-->>FE: Validation error
        FE-->>C: Request correction
    else Valid period
        B->>B: Continue validation
    end
```

---

## 5. Booking Cancellation Sequence

```mermaid
sequenceDiagram
    participant C as Customer
    participant FE as Frontend
    participant GW as API Gateway
    participant B as Booking Service
    participant DB as Booking DB

    C->>FE: Choose booking to cancel
    FE->>GW: Cancel request
    GW->>B: Route request
    B->>DB: Load booking
    B->>B: Validate cancellation eligibility
    alt Eligible for cancellation
        B->>DB: Update status to Cancelled and cancel timestamp
        B-->>GW: Cancellation confirmed
        GW-->>FE: Success response
    else Ineligible
        B-->>GW: Rejection reason
        GW-->>FE: Error response
    end
```

---

## 6. Idempotent Retry Sequence

```mermaid
sequenceDiagram
    participant CL as Client
    participant FE as Frontend
    participant GW as API Gateway
    participant B as Booking Service
    participant DB as Booking DB

    CL->>FE: Retry same booking request
    FE->>GW: POST booking with Idempotency-Key
    GW->>B: Route request
    B->>DB: Check idempotency record
    alt Same request already processed
        B-->>GW: Return previous result
        GW-->>FE: Same confirmation/error result
        FE-->>CL: Stable result
    else New request
        B->>DB: Create booking
        B->>DB: Save idempotency record
        B-->>GW: Booking created
        GW-->>FE: Success response
    end
```

The precise idempotency key handling strategy remains `TBD`.

---

## 7. Admin Booking Management Sequence

```mermaid
sequenceDiagram
    participant A as Administrator
    participant FE as Frontend
    participant GW as API Gateway
    participant B as Booking Service
    participant DB as Booking DB

    A->>FE: View/manage bookings
    FE->>GW: Booking management request
    GW->>B: Route request
    B->>DB: Load booking records
    B->>B: Validate allowed lifecycle operation
    alt Valid transition
        B->>DB: Update booking state
        B-->>GW: Success
    else Invalid transition
        B-->>GW: Rejected operation
    end
    GW-->>FE: Response
    FE-->>A: Updated booking state
```

---

## 8. Cross-Service View

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant GW as API Gateway
    participant US as User Service
    participant VS as Vehicle Service
    participant BS as Booking Service

    FE->>GW: Request protected action
    GW->>US: Validate user identity/role
    US-->>GW: Token validation result
    GW->>BS: Route business request
    BS->>VS: Request vehicle metadata if needed
    VS-->>BS: Metadata response
    BS-->>GW: Booking result
    GW-->>FE: User-facing response
```

This reflects the controlled, explicit integration pattern required by the project.
