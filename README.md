# Crewensia

A student-first event workforce platform connecting event organizers with volunteers and other people looking for event work. The first pilot will focus on Bhubaneswar and validate the basic process of listing events, finding suitable people, and managing applications.

## Confirmed pilot decisions

- Users choose an initial role during sign-up and can switch between **Organizer** and **Volunteer** modes from the same account. Each mode has its matching interface. Organizer publishing still requires admin verification and approval.
- Organizers must be manually verified before they can publish events. They provide contact and credential details; an admin contacts them, checks their credentials, and approves or rejects the account in the admin panel.
- Organizers handle any payment directly with volunteers. Crewensia will not collect or process payments during the pilot.
- Organizers must provide complete event information, including whether the opportunity is paid or unpaid and the amount offered when applicable.
- Volunteers can browse available events, filter by location, and apply.
- Organizers review applications and approve or reject each applicant from their interface.

## MVP workflows

### Organizer onboarding and approval

1. User signs up as an organizer and submits contact details and information needed to verify their identity or organization.
2. Account enters a pending-verification state.
3. Admin contacts the organizer, checks their credentials, and records approval or rejection in the admin panel.
4. Approved organizers can access event publishing; rejected or pending accounts cannot publish.

### Event creation

Require organizers to provide the details volunteers need to decide whether to apply. The event form should cover:

- Event name, description, category, and organizer
- Venue address and city/location
- Event date, start and end times, and any separate shift times
- Roles, responsibilities, required skills, and number of openings
- Eligibility or age requirements, if applicable
- Compensation status: paid or unpaid; amount, whether it is per hour, shift, or event, and expected payment timing when paid
- Number of openings and application deadline
- Any other conditions, benefits, dress code, contact or arrival instructions

The organizer is responsible for arranging and making any promised payment directly to selected volunteers. The platform may show whether the organizer has marked payment complete, clearly labelled as organizer-reported and not independently verified.

### Volunteer experience

- Sign up as a volunteer and provide profile, skills, and preferred location.
- Browse currently available events and filter by location; begin with city-level filtering, with finer location options added if the pilot needs them.
- See the event date, shift time, role, location, openings, and compensation terms together in listings.
- Open an event to review its details and compensation terms.
- Apply and see a clear status: pending, approved, rejected, withdrawn, or completed.
- Withdraw an application before confirmation.
- See confirmed event instructions, timing, and organizer contact details for approved applications.

### Organizer application management

- View applicants for each event and their relevant profile details.
- Approve or reject applicants from the organizer interface.
- See each application's current status and the event's confirmed volunteer list.
- Close applications at the deadline or when openings are filled.
- Update or cancel an event and notify applicants and confirmed volunteers.
- Contact waitlisted applicants when a confirmed volunteer withdraws or an opening becomes available.

### Admin panel

- Review organizer verification submissions.
- Record who completed verification, when, what was checked, the outcome, and private admin notes.
- Approve or reject organizer accounts.
- Review reports and hide an event or restrict an account while a report is being reviewed.

## Pilot improvements to include

- Put the key decision details on event listings: role, time, location, openings, application deadline, and clear paid or unpaid terms.
- Support application withdrawal, event updates or cancellation, notifications, and a simple waitlist for replacements.
- Provide basic reporting for misleading listings or concerning behavior, with admin review controls.
- Keep payment outside Crewensia; if payment status is shown, label it as reported by the organizer.
- Start with straightforward discovery filters for location, role, skills, schedule, and availability. Defer AI matching and complex reputation scores until the pilot produces enough useful data.

## API implementation

The API contract is in `apps/server/openapi.yaml`; the implementation is in `apps/server/src/routes/`.

- **Accounts:** `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/me`. Sessions use opaque bearer tokens; only token hashes are stored.
- **Role switching:** `POST /api/me/roles` adds Volunteer or Organizer mode to an account. `PATCH /api/me/active-role` changes the active interface. Organizer mode remains pending until an admin approves verification.
- **Organizer verification:** `GET /api/organizers/me`, `POST /api/organizers/me/verification-requests`, and admin list/review routes under `/api/admin/organizer-verifications`.
- **Events:** `GET /api/events` supports city, role, skill, and date filters. Organizers create draft events with roles, shifts, and pay terms, then publish or cancel them through event routes.
- **Applications:** Volunteers apply to shifts and can withdraw. Organizers list applicants for their events and approve, reject, or waitlist them. Approval checks shift capacity in a serializable database transaction.
- **Notifications:** `GET /api/me/notifications` and `PATCH /api/me/notifications/{id}/read` provide application and event updates.

To set up the first admin, create the account normally, then run `npm run admin:promote -- admin@example.com` from the project root. This is a local command-line operation; there is no public admin signup route.

The API currently does not send email, verify email addresses, or handle password resets. Its initial notification support is in-app only. Reporting, attendance capture, post-event feedback, and payment status updates remain for a later API pass.

The Postman collection and local run instructions are in `postman/README.md`. The collection covers all 25 currently implemented API operations; a recorded local run is in `postman/reports/2026-11-08-local-api-run.md`.

## Client application

The React client is organized by route and feature under `apps/client/src/`. Axios is configured in `src/lib/api.js`; auth, events, organizer, and application requests live in their respective feature API modules. TanStack Query handles server data and mutations. React Router keeps the landing, authentication, event discovery/details, applications, notifications, and organizer workflows as separate pages. Framer Motion adds restrained page and card transitions, with reduced-motion preferences respected in CSS.

## Open product decisions

- After the city-level pilot, should location filtering expand to neighborhoods, distance radius, or both?
- Which organizer credentials will admins accept as sufficient verification?
- What exact safety and incident response process should admins follow?
- Which event updates require volunteers to reconfirm their availability?

## Source

`Crewensia-Requirements.docx` contains the original concept brief.

## Naming

Use **Crewensia** consistently across product, brand, and project materials.


## Monorepo setup

The repository uses npm workspaces:

```text
apps/
  client/    React + Vite frontend
  server/    Node.js + Express API, Prisma schema and migrations
```

### Requirements

- Node.js 22.18 or newer
- npm
- Docker Desktop (for the local PostgreSQL container)

### Start the complete app with Docker

From the project root, run:

```sh
docker compose up --build
```

Compose starts PostgreSQL, builds and starts the API, applies pending Prisma migrations automatically, then starts the React/Vite client. Open `http://localhost:5173`; the API health endpoint is `http://localhost:3000/api/health`. Stop the app with `Ctrl+C`, or run `docker compose down` in another terminal. The database volume is preserved when containers stop.

### Demo data and accounts

Run `npm run db:seed-demo --workspace @crewensia/server` to create or refresh local demo accounts, organizer verification data, and a published event. These credentials are for the local development database only; the production test accounts have separate passwords shared directly with the project owner:

| Name | Role and status | Email | Phone | Password |
| --- | --- | --- | --- | --- |
| Crewensia Admin | Admin | `demo.admin@crewensia.test` | `+91 90000 00002` | `CrewensiaDemo2026!` |
| Aarav Volunteer | Volunteer | `demo.volunteer@crewensia.test` | `+91 90000 00001` | `CrewensiaDemo2026!` |
| Maya Rao | Approved organizer | `demo.organizer@crewensia.test` | `+91 90000 00003` | `CrewensiaDemo2026!` |
| Nisha Community | Pending organizer | `demo.pending@crewensia.test` | `+91 90000 00004` | `CrewensiaDemo2026!` |

#### Demo profiles and organization records

- **Aarav Volunteer:** Bhubaneswar, Saheed Nagar; skills include event support and photography.
- **Maya Rao's organization:** Community Table Bhubaneswar. Verification is approved so its event can be published and tested.
- **Nisha Community's organization:** Green Neighbourhood Collective. Verification is pending for the NGO registration certificate. The sample registration ID is `OD/NGO/2024/08421`; the document reference is `Demo document reference (sample only)`. These sample credential details are fictional.

#### Seeded event

- **Title:** Bhubaneswar Community Garden Day
- **Organizer:** Community Table Bhubaneswar (Maya Rao)
- **Category:** Environment; **status:** published; **compensation:** unpaid
- **Schedule:** starts 14 days after first seed, 10:00–14:00 India time; applications close 24 hours before it starts
- **Location:** Saheed Nagar Community Garden, Saheed Nagar, Bhubaneswar, Odisha
- **Role:** Garden Support Volunteer; 12 openings; help prepare planting beds, plant saplings, sort compost, and welcome participants
- **Requirements:** age 18+, comfortable clothes and closed-toe shoes; gardening experience is not required
- **Benefits:** refreshments, gardening supplies, and a community participation certificate
- **Arrival:** meet at the garden entrance beside the community library and ask for Maya
- **Sample application:** Aarav Volunteer is seeded as a pending applicant, so Maya can open the organizer studio and test viewing contact details and accepting or rejecting an application.

The location dropdown currently offers **Bhubaneswar** for the pilot. Sign in as `demo.admin@crewensia.test` and open `/admin` to review the pending organization. As the volunteer, open `/events` to see the garden event. Demo names, contact details, credentials, and login data in this section are for local development only.

#### Production review sample data

The production database has login-enabled test accounts for an admin, a volunteer, an approved organizer, and a pending organizer. They use the addresses `demo.admin@crewensia.test`, `demo.volunteer@crewensia.test`, `demo.organizer@crewensia.test`, and `demo.pending@crewensia.test`; their production passwords are shared privately with the project owner and are not stored in this public repository. A separate production review seeder creates clearly labeled fictional records for the admin panel: one `DEMO ONLY — Community Garden Day (do not attend)` listing and three sample volunteer applications in pending, approved, and waitlisted states. The sample applicant accounts created by that script have random unusable password hashes. The event has no real venue and explicitly tells visitors not to attend. Run it only as a Render one-off job with `NODE_ENV=production CREWENSIA_ENABLE_PRODUCTION_DEMO_SEED=true npm run db:seed-production-demo --workspace @crewensia/server`.

You no longer need to start the client, API, or Prisma migrations separately for the Docker workflow. The existing individual npm commands remain available for development outside Docker.

### Run locally

1. Copy `.env.example` to `.env` in the repository root.
2. Start Docker Desktop, then start PostgreSQL and wait until its health check passes with `docker compose up -d --wait postgres`.
3. Install dependencies with `npm install`.
4. Generate Prisma Client with `npm run db:generate`.
5. Create and apply pending database migrations with `npm run db:migrate`.
6. Start the web app and API with `npm run dev`.

The web app runs at `http://localhost:5173`; the API health endpoint is `http://localhost:3000/api/health`. The Vite dev server proxies `/api` calls to the API.

Use `npm run db:studio` to open Prisma Studio. Never commit `.env` or real credentials. The local Docker credentials in the compose file are for development only.

### Workspace packages

- `@crewensia/client`: React UI scaffold using Vite.
- `@crewensia/server`: Express API scaffold and Prisma data layer.
- PostgreSQL runs locally through Docker Compose.

Prisma ORM 7 uses a PostgreSQL driver adapter and a generated client. The API package contains the Prisma configuration and starter domain models for accounts, organizer verification, volunteer profiles, events, roles, and applications.

## Database schema coverage

The Prisma schema is in `apps/server/prisma/schema.prisma`.

- **Accounts and access:** `User`, `Session`, `EmailVerificationToken`, and `PasswordResetToken`. A user can hold Volunteer, Organizer, and Admin roles on one account; `activeRole` controls the current interface.
- **Volunteer profile:** `VolunteerProfile` and `VolunteerAvailability` store city, locality, skills, and time windows.
- **Organizer onboarding:** `OrganizerProfile` stores the current approval state; each `VerificationRequest` records submitted credentials, review outcome, reviewer, and private notes.
- **Events:** `Event` stores listing details and lifecycle; `EventRole` stores role requirements and compensation terms; `EventShift` stores dates, times, and openings for each role.
- **Applications and work history:** `Application` stores a volunteer's application and organizer-reported payment status; `ApplicationStatusChange` records its history; `AttendanceRecord` stores attendance. Completed applications and attendance provide the initial Event Passport history.
- **Coordination:** `EventUpdate` and `Notification` support event changes, cancellations, decisions, and waitlist updates.
- **Trust and moderation:** `Report`, `EventFeedback`, and `AdminAction` support reporting, post-event feedback, and an audit trail for admin actions.

### Rules the API must enforce

Some consistency rules span multiple rows and should be checked in server transactions when records are created or changed:

- The active role must be present in the account's role list. Add Organizer access only when the user starts organizer onboarding; require approved organizer verification before publishing.
- Paid roles need an amount, basis, and expected payment timing; unpaid roles must not show a payment amount.
- Shift times must be valid and fit within the event schedule; openings must be positive. Approval must not exceed available openings.
- An applicant can apply only to a published event before its deadline. Organizers can decide applications only for events they own.
- When an event changes or is cancelled, create an `EventUpdate` and notify affected applicants and confirmed volunteers in the same transaction or through a reliable outbox process.
- Keep organizer payment markers explicitly organizer-reported. Crewensia does not verify or process the payment.
- A report must target exactly one event, account, or application. Feedback ratings must be within the allowed range and tied to a completed event interaction.
- Store only hashed session and one-time token values. Keep verification documents private and store only a protected storage reference in `documentReference`.

The Prisma schema defines the storage model. The initial migration creates the pilot tables; later migrations add changes such as workflow-specific notification types.
