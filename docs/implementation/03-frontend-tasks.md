# 03. Frontend Implementation Tasks

## 1. Scope

This document defines the front-end implementation tasks for the Vehicle Rental System. The priority is to deliver a small but realistic UI that exercises the approved backend architecture without adding unnecessary client complexity.

---

## 2. Frontend Task Breakdown

### Task F01 — App scaffold and routing

Objective:
- Set up the React + TypeScript frontend foundation.

Dependencies:
- Project setup and approved frontend architecture decisions.

Deliverable:
- Vite-based React app structure.
- Route shell for public and protected pages.
- Base styling and layout.

Validation criteria:
- The app runs locally.
- Main routes render correctly.
- Base project structure is stable and easy to extend.

---

### Task F02 — Authentication screens

Objective:
- Implement customer registration and login flows.

Dependencies:
- F01

Deliverable:
- Registration page.
- Login page.
- Token handling and protected-route gating.

Validation criteria:
- New users can sign up.
- Registered users can log in successfully.
- Unauthorized users are redirected or blocked.

---

### Task F03 — Vehicle browsing and search

Objective:
- Implement the customer-facing vehicle listing flow.

Dependencies:
- F01, F02

Deliverable:
- Vehicle catalog page.
- Search and filter controls.
- Vehicle detail view.

Validation criteria:
- Customers can view available inventory.
- Filters reflect actual backend data.
- Vehicle detail view includes relevant metadata.

Implementation status:
- Catalog page and type/location filters were already present; this task adds the missing vehicle detail view (`src/components/VehicleDetail.tsx`, wired into `App.tsx` via a Details action on each card).
- Detail shows brand/model/year/type/location, license plate, operational status pill, and type/location descriptions from the loaded catalog data; non-`Available` vehicles show "Currently unavailable" and hide booking.
- Standalone availability checker prefilled from the schedule bar (`POST /api/bookings/availability`); the Book action enables only when the check passes for the current vehicle + period, and creation still re-validates server-side with an idempotency key.
- Validation: `npm run build` passes, `npm run lint` 0 warnings/errors. Live availability/booking flows still require backend + databases running.

---

### Task F04 — Booking flow

Objective:
- Implement the primary customer booking journey.

Dependencies:
- F03, backend booking APIs

Deliverable:
- Booking form with pickup and return date selection.
- Booking confirmation flow.
- Booking history and detail view.

Validation criteria:
- Customers can create a valid booking.
- Invalid or overlapping rental periods are surfaced appropriately.
- Booking status is visible after confirmation.

---

### Task F05 — Cancellation and completion flow

Objective:
- Allow customers to manage the lifecycle of their bookings.

Dependencies:
- F04

Deliverable:
- Cancel booking actions for eligible bookings.
- Booking status view for active and completed rentals.

Validation criteria:
- Eligible bookings can be cancelled.
- Ineligible actions are disabled or show clear errors.
- User-visible state updates after backend responses.

---

### Task F06 — Admin management screens

Objective:
- Support administrator actions for vehicle and booking administration.

Dependencies:
- F01, backend admin APIs

Deliverable:
- Vehicle creation and update forms.
- Vehicle type and location management.
- Booking review and status-management views.

Validation criteria:
- Admins can manage catalog data.
- Booking data is visible with correct authorization checks.
- Protected admin actions are inaccessible to customers.

Implementation status:
- Implemented in `src/admin/AdminPanel.tsx` (wired into `App.tsx` behind `user.role === 'Admin'`; nav shows "Admin" for Admins only).
- Vehicles tab: admin list (`GET /api/admin/vehicles`), create (`POST`), edit (`PUT` incl. operational status), deactivate (`PATCH …/deactivate`) with confirm modal; dashboard counts by status.
- Types/Locations tabs: list, create, edit, deactivate via `/api/admin/vehicle-types` and `/api/admin/locations`.
- Bookings tab: admin list with status filter (`GET /api/admin/bookings`) and lifecycle actions mapped exactly to allowed transitions (Pending → confirm/reject with optional reason; Confirmed → pickup; Active → return with optional note; Returned → complete); no buttons for terminal states.
- Shared `request()` helper and API types extracted to `src/api.ts`; admin styles added to `src/App.css` (tables, forms, modal) plus the missing `status-returned`/`status-completed` pill classes.
- Validation: `npm run build` passes, `npm run lint` 0 warnings/errors. Live admin flows still require an Admin account with backend + databases running.

---

### Task F07 — Gateway and API integration polish

Objective:
- Align frontend behavior with the API Gateway and service boundaries.

Dependencies:
- F02, F03, F04, F06

Deliverable:
- Centralized API client configuration.
- Error-to-user feedback patterns.
- Loading and validation states across flows.

Validation criteria:
- The frontend handles API failures clearly.
- Correct route and authorization behavior is visible to the user.
- No unstable or duplicate client-side state behavior remains in core flows.

---

### Task F08 — UX hardening and final validation

Objective:
- Finish the app for a minimal user-ready experience.

Dependencies:
- F07

Deliverable:
- Final polish for search, booking, status display, and admin workflows.
- Consistency checks across the main journeys.

Validation criteria:
- Core customer and admin journeys complete successfully.
- The UI matches the approved business rules.
- The app is ready for deeper integration, testing, and load validation.

---

## 3. Frontend Execution Sequence

1. F01
2. F02
3. F03
4. F04
5. F05
6. F06
7. F07
8. F08

This ordering keeps delivery focused on the core customer and admin experience before beautification and hardening work.
