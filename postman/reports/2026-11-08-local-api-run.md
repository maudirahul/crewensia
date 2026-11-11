# Crewensia API collection run

- Target: local API at `http://localhost:3000`, connected to the local PostgreSQL database.
- Collection: `Crewensia Pilot API Tests`.
- Result: **32 requests, 32 test scripts, 75 assertions passed; 0 failures**.
- Checks covered authentication and logout, volunteer and organizer profiles and role changes, organizer verification submission and admin approval, event creation/discovery/details/publishing/cancellation, applications and decisions/withdrawal, and notifications/read state.
- One expected conflict response (409) was asserted when an already-approved organizer tried to resubmit verification.
- Test accounts and their event data were removed after the run (3 accounts removed).
- The initial local run disabled API Catalog event reporting with `--no-report-events`.

## Postman Cloud verification

After signing in, the tested collection was added to **My Workspace** (`70880035-c824-4989-826a-ecebbb3f55cf`) as collection `43611358-af809ea2-2307-44f5-9a0e-ae078f75f267`. The cloud copy contains 32 saved requests and was run against the local API: **32 requests, 75 assertions passed, 0 failures**. [View the Postman run](https://go.postman.co/workspace/70880035-c824-4989-826a-ecebbb3f55cf/run/43611358-776f73ca-83fe-44c3-a7e0-26659320607c).
