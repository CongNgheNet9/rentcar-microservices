# 03. Backend Library Evaluation

## 1. Purpose

This document evaluates the major backend technologies and libraries relevant to the current project scope.

Each evaluation ties the technology choice back to an architectural need or project requirement. The decision is made only at the level of selection and approval, without installing packages or changing source code.

---

## 2. Evaluation Summary

| Technology | Decision | Status | Install Now |
|---|---|---|---|
| ASP.NET Core | Selected | REQUIRED_NOW | No |
| .NET runtime | TBD | TBD | No |
| EF Core | Selected | REQUIRED_NOW | No |
| SQL Server | Selected | REQUIRED_NOW | N/A |
| ASP.NET Core auth / JWT | Selected | REQUIRED_NOW | No |
| YARP | Deferred | REQUIRED_LATER | No |
| Redis | Deferred | REQUIRED_LATER | No |
| Kafka | Deferred | REQUIRED_LATER | No |
| Serilog / structured logging | Selected as needed | REQUIRED_NOW | No |
| OpenTelemetry | Deferred | REQUIRED_LATER | No |
| xUnit | Selected | REQUIRED_NOW | No |
| FluentValidation | Deferred / TBD | TBD | No |

---

## 3. ASP.NET Core

### Problem
The platform needs a backend server framework that can expose REST endpoints, support dependency injection, validation, authentication, and service composition.

### Requirement
The project overview explicitly requires ASP.NET Core and a C# backend.

### Candidates
- ASP.NET Core
- Other .NET-hosted backends
- custom service host approaches

### Comparison
| Criteria | ASP.NET Core | Other options |
|---|---|---|
| Fit for project | High | Low to medium |
| Native DI | Yes | Variable |
| API support | Yes | Variable |
| Security model | Strong | Variable |
| Learning fit | High | Medium |

### Recommended Choice
ASP.NET Core

### Reason
It directly matches the project’s stated stack and architecture requirements, and provides the native building blocks required for the current backend design.

### Trade-offs
- Requires .NET familiarity and application design discipline
- Can be over-featured if used without a clear reason

### Status
REQUIRED_NOW

### Native Alternative
The framework itself is the native platform choice; no additional library is needed for the baseline web server.

### Installation Decision
Do not install framework packages during Step 4; this is only a design decision.

---

## 4. .NET Runtime

### Problem
The application must run on a supported .NET runtime.

### Requirement
The project requires .NET as part of the stack, but the specific version has not yet been finalized.

### Candidates
- .NET 8
- .NET 9 or another supported project baseline
- project-specific approved version

### Comparison
| Criteria | Candidate A | Candidate B |
|---|---|---|
| Project fit | TBD | TBD |
| Support status | Depends on release | Depends on release |
| Compatibility with EF Core | Must align | Must align |

### Recommended Choice
Project-approved .NET version based on the active implementation baseline.

### Reason
The project definition does not specify the version, so the decision should be made only when the implementation baseline is chosen.

### Trade-offs
- Version drift can create compatibility issues with EF Core or tooling.
- Deciding too early may lock in an unsupported runtime.

### Status
TBD

### Native Alternative
No native alternative exists; the runtime is a platform decision.

### Installation Decision
No installation is approved during this step.

---

## 5. EF Core

### Problem
The services need a data access layer that supports relational persistence, transactions, and database ownership boundaries without directly violating service boundaries.

### Requirement
The project requires SQL Server and database-per-service architecture.

### Candidates
- EF Core
- ADO.NET/manual SQL
- another ORM

### Comparison
| Criteria | EF Core | ADO.NET | Other ORM |
|---|---|---|---|
| Project fit | High | Medium | Variable |
| Productivity | High | Medium | Variable |
| Transaction support | Strong | Strong | Variable |
| Learning value | High | Medium | Variable |

### Recommended Choice
EF Core

### Reason
It fits the stated C# / ASP.NET Core / SQL Server architecture and supports clean service-level persistence without requiring additional abstraction layers.

### Trade-offs
- Requires disciplined model and migration management
- Can hide query complexity without careful design

### Status
REQUIRED_NOW

### Native Alternative
The .NET platform supports ADO.NET natively, but EF Core is a stronger fit for the project’s learning goals and architecture.

### Installation Decision
Approved for later implementation; not installed during this step.

---

## 6. SQL Server

### Problem
The project requires a relational database for each service and wants realistic database engineering practice.

### Requirement
The project overview and architecture explicitly require SQL Server.

### Candidates
- SQL Server
- PostgreSQL
- MySQL

### Comparison
| Criteria | SQL Server | PostgreSQL | MySQL |
|---|---|---|---|
| Requirement fit | Exact match | Good but not defined | Not preferred |
| Enterprise learning value | High | Medium | Medium |
| EF support | Strong | Strong | Strong |
| Project alignment | High | Medium | Low |

### Recommended Choice
SQL Server

### Reason
This is a direct requirement of the project definition and the document set.

### Trade-offs
- More Windows-centric assumptions in some local environments
- Increased setup complexity compared to embedded or lightweight databases

### Status
REQUIRED_NOW

### Native Alternative
No alternative is required; SQL Server is already the approved database platform.

### Installation Decision
Not installed during Step 4; implementation work must happen later.

---

## 7. JWT Authentication

### Problem
The project needs a standard way for customers and administrators to authenticate and access protected resources.

### Requirement
Authentication and authorization are required by the project overview, requirements, and business rules.

### Candidates
- JWT-based token authentication
- server session cookies
- custom token system

### Comparison
| Criteria | JWT | Sessions | Custom token |
|---|---|---|---|
| Project fit | High | Medium | Low |
| API friendliness | High | Medium | Low |
| Scalability | High | Medium | Low |
| Complexity | Medium | Medium | High |

### Recommended Choice
JWT-based authentication pattern

### Reason
The project explicitly calls for token-based authentication, and JWT is a natural fit for the service-oriented architecture and API gateway model.

### Trade-offs
- Requires secure token validation and claims handling
- Needs careful authorization design for customer/admin boundaries

### Status
REQUIRED_NOW

### Native Alternative
ASP.NET Core authentication infrastructure provides native support for token-based schemes; no separate package is required by default.

### Installation Decision
Approved for later implementation; no package installation in Step 4.

---

## 8. YARP

### Problem
The system may need a reverse proxy or gateway to centralize external routing, authentication edge checks, and service entry points.

### Requirement
The project overview lists YARP as a possible API gateway technology, but the project scope still permits a small synchronous architecture prior to gateway-specific optimization.

### Candidates
- YARP
- API gateway built as custom routing layer
- no gateway in the initial phase

### Comparison
| Criteria | YARP | Custom gateway | No gateway |
|---|---|---|---|
| Fit for project | High | Medium | High for very small scope |
| Complexity | Medium | High | Low |
| Need now | Not yet required | Not required | Adequate right now |

### Recommended Choice
YARP is a valid future choice, but not a required architecture dependency for the current phase.

### Reason
The current architecture is intentionally small and service boundary-driven. A gateway is useful, but not mandatory for the earliest correct implementation.

### Trade-offs
- Additional deployment and routing complexity
- More operational concerns than a direct frontend-to-service design

### Status
REQUIRED_LATER

### Native Alternative
No direct native alternative is required because the architecture can function without a gateway as long as routing remains simple.

### Installation Decision
Do not install YARP during this step.

---

## 9. Redis

### Problem
The project may need to reduce repeated reads for frequently requested vehicle, type, or location data.

### Requirement
The project overview mentions Redis as a future optimization topic, but there is no current requirement showing that caching is required for correctness.

### Candidates
- Redis
- in-memory cache
- application-level read-model cache

### Comparison
| Criteria | Redis | In-memory cache | Application cache |
|---|---|---|---|
| Shared distributed cache | Yes | No | No |
| Fit for async learning | High | Low | Medium |
| Operational cost | Medium | Low | Low |
| Required for current correctness | No | No | No |

### Recommended Choice
Redis is a future optimization, not a current requirement.

### Reason
The existing requirements and architecture do not state a measured need for distributed caching. The system must keep booking correctness in the database, and Redis must not become the source of truth.

### Trade-offs
- Extra infrastructure and operational overhead
- Additional cache invalidation complexity

### Status
REQUIRED_LATER

### Native Alternative
In-memory caching is available natively in the application and may be used if a local optimization is justified later.

### Installation Decision
Do not install Redis or Redis client packages during Step 4.

---

## 10. Kafka

### Problem
The system may eventually need asynchronous integration between services or event-driven flows.

### Requirement
The project overview lists Kafka and event-driven architecture as later-stage learning topics, but not as a current requirement for the initial implementation.

### Candidates
- Kafka
- no async broker in this phase
- other message broker alternatives

### Comparison
| Criteria | Kafka | No broker yet | Alternative broker |
|---|---|---|---|
| Fit for current architecture | Medium | High | Medium |
| Operational complexity | High | Low | High |
| Need for initial MVP | No | Yes | No |
| Learning value | High later | High now | Medium |

### Recommended Choice
Kafka is intentionally deferred.

### Reason
The project explicitly states that Kafka should be introduced after the synchronous version is stable and only when a real integration problem exists.

### Trade-offs
- Operational complexity
- Outbox and idempotency design complexity
- Need for consumer and dead-letter handling

### Status
REQUIRED_LATER

### Native Alternative
No broker is the simplest and correct choice for the current phase.

### Installation Decision
Do not introduce Kafka or any broker client during Step 4.

---

## 11. Serilog / Structured Logging

### Problem
The application needs clear operational visibility and a structured logging story to support later debugging and observability.

### Requirement
The project overview includes logging and observability goals.

### Candidates
- ASP.NET Core logging
- Serilog
- custom logger abstraction

### Comparison
| Criteria | ASP.NET Core logging | Serilog | Custom abstraction |
|---|---|---|---|
| Baseline fit | High | High | Low |
| Structured logging | Limited | Strong | Variable |
| Operational complexity | Low | Medium | High |

### Recommended Choice
Use the framework-native logging model first; adopt structured logging if needed.

### Reason
The project does not require a logging framework immediately, and the platform can handle basic logging affordably without over-engineering.

### Trade-offs
- Native logging is simpler but less rich than a dedicated structured logging pipeline
- Serilog adds additional configuration and operational complexity

### Status
REQUIRED_NOW

### Native Alternative
Framework-native logging is already sufficient for the initial phase.

### Installation Decision
A logging library is not automatically required; the decision should be finalized later based on actual operational needs.

---

## 12. OpenTelemetry

### Problem
The project may later need metrics and tracing across the API gateway, services, and infrastructure.

### Requirement
Observability is a project learning goal, but it is not required for the initial architecture phase.

### Candidates
- OpenTelemetry
- ad hoc logs only
- no observability instrumentation

### Comparison
| Criteria | OpenTelemetry | Logs only | No instrumentation |
|---|---|---|---|
| Observability depth | High | Medium | Low |
| Current need | Not yet | Sufficient now | Too little |
| Cost | Medium | Low | Low |

### Recommended Choice
OpenTelemetry is deferred.

### Reason
The system is still focused on correctness and service boundaries, not runtime observability complexity.

### Trade-offs
- Additional instrumentation and collection setup
- More operational cost than the project currently justifies

### Status
REQUIRED_LATER

### Native Alternative
No explicit native alternative is required in this phase.

### Installation Decision
Do not install or configure OpenTelemetry during Step 4.

---

## 13. xUnit

### Problem
The system needs a standard automated test framework for backend logic, with emphasis on booking correctness and concurrency.

### Requirement
The project overview explicitly lists xUnit in the testing strategy.

### Candidates
- xUnit
- NUnit
- MSTest

### Comparison
| Criteria | xUnit | NUnit | MSTest |
|---|---|---|---|
| Project fit | High | Medium | Medium |
| .NET learning fit | High | Medium | Medium |
| Team/project alignment | Good | Good | Good |

### Recommended Choice
xUnit

### Reason
It is explicitly called out in the project definition and is a suitable choice for .NET service testing.

### Trade-offs
- Requires disciplined test organization and setup
- Additional test infrastructure is still a later implementation task

### Status
REQUIRED_NOW

### Native Alternative
No native framework alternative is necessary; xUnit is already the designated testing choice in the project definition.

### Installation Decision
Approved later for implementation; not installed during Step 4.

---

## 14. FluentValidation

### Problem
The project may eventually require more expressive validation than plain model validation attributes.

### Requirement
Validation is required, but no requirement states that a separate validation library is mandatory in the current architecture stage.

### Candidates
- ASP.NET Core validation
- FluentValidation
- a custom validation layer

### Comparison
| Criteria | ASP.NET Core validation | FluentValidation | Custom validation |
|---|---|---|---|
| Fit now | High | Medium | Low |
| Complexity | Low | Medium | High |
| Need for current project | Sufficient | Not yet required | Not justified |

### Recommended Choice
Use native ASP.NET Core validation by default.

### Reason
The project architecture does not yet justify a separate validation library. Prefer the simplest solution that meets the requirement.

### Trade-offs
- Native validation is less expressive for complex rules
- FluentValidation may reduce duplication in larger systems, but is not required yet

### Status
TBD

### Native Alternative
The framework already provides built-in validation capability.

### Installation Decision
Do not install FluentValidation or any validation package during Step 4.

---

## 15. Final Architectural Evaluation

The technology set remains intentionally small and justified.

The project should begin with:

- ASP.NET Core
- EF Core
- SQL Server
- Token-based auth
- xUnit
- native ASP.NET validation and logging

The following remain intentional deferrals:

- YARP
- Redis
- Kafka
- OpenTelemetry
- additional validation libraries until the need is demonstrated

This is the correct decision because it respects the project’s principle: correctness before performance, problem before technology, and no premature infrastructure.
