# Crewensia Postman collection

The runnable, Git-native collection is in `collections/Crewensia Pilot API Tests/`. It exercises every implemented API operation with a stateful organizer, admin, and volunteer workflow. The Postman v2.1 import file is in `imports/` for importing into the Postman desktop app.

## Run locally with Postman CLI

1. Start PostgreSQL and the API (`npm run dev:server`).
2. Create an admin account and grant it admin access:

   ```sh
   npm run admin:promote -- admin@example.com
   ```

3. Run the collection with that account and a temporary password for the generated test accounts:

   ```sh
   postman collection run 'postman/collections/Crewensia Pilot API Tests' \
     --env-var adminEmail=admin@example.com \
     --env-var adminPassword='your-admin-password' \
     --env-var testPassword='temporary-test-password-12' \
     --no-report-events
   ```

The run creates temporary organizer and volunteer accounts and a test event. Delete those generated records after a run if you want to keep the database clean. The collection does not process payments. The collection tests the implemented pilot APIs; it does not cover email delivery, password resets, reporting, attendance, feedback, or payment status updates because those endpoints are not implemented yet.

To use the v2.1 import in Postman, import the JSON file and set the `adminEmail`, `adminPassword`, and `testPassword` collection variables. Create and promote the admin account before running the collection.
