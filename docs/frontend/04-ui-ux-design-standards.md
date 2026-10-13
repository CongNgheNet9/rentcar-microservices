# 04. UI/UX Design Standards

## 1. Purpose

This document is the single authoritative source for UI/UX standards of the Vehicle Rental System frontend. It closes the gap noted in `docs/frontend/01-frontend-architecture.md` (unresolved page composition) by defining: typography, color, layout, per-page content, vehicle display rules, status visualization, UI states, and animation.

It defines the RideLux dark-luxury visual language implemented in `verhicle-rental-system-fe/src/assets/styles/app.css`, `assets/styles/index.css`, and `assets/styles/tokens.css`. The dark redesign (background, gold accent, serif display) was adopted per product direction; the change and its reason are recorded in §14. Anything not specified here remains `TBD`.

Constraints from the approved stack (`docs/frontend/02-frontend-tech-stack.md`):

- Shadcn UI source-owned primitives with Tailwind CSS v4; retain local CSS during screen migration.
- Lucide React for interface icons; vehicle photos may use catalog `imageUrl` with a visual fallback.
- Native form validation, native Date/Intl, Fetch API, local React state.
- UI copy is English.

---

## 2. Design Principles

1. One page, one job: each screen completes a single use case from `docs/03-use-cases.md`.
2. Never trust the client for correctness: the UI surfaces backend validation and business errors verbatim (via Problem Details `detail`), it never re-implements booking rules.
3. Availability is advisory until confirmed: the UI may show availability checks, but only the Booking Service decides (UC-CUST-05/06).
4. Status is always visible: every booking and vehicle shown carries its lifecycle/operational status as a pill or dot.
5. Destructive actions are explicit and reversible-aware: cancel/deactivate/complete require confirmation and show eligibility (enabled/disabled with reason).
6. Small motion, no theater: animation supports feedback and orientation only.

---

## 3. Brand and Design Tokens

Brand: **RIDELUX** (wordmark "RIDE" + light "LUX", circular gold-outlined "R" mark).

### 3.1 Color tokens

Dark-luxury palette. New code must use these variables, not hard-coded hex.

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#0c0c0e` | Page background |
| `--surface` | `#141416` | Cards, panels, search bar |
| `--ink` | `#f5f2ea` | Primary text |
| `--muted` | `#a8a294` | Secondary text, hints |
| `--line` | `#26262b` | Borders, dividers |
| `--gold` | `#d9a441` | Primary actions, brand accent, links on hover |
| `--gold-soft` | `#e8c476` | Gold hover, display italic accents |
| `--gold-ink` | `#1a1408` | Text on gold buttons |
| `--focus` | `#e8c476` | Focus outline (2px + 3px offset) |

Status colors (booking pills, already in use — extended, see §7):

| Token | Value | Usage |
|---|---|---|
| `--warn-bg` / `--warn-ink` | `#3a2f14` / `#e8c476` | Pending |
| `--ok-bg` / `--ok-ink` | `#17301f` / `#7fd08a` | Confirmed, Active |
| `--bad-bg` / `--bad-ink` | `#3a1f1b` / `#e89a8f` | Cancelled, Rejected, destructive text |
| `--neutral-bg` / `--neutral-ink` | `#232327` / `#b6b0a1` | Default pill, Completed, Returned |
| `--err-bg` / `--err-ink` | `#3a1f1b` / `#e89a8f` | Error notice |
| `--success-bg` / `--success-ink` | `#17301f` / `#7fd08a` | Success notice |

### 3.2 Typography

- Family: `'DM Sans', 'Segoe UI', Arial, sans-serif` for UI; `'Playfair Display', Georgia, serif` for display headings (hero H1, section H2, detail title). Both load via Google Fonts in `index.html` with system fallbacks.
- Scale (clamp where fluid):

| Role | Size | Weight | Letter-spacing | Usage |
|---|---|---|---|---|
| Display | `clamp(42px, 5vw, 68px)` / 1.05, serif | 700 | 0 | Hero H1 only (`Drives Await` in italic gold) |
| H2 section | 30–32px / 1.2 | 700 | -1.3px | Section headings |
| Card title | 14px | 700 | -0.3px | Vehicle name |
| Body | 12–14px / 1.7–1.8 | 400 | 0 | Paragraphs |
| Meta | 9–11px | 400–600 | 0 | Card subtitles, table cells |
| Eyebrow/label | 8–9px | 800 | 1.2–1.65px, uppercase | Section eyebrows, field labels |
| Pill | 8px | 700 | 0 | Status pills |

- Small text must stay legible at 9px minimum; do not use sizes below 8px.

### 3.3 Spacing, radius, shadow

- Page max width: 1240px (topbar/hero), content sections 1120px.
- Section rhythm: 70–80px top padding between sections; 20px card grid gap.
- Radius: 8–14px for cards/panels/inputs; 999px for pills and primary CTAs; 50% for dots/avatars.
- Shadow: cards carry a soft black elevation (`0 18px 40px rgba(0,0,0,.35)`); search bar and toast notices elevated likewise.
- Focus: every interactive element keeps the 2px `--focus` outline (already global).

### 3.4 Responsive breakpoints (existing — do not change)

- `≤1160px`: side margins 32px.
- `≤760px`: single-column hero, 2-col vehicle grid, stacked search bar, compact topbar.
- `≤430px`: 1-col vehicle grid, hidden secondary nav/footer text, compact booking rows.

---

## 4. Layout Shell

- Topbar (66–78px): brand left, primary nav center/left, auth state right (avatar + name + "Sign out", or gold pill "Rent a Car →" CTA). Role-aware: customers see "Cars" + "My bookings"; admins additionally see "Admin". No decorative nav entries for features that do not exist (no Destinations/Experiences/About pages).
- Main: single-column sections, max-width per §3.3.
- Footer: brand, tagline "Your trip. Your way.", environment tag (e.g. `LOCAL DEMO · 2026`).
- Toast notice: fixed bottom-right, dismissible, `role="status"`, auto-content from backend `detail` on error.

---

## 5. Component Patterns

- Primary button (`.primary-button`): green bg, white text, 47px min-height, arrow `→` suffix for forward actions, disabled → 60% opacity + `cursor: wait` while `busy`.
- Accent button (`.search-button`): lime bg, dark text, used once per screen for the key conversion action.
- Danger text-button: borderless red-brown text (existing `.cancel-button`), only for eligible destructive actions.
- Inputs/selects: 1px `#e3e8e2` border, 3px radius, 10–12px padding; labels are 8–10px uppercase eyebrows above the field.
- Tabs (auth): underline indicator on the active tab.
- Tables (admin screens, new): 11px cells, row dividers in `--line`, sticky header text as eyebrows, row actions right-aligned.
- Modal/confirm (new, CSS-only): centered card, dim backdrop, used for cancel/deactivate/complete confirmations. No modal library.

---

## 6. Page Specifications

Route-agnostic: works with current anchor sections and with real routes later. Each page lists the use case, required data (from `docs/backend/06-api-design.md` field names), and content.

### 6.1 Home / Hero + schedule bar (public)

- Use cases: entry point, sets rental period context.
- Content: eyebrow ("LUXURY CAR RENTAL"), serif H1 ("Unforgettable Drives *Await*", italic gold accent), subcopy, gold "Browse Cars →" and ghost discover link, showroom car photo, and a four-column stats row using live catalog counts only. Do not add fabricated customer/review totals.
- Brand strip: horizontally animated, monochrome wordmarks; use catalog makes where present and the documented featured-make fallback otherwise. They are text treatments, not official vector logo artwork.
- Do not place a rental-date search bar between the hero, brand strip, and fleet gallery. Rental period controls live in car details.
- Navigation includes Home, Cars, Destinations, Experiences, About, a search icon that jumps to Cars, and the "Rent a Car →" account CTA.

### 6.2 Auth — login / register (public)

- Use cases: UC-CUST-01, UC-CUST-02.
- Content: tab switch (Sign in / Create account), fields Full name (register only), Email, Password (min 8); submit button; backend error shown via notice; demo hint only in local dev.
- Rules: native `required`/`type=email`/`minLength`; never store passwords; token persisted as today (`vehicle-rental-user`); protected content hidden until auth.

### 6.3 Fleet browse + filters (public read-only)

- Use cases: UC-CUST-03. Anonymous visitors may browse active, available vehicles, types, and locations through read-only catalog endpoints.
- Content: serif H2 ("Choose Your *Dream Car*") + subcopy + "View All Cars →" (clears filters), category pills ("All Cars" + one pill per vehicle type from `/vehicle-types`, wired to the type filter), location dropdown, live count ("N CARS READY"), 3-col dark card grid.
- Empty states: no catalog → seed hint (dev); filters match nothing → "No vehicles match your filters."

### 6.4 Vehicle detail (public; booking actions require authentication)

- Use cases: UC-CUST-04, UC-CUST-05.
- Content (all from Vehicle + VehicleType + Location records):
  - Title: Brand + Model, Year, type name, location name.
- Operational status pill (§7.2); non-`Available` vehicles show "Currently unavailable" and disable booking.
- Spec block: type description, location description.
- Availability checker: pickup/return inputs + "Check availability" → shows available/unavailable + backend reason. Signed-out visitors are prompted to sign in before calling the protected availability endpoint.
  - Booking CTA enabled only when availability check passes for the shown period.
- Behavior: availability result is advisory; the create-booking call re-validates server-side and its error is shown verbatim.

### 6.5 Booking create + confirm (authenticated customer)

- Use cases: UC-CUST-06.
- Content: summary (vehicle, period, pickup/return locations), confirm button, result notice ("Initial status: pending confirmation").
- Rules: always call availability first, then create with a fresh `Idempotency-Key` per user intent (already implemented); disable submit while `busy` to prevent double-click duplicates; surface 409/validation errors verbatim.

### 6.6 My bookings + booking detail (authenticated customer)

- Use cases: UC-CUST-07, UC-CUST-08.
- Content per row: vehicle name (or `Xe #id` fallback), pickup–return range (localized via Intl), status pill (§7.1), cancel button only for `Pending`/`Confirmed` with confirm modal.
- Detail (expandable row or section): booking id, locations, status history if exposed, reason text for Rejected/Cancelled when available.
- Empty: "You don't have any trips yet. Pick a car to get started."

### 6.7 Admin — dashboard (admin role) — NEW

- Use cases: overview entry for UC-ADMIN-01…07.
- Content: counts (vehicles by status, bookings by status), shortcuts to the four management screens. Read-only aggregates from existing list endpoints; no new backend needed.

### 6.8 Admin — vehicles (admin) — NEW

- Use cases: UC-ADMIN-01, UC-ADMIN-02, UC-ADMIN-03.
- Content: filterable table (brand/model, type, location, status pill), create/edit form (brand, model, year, plate, type, location, status), deactivate action with confirm; blocked deactivation shows backend reason.
- New bookings must be impossible for non-`Available` vehicles (enforced server-side; UI disables).

### 6.9 Admin — vehicle types & locations (admin) — NEW

- Use cases: UC-ADMIN-04, UC-ADMIN-05.
- Content: simple CRUD tables (name + description), duplicate-name and in-use errors shown verbatim.

### 6.10 Admin — bookings (admin) — NEW

- Use cases: UC-ADMIN-06, UC-ADMIN-07.
- Content: filter by status/customer, booking detail with full field set, lifecycle action buttons mapped exactly to allowed transitions (Pending → confirm/reject/cancel; Confirmed → pickup/cancel; Active → return; Returned → complete). Only currently-allowed actions render; invalid transitions are never clickable.
- Stale-write conflicts (rowversion) surface the backend error with a "reload" prompt.

---

## 7. Status Visualization

### 7.1 Booking status pills (English labels)

| Status | Label | Style |
|---|---|---|
| Pending | Pending | warn (amber) |
| Confirmed | Confirmed | ok (green) |
| Active | Active | ok (green) |
| Returned | Returned | neutral (gray) |
| Completed | Completed | neutral (gray) |
| Cancelled | Cancelled | bad (red) |
| Rejected | Rejected | bad (red) |

Gap recorded: current CSS only styles pending/confirmed/active/cancelled/rejected — Returned/Completed fall back to neutral gray, which matches this table, but explicit `status-returned` / `status-completed` classes must be added when detail/history screens render them.

### 7.2 Vehicle operational status

| Status | Label | Treatment |
|---|---|---|
| Available | Available | green dot + bookable |
| Maintenance | Under maintenance | gray/amber pill, not bookable |
| Unavailable | Unavailable | gray pill, not bookable |
| Retired | Retired | hidden from customer fleet; visible in admin only |

---

## 8. Vehicle (Product) Display Rules

- No photo pipeline: visuals are CSS/SVG illustrations on tinted panels, rotating 4 tones (existing `.tone-*`). Keep this system; do not add image upload/hosting (out of scope).
- Card anatomy (fixed order): dark visual panel (type badge top-left, gold-tinted illustration, index number) → title (Brand Model) → meta (Year · Location) → footer (price-note text + circular arrow button opening the detail view). Price text stays as "Price shown at confirmation" until pricing is approved (no pricing in scope). Booking happens in the detail view after an availability check, not from the card. No wishlist/heart affordance (no wishlist feature in scope).
- Never show Maintenance/Unavailable/Retired vehicles in the customer grid; counts ("N CARS READY") count bookable vehicles only.

---

## 9. UI States and Copy (Vietnamese)

- Loading: disable relevant controls + button text "Processing…"; no global spinner library.
- Empty: soft panel, 12px, specific next action (see §§6.3, 6.6).
- Error: toast notice with backend `detail` (never raw stack traces); inline field errors for native validation.
- Disabled with reason: ineligible actions render disabled or hidden with the backend reason available (cancel, book, lifecycle ops).
- Concurrency: after any mutation, re-fetch affected lists (already the `refresh` pattern); on 409, show the message and refresh.

---

## 10. Animation and Micro-interactions

Allowed (CSS only, no library):

1. Button hover lift: `translateY(-1px)` + darken, 0.2s (existing primary buttons).
2. Lime CTA hover darken, 0.2s (existing search button).
3. Toast slide/fade-in on appear, ≤0.25s; dismissible.
4. Tab underline slide (existing auth tabs).
5. Card hover: subtle border-color shift only (do not add scale/shadow pop — keeps motion minimal).
6. Skeleton shimmer for fleet grid while loading — OPTIONAL, only if list latency becomes noticeable; plain empty/loading text is the default.
7. `scroll-behavior: smooth` for anchor navigation (existing).

Constraints:

- Durations ≤ 0.25s; easing `ease`/`ease-out` only.
- Honor `prefers-reduced-motion`: disable transforms/transitions and smooth scroll via a media query (NEW — must be added).
- No page-transition frameworks, no scroll-jacking, no autoplay media, no decorative looping animation beyond the static hero art.

---

## 11. Accessibility and i18n Notes

- Keep semantic landmarks (`header`/`nav`/`main`/`footer`), `aria-label` on nav/brand, `role="status"` on notices (already present — preserve).
- All inputs labeled; error text associated with fields; color is never the only signal (pills carry text labels).
- Contrast: body ink on white and white on `--green` pass; lime button keeps dark text (existing) — do not put white text on lime.
- UI language is English throughout (`<html lang="en">`); dates/times formatted with `Intl` in `en-US`; booking periods display both local time and the UTC basis where ambiguity matters.

---

## 12. TBD Items

- Exact login/registration validation messages beyond native constraints (mirrors UC TBD).
- Price display: blocked until pricing enters scope; current catalog/detail price display is an implementation/documentation gap.
- Vehicle photos: use catalog image URLs when present and retain the illustration fallback; no upload or photo-management workflow is in scope.
- Dark mode: not in scope.
- Whether client-side caching (TanStack Query) is needed for list screens (mirrors FE architecture TBD).
- Exact admin permission matrix beyond Customer/Admin.

---

## 13. Redesign Decision (dark luxury)

- Decision: re-theme the frontend from the light green/lime style to the RideLux dark-luxury style (near-black background, gold accent, Playfair Display headings).
- Reason: product direction requested a premium look matching the provided reference; the layout system (hero + schedule bar + card grid) already matched, so only the theme layer changed — no page, flow, or API change.
- Alternatives: keep the light theme (rejected — does not meet the requested premium positioning); use a closed external theme package (rejected — Shadcn components remain source-owned and locally adjustable).
- Trade-offs: Google Fonts adds a runtime font dependency (system fallbacks remain); gold-on-black carries the contrast budget, so muted small text must stay at/above the approved sizes.
- Stats, brand names, and category pills are data-driven (live catalog data), never invented marketing content.

## 14. Validation

This standard is consistent because:

- Tokens, type scale, breakpoints, and component patterns are taken from the implemented CSS, not invented.
- Every page maps to use cases in `docs/03-use-cases.md` and tasks F01–F08 in `docs/implementation/03-frontend-tasks.md`.
- Status labels cover all 7 booking states (B07) and 4 vehicle states (`VehicleOperationalStatus`), with the Returned/Completed styling gap explicitly recorded.
- No new dependency, service, or backend field is required; admin screens use existing list/mutation endpoints.

Recommended next step: F06 admin screens and the F03 vehicle-detail view implement against this document; add `prefers-reduced-motion` support and the missing status-pill classes alongside.
