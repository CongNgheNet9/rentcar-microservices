# Frontend Architecture and Source Structure

## Decision

Use a feature-oriented React + TypeScript structure, with app-wide infrastructure and reusable primitives outside features. Keep business state close to the application/use-case boundary. Add state libraries only when shared state complexity warrants them.

Shadcn UI is the chosen source-owned component system. Components are added to this repository and can be reviewed/modified like other application code; it is not a runtime component package. Use Tailwind CSS v4 for generated component styles while retaining the current custom CSS for the RideLux visual system during migration. Lucide remains the icon library.

## Structure

```text
src/
├── assets/                  # App-owned images, fonts, stylesheets
├── components/
│   ├── common/              # Cross-feature application components
│   └── ui/                   # Shadcn UI source components
├── constants/               # App-wide constants and keys
├── features/
│   ├── auth/                 # Authentication UI and hooks
│   ├── bookings/             # Booking history, detail, cancellation, lifecycle UI
│   ├── home/                 # Marketing and authenticated home composition
│   ├── vehicles/             # Catalog, filters, details, availability UI
│   └── admin/                # Admin-only feature UI
├── hooks/                    # Cross-feature hooks only
├── services/                 # API client and transport concerns
├── types/                    # Shared domain/API contracts
├── utils/                    # Pure formatting and helper functions
├── App.tsx                   # App composition and use-case coordination
└── main.tsx                  # Runtime entry point
```

Features may own local `components/`, `hooks/`, `types/`, and `services/` folders when the code is feature-specific. Shared types and API contracts belong in `src/types`; constants used by multiple features belong in `src/constants`. Avoid empty folders and avoid moving feature-specific types into a global type bucket without a reuse reason.

The current MVP is a single-page surface; do not add a routing library or global state package until there are distinct navigable routes or state use cases that justify them. Keep request orchestration in app/use-case hooks as it grows, rather than introducing a store by default.

## Component boundaries

- `App.tsx`: compose the active page and connect user actions to services/use cases; no large screen markup.
- `features/<name>/pages`: page-level composition.
- `features/<name>/components`: feature-specific sections and controls.
- `components/common`: app-wide reusable components (for example, a notice or page shell).
- `components/ui`: Shadcn UI primitives, customized locally and not mixed with business behavior.
- `services`: HTTP/auth transport and endpoint calls; never render UI.
- `types`: API/domain types, with request and response contracts distinguished where they differ.
- `constants`: route names, storage keys, status labels, and stable app-wide options; do not duplicate backend-owned catalogs here.
- `utils`: pure helpers such as currency/date formatting.
- `hooks`: reusable React behavior; do not create wrappers that only rename a single `useState` call.

## API and security boundary

The frontend may use an availability response to guide a customer but must not treat it as a reservation. The Booking Service revalidates availability during booking creation. Customer booking queries must remain scoped to the authenticated customer by the service. The client should not store secrets; current token persistence is a separate security concern documented as unresolved in `docs/frontend/01-frontend-architecture.md` and must be revisited before production use.

## Validation

`npm run build` validates TypeScript and the production Vite bundle. `npm run lint` is the available static lint command. Feature behavior should be covered by the project test plan when a frontend test runner is introduced.
