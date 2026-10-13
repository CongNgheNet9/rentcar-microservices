# 03. Frontend Library Evaluation

## 1. Purpose

This document evaluates frontend libraries and technology choices relevant to the current project scope.

It follows the same requirement-first approach as the backend evaluation: every dependency must solve a current project need; if no need exists, it is rejected or deferred.

---

## 2. Evaluation Summary

| Technology | Decision | Status | Install Now |
|---|---|---|---|
| React | Selected | REQUIRED_NOW | No |
| TypeScript | Selected | REQUIRED_NOW | No |
| Vite | Selected | REQUIRED_NOW | No |
| Tailwind CSS v4 + local CSS | Selected | REQUIRED_NOW | Yes |
| Fetch API | Selected | REQUIRED_NOW | No |
| React local state / Context | Selected | REQUIRED_NOW | No |
| TanStack Query | Deferred | TBD | No |
| Zustand / Redux Toolkit | Deferred | TBD | No |
| React Hook Form | Deferred | TBD | No |
| date-fns / Day.js | Deferred | TBD | No |
| Shadcn UI (source-owned components) | Selected | REQUIRED_NOW | Yes |
| Lucide React | Selected | REQUIRED_NOW | Yes |
| `clsx` + `tailwind-merge` + `class-variance-authority` | Selected | REQUIRED_NOW | Yes |

---

## 3. React

### Problem
The project needs a frontend framework that supports interactive vehicle browsing, booking flows, and admin screens.

### Requirement
The project overview explicitly requires React + TypeScript.

### Candidates
- React
- another framework
- no client framework

### Comparison
| Criteria | React | Other frameworks |
|---|---|---|
| Fit for project | High | Medium |
| Learning value | High | Variable |
| Ecosystem support | High | Variable |
| UI complexity support | Strong | Variable |

### Recommended Choice
React

### Reason
React is directly required by the system specification and is suitable for a small but realistic full-stack learning project.

### Trade-offs
- Requires component design discipline
- Can encourage unnecessary abstraction if not controlled

### Status
REQUIRED_NOW

### Native Alternative
No native alternative is needed for the project’s scope.

### Installation Decision
Do not install packages during Step 4; this is an architecture decision only.

---

## 4. TypeScript

### Problem
The frontend needs a safer client codebase with clearer contracts around data flows and forms.

### Requirement
The project explicitly requires TypeScript.

### Candidates
- TypeScript
- JavaScript without type safety

### Comparison
| Criteria | TypeScript | JavaScript |
|---|---|---|
| Fit for project | High | Medium |
| Maintainability | High | Medium |
| Early error detection | High | Low |

### Recommended Choice
TypeScript

### Reason
It matches the project definition and improves maintainability for a real booking and admin application.

### Trade-offs
- Slightly more setup and compile-time discipline
- Not needed to over-engineer simple screens, but still appropriate for the project

### Status
REQUIRED_NOW

### Native Alternative
JavaScript is possible but does not match the project definition.

### Installation Decision
This is a project-approved technology; no installation during Step 4.

---

## 5. Vite

### Problem
The frontend needs a lightweight build and development workflow for React + TypeScript.

### Requirement
The project overview names the frontend as React + TypeScript but leaves the build tool open; Vite is a natural fit for this architecture and project size.

### Candidates
- Vite
- CRA
- manual tooling

### Comparison
| Criteria | Vite | CRA | Manual setup |
|---|---|---|---|
| Fit for current scope | High | Medium | Low |
| Startup speed | High | Medium | Variable |
| Maintenance | Low | Medium | High |

### Recommended Choice
Vite

### Reason
It is lightweight, modern, and consistent with a learning-focused React project.

### Trade-offs
- Requires a simple setup discipline
- Not necessary to overdo configuration at this stage

### Status
REQUIRED_NOW

### Native Alternative
A custom build pipeline is possible but not justified for this project.

### Installation Decision
Do not install or configure anything yet; this is only a selection decision.

---

## 6. Styling and UI Components

### Problem
The app needs styling with minimal complexity and minimal operational overhead.

### Requirement
The project scope is small and the architecture emphasizes simplicity.

### Candidates
- Native CSS
- CSS Modules
- CSS-in-JS
- UI component library styling system

### Comparison
| Criteria | Native CSS | CSS Modules | CSS-in-JS |
|---|---|---|---|
| Fit for current scope | High | Medium | Low |
| Complexity | Low | Medium | High |
| Need for project | Directly justified | Optional | Not justified |

### Recommended Choice
Shadcn UI for reusable accessible primitives, Tailwind CSS v4 for those primitives, and local CSS for RideLux's existing visual system during gradual migration. Shadcn components are source files owned by this repository, not a runtime component package.

### Reason
The user explicitly requested Shadcn UI, and the frontend already has several interactive workflows and a custom visual system. This project-directed choice supersedes the earlier optional-library recommendation.

### Trade-offs
- Tailwind adds build-time tooling and utility-class conventions.
- Migrating every existing screen at once would create avoidable visual churn; retain custom CSS until each screen is intentionally migrated.

### Status
REQUIRED_NOW

### Native Alternative
The browser and React environment already support CSS natively.

### Installation Decision
Configure Tailwind CSS v4 and the Shadcn component aliases; keep only source components used by the application. Run the CLI ephemerally when registry access is available rather than adding its current dependency tree to the app.

---

## 7. Fetch API

### Problem
The frontend must call backend endpoints without introducing extra HTTP client overhead.

### Requirement
The current project does not require advanced client-side request abstraction.

### Candidates
- Fetch API
- Axios
- other HTTP clients

### Comparison
| Criteria | Fetch API | Axios |
|---|---|---|
| Fit for project | High | Medium |
| Built-in support | Yes | No |
| Complexity | Low | Medium |
| Need for interceptors | Not yet | Optional |

### Recommended Choice
Fetch API

### Reason
It is sufficient for the current architecture and keeps the frontend simpler.

### Trade-offs
- Fewer convenience features than Axios for some workflows
- More manual boilerplate if the app becomes larger

### Status
REQUIRED_NOW

### Native Alternative
Fetch is the browser-native standard.

### Installation Decision
No HTTP client installation is approved during Step 4.

---

## 8. Server-State Management

### Problem
The frontend may need to synchronize UI with backend data such as vehicles and bookings.

### Requirement
The project does not yet require a complex server-state abstraction.

### Candidates
- Native React state and effects
- TanStack Query
- other server-state patterns

### Comparison
| Criteria | Native React | TanStack Query |
|---|---|---|
| Fit now | High | Medium |
| Setup complexity | Low | Medium |
| Caching and syncing | Basic | Advanced |
| Need for project | Sufficient now | Not yet justified |

### Recommended Choice
Native React state management first

### Reason
The project is intentionally small and the core requirement is to keep the frontend understandable without premature abstractions.

### Trade-offs
- More custom request and cache handling may be needed later
- Large apps may benefit from a server-state library, but the current scope does not justify it yet

### Status
TBD

### Native Alternative
React’s built-in state and effect patterns are sufficient for the current project.

### Installation Decision
No server-state package is approved during Step 4.

---

## 9. Client-State Management

### Problem
The frontend may need to manage local UI state, form state, and feature-level state.

### Requirement
The project scope does not currently require a global state library.

### Candidates
- React Context
- useState/useReducer
- Zustand
- Redux Toolkit

### Comparison
| Criteria | Local state / Context | Zustand / Redux |
|---|---|---|
| Fit now | High | Medium |
| Complexity | Low | Medium |
| Need for current project | Sufficient | Not yet justified |

### Recommended Choice
React local state and Context as needed.

### Reason
The app is small and can remain easily maintainable without a global store.

### Trade-offs
- Local state may become more fragmented if the app grows quickly
- A global store may eventually be useful, but it is not required now

### Status
REQUIRED_NOW

### Native Alternative
React itself provides enough state primitives to support the current application.

### Installation Decision
No global client-state library is approved during Step 4.

---

## 10. Form Validation

### Problem
The frontend must validate user inputs and booking forms.

### Requirement
A minimal validation layer is required, but a complex form-validation library is not justified for the initial phase.

### Candidates
- Native HTML validation
- manual validation logic
- React Hook Form
- another validation library

### Comparison
| Criteria | Native/manual validation | Form library |
|---|---|---|
| Fit now | High | Medium |
| Complexity | Low | Medium |
| Need for current project | Clear | Not yet justified |

### Recommended Choice
Use native form validation and custom validation logic where needed.

### Reason
The form complexity is not yet high enough to justify a dedicated validation library.

### Trade-offs
- Custom validation logic can grow with the app
- A library would simplify some patterns later, but it is not required yet

### Status
REQUIRED_NOW

### Native Alternative
The browser and React provide sufficient validation primitives.

### Installation Decision
Do not add a form-validation library during Step 4.

---

## 11. Date / Time Utilities

### Problem
The frontend must show and validate rental dates and times consistently with the backend’s UTC-based contract.

### Requirement
The project requires accurate booking dates, but no date library is required for the current MVP.

### Candidates
- Native Date / Intl
- date-fns
- Day.js

### Comparison
| Criteria | Native Date / Intl | date-fns / Day.js |
|---|---|---|
| Fit now | High | Medium |
| Complexity | Low | Medium |
| Need for current scope | Sufficient | Not justified |

### Recommended Choice
Native Date / Intl

### Reason
This keeps the frontend small and avoids adding dependencies for common date operations that are still manageable with native APIs.

### Trade-offs
- More manual date handling is required in code
- A library could simplify formatting and comparisons later

### Status
REQUIRED_NOW

### Native Alternative
The platform already provides the required date functionality.

### Installation Decision
No date library installation is approved during Step 4.

---

## 12. Utility Libraries and Icons

### Problem
The frontend may need small utility functions and icons, but the project does not justify a large general-purpose library.

### Requirement
Keep the frontend small and focused on the actual booking and admin use cases.

### Candidates
- native JS utilities and inline SVG icons
- large utility library
- icon library

### Comparison
| Criteria | Native utilities | Large utility library |
|---|---|---|
| Current fit | High | Low |
| Complexity | Low | High |
| Need justification | Strong | Weak |

### Recommended Choice
Use native JavaScript utilities for domain logic and Lucide React for icons. Use `clsx`, `tailwind-merge`, and `class-variance-authority` only for Shadcn component composition.

### Reason
This is sufficient for the current project and avoids unnecessary dependencies.

### Trade-offs
- Less convenience than a large library
- More manual implementation of small helpers

### Status
REQUIRED_NOW (Lucide React and focused class composition utilities only; no general-purpose utility library)

### Native Alternative
The platform already has the needed capabilities.

### Installation Decision
Lucide React and the Shadcn-focused class utilities are approved for the current UI.

---

## 13. Final Frontend Evaluation

The frontend should remain intentionally small and purposeful.

Recommended stack:

- React
- TypeScript
- Vite
- Shadcn UI source-owned components with Tailwind CSS v4; local CSS retained during migration
- Lucide React icons
- Fetch API
- local React state and Context by default
- native form and date handling

Not required for the current project:

- additional component systems beyond Shadcn UI
- Redux or Zustand by default
- server-state libraries without measured need
- form libraries without complexity
- date utility libraries without actual benefit

This keeps the frontend aligned with the project’s architecture, avoids unnecessary dependencies, and respects the principle that technologies should be introduced only when there is a clear requirement.
