# 02. Backend Tech Stack

## 1. Purpose

This document records the approved backend technology stack for the current project phase.

The stack is intentionally narrow and aligned to the architecture and business problem. It does not include technologies that are not justified by the current requirements.

---

## 2. Approved Stack

| Area | Technology | Decision | Status |
|---|---|---|---|
| Runtime | .NET | Project baseline runtime | TBD |
| Backend framework | ASP.NET Core | Required | REQUIRED_NOW |
| API layer | ASP.NET Core Web API | Required | REQUIRED_NOW |
| Dependency injection | Built into ASP.NET Core | Required | REQUIRED_NOW |
| Data access | EF Core | Required | REQUIRED_NOW |
| Database | SQL Server | Required | REQUIRED_NOW |
| Identity/Auth | JWT-based authentication + ASP.NET Core auth | Required | REQUIRED_NOW |
| Reverse proxy | YARP | Approved for later use if gateway is needed | REQUIRED_LATER |
| Caching | Redis | Deferred until measured need exists | REQUIRED_LATER |
| Eventing | Kafka | Deferred until async integration is needed | REQUIRED_LATER |
| Logging | ASP.NET Core logging and structured logging | Required | REQUIRED_NOW |
| Observability | OpenTelemetry | Deferred until runtime observability is required | REQUIRED_LATER |
| Testing | xUnit | Required | REQUIRED_NOW |
| Validation | ASP.NET Core validation | Preferred first choice | REQUIRED_NOW |
| Additional validation library | FluentValidation | Only if complexity exceeds native validation | TBD |

---

## 3. Why These Technologies Are Approved

### ASP.NET Core
Problem:
- The project requires a modern backend API platform that supports REST services, DI, validation, auth, and integration with SQL Server and EF Core.

Requirement:
- Project overview and architecture call for C#, ASP.NET Core, and RESTful backend services.

Decision:
- ASP.NET Core is the default backend platform.

Status:
- REQUIRED_NOW

### .NET runtime
Problem:
- The selected backend framework requires a supported .NET runtime.

Requirement:
- The backend must support multiple services efficiently and in line with the project’s learning scope.

Decision:
- Use a project-appropriate .NET version, but do not finalize an arbitrary version without a project-wide compatibility decision.

Status:
- TBD

### EF Core
Problem:
- The project requires durable data access for the service-owned databases with a modern ORM approach that supports the learning goals.

Requirement:
- The architecture requires data access, SQL Server support, and domain ownership through services.

Decision:
- EF Core is the appropriate default ORM for the current project.

Status:
- REQUIRED_NOW

### SQL Server
Problem:
- The project requires a relational database for each service-owned database and a realistic learning environment.

Requirement:
- The project explicitly requires SQL Server and database-per-service architecture.

Decision:
- SQL Server remains the approved database platform for the initial architecture.

Status:
- REQUIRED_NOW

### JWT authentication
Problem:
- The project requires authenticated access to customer and admin features.

Requirement:
- Authentication and role-based authorization are required by the project overview and requirements.

Decision:
- Use token-based authentication with a JWT-style pattern as the baseline approach, without locking in a vendor-specific implementation detail.

Status:
- REQUIRED_NOW

### YARP
Problem:
- The project needs a gateway pattern for front-end traffic, but the system is still small and not yet reliant on a full API-gateway deployment model.

Requirement:
- The architecture includes a gateway, but the requirement is not yet mandatory for the MVP phase.

Decision:
- YARP is a valid later-stage choice if the project adopts a real gateway-facing deployment model.

Status:
- REQUIRED_LATER

### Redis
Problem:
- The project may later benefit from reduced repeated read queries for inventory or directory data.

Requirement:
- Redis is not currently required by the baseline architecture.

Decision:
- Use Redis only if a measured caching problem justifies it.

Status:
- REQUIRED_LATER

### Kafka
Problem:
- The project may eventually need asynchronous integration or event propagation between services.

Requirement:
- Kafka is not required for the current MVP correctness phase.

Decision:
- Do not introduce Kafka until the synchronous version is stable and a real integration need exists.

Status:
- REQUIRED_LATER

### Serilog / structured logging
Problem:
- The project needs actionable operational logs for backend services and eventual observability.

Requirement:
- Project overview requires logging and observability as the system matures.

Decision:
- Use framework-native logging first; adopt structured logging when it provides clear value.

Status:
- REQUIRED_NOW

### OpenTelemetry
Problem:
- The project may eventually require metrics, tracing, and cross-service observability.

Requirement:
- Observability is a later learning goal, not a current architecture requirement.

Decision:
- Defer OpenTelemetry until the system has matured enough to justify it.

Status:
- REQUIRED_LATER

### xUnit
Problem:
- The project requires automated testing and concurrency verification for booking logic.

Requirement:
- Test strategy calls for unit and integration testing, especially booking overlap and concurrency scenarios.

Decision:
- xUnit is the project-approved test framework.

Status:
- REQUIRED_NOW

### FluentValidation
Problem:
- Complex validation may eventually become more readable than raw data annotations.

Requirement:
- Validation is required, but the current project scope does not yet justify a validation framework beyond native ASP.NET capabilities.

Decision:
- Start with native ASP.NET Core validation and only use FluentValidation when the project’s validation needs exceed the native model.

Status:
- TBD

---

## 4. Status Summary

| Technology | Decision | Install in current phase? |
|---|---|---|
| ASP.NET Core | Selected | Yes, when implementation begins |
| .NET runtime | TBD | No |
| EF Core | Selected | Yes, when implementation begins |
| SQL Server | Selected | Yes, when implementation begins |
| JWT auth | Selected | Yes, when implementation begins |
| YARP | Deferred | No |
| Redis | Deferred | No |
| Kafka | Deferred | No |
| Serilog / structured logging | Selected as needed | Yes, when justified |
| OpenTelemetry | Deferred | No |
| xUnit | Selected | Yes, when implementation begins |
| FluentValidation | TBD | No |

---

## 5. Final Decision Summary

The project does not need a large technology stack to begin.

The core stack should remain:

- ASP.NET Core
- EF Core
- SQL Server
- JWT-based auth
- xUnit
- native ASP.NET validation and structured logging as required

Advanced infrastructure such as Redis, Kafka, YARP, and OpenTelemetry must be evaluated later when the architecture reaches the corresponding learning phase and a justified requirement exists.
