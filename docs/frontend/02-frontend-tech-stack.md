# 02. Frontend Tech Stack

## 1. Purpose

This document records the approved frontend technology stack for the current project phase.

The project should not add frontend libraries beyond what the current architecture needs.

---

## 2. Approved Stack

| Area | Technology | Decision | Status |
|---|---|---|---|
| UI library | React | Required | REQUIRED_NOW |
| Language | TypeScript | Required | REQUIRED_NOW |
| Build tool | Vite | Required | REQUIRED_NOW |
| Styling | Tailwind CSS v4 for Shadcn; local CSS during migration | Selected | REQUIRED_NOW |
| HTTP client | Fetch API | Preferred | REQUIRED_NOW |
| Server-state | Native React patterns first | Preferred | REQUIRED_NOW |
| Client-state | React Context / local state | Preferred | REQUIRED_NOW |
| Validation | Native form validation | Preferred | REQUIRED_NOW |
| Date/time | Native Date + Intl | Preferred | REQUIRED_NOW |
| Icons | Lucide React | Selected | REQUIRED_NOW |
| UI components | Shadcn UI source-owned components | Selected | REQUIRED_NOW |
| TanStack Query | Not required for current MVP | TBD | TBD |
| Zustand / Redux Toolkit | Not required for current scope | TBD | TBD |
| React Hook Form | Not required unless forms become complex | TBD | TBD |
| date-fns / Day.js | Not required unless complexity justifies it | TBD | TBD |

---

## 3. Why These Technologies Are Approved

### React
Problem:
- The project requires a user-facing UI layer with a manageable frontend architecture.

Requirement:
- Project overview explicitly requires React + TypeScript.

Decision:
- React is the approved frontend framework.

Status:
- REQUIRED_NOW

### TypeScript
Problem:
- The project benefits from type safety in UI code and API boundary handling.

Requirement:
- Project overview explicitly requires TypeScript.

Decision:
- TypeScript is required.

Status:
- REQUIRED_NOW

### Vite
Problem:
- The project needs a lightweight, modern frontend build and dev workflow.

Requirement:
- The project overview calls for React + TypeScript and small incremental implementation.

Decision:
- Vite is the preferred build/dev setup for this project.

Status:
- REQUIRED_NOW

### CSS / local styling approach
Problem:
- The project needs styling without unnecessary complexity.

Requirement:
- UI work is small and learning-focused, not a design system-heavy build.

Decision:
- Use Shadcn UI source-owned primitives with Tailwind CSS v4, while keeping existing RideLux local CSS during incremental migration.

Status:
- REQUIRED_NOW

### Fetch API
Problem:
- The frontend needs to communicate with the API Gateway without adding an unnecessary HTTP client library.

Requirement:
- The project does not currently require a complex HTTP client abstraction.

Decision:
- Prefer native Fetch API unless a clear API-layer requirement emerges.

Status:
- REQUIRED_NOW

### React state tools
Problem:
- The project needs a clear separation between local UI state and server state, but does not require a large global state library at the MVP stage.

Requirement:
- The architecture calls for a simple, maintainable frontend without premature abstraction.

Decision:
- Start with local React state and React Context; add server-state or global state tools only if the project demonstrates a real need.

Status:
- REQUIRED_NOW / TBD depending on usage patterns

### Form validation
Problem:
- Customer and admin screens need validation, but not necessarily a large validation library.

Requirement:
- Valid user input handling is required, but the project does not yet specify complex form flows that require a dedicated form library.

Decision:
- Prefer native form validation, with a dedicated library only if required later.

Status:
- REQUIRED_NOW

### Date handling
Problem:
- The project must manage booking dates and times reliably.

Requirement:
- The architecture requires UTC-based booking periods and date selection.

Decision:
- Use native JavaScript Date and Intl by default unless a later need proves a date library is beneficial.

Status:
- REQUIRED_NOW

### Icons and utility libraries
Problem:
- The project needs simple UI support without adding large dependencies.

Requirement:
- Keep the frontend small and lean.

Decision:
- Use Lucide React for icons and small focused class utilities (`clsx`, `tailwind-merge`, `class-variance-authority`) for Shadcn components.

Status:
- REQUIRED_NOW

---

## 4. Deferred or Optional Frontend Dependencies

### TanStack Query
The project may later use server-state caching for vehicle lists or booking queries, but the current architecture does not require it.

Status: TBD

### Zustand or Redux Toolkit
The project does not yet require a global client-state store.

Status: TBD

### React Hook Form
The project may not have enough complex forms to justify this dependency.

Status: TBD

### date-fns / Day.js
The project can use native Date / Intl for the current scope.

Status: TBD

---

## 5. Final Decision Summary

The frontend stack should remain intentionally light:

- React
- TypeScript
- Vite
- Shadcn UI source components + Tailwind CSS v4, with local CSS retained during migration
- Lucide React icons
- Fetch API
- native React state patterns
- native form validation and date handling

The following are intentionally not required now:

- additional component systems beyond Shadcn UI
- server-state libraries without a demonstrated need
- Redux/Zustand by default
- date utility libraries without a need
- form libraries without a complex form model

This is consistent with the project’s requirement-first decision process.
