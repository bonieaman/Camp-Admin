# Youth Camp 2026 Admin

Private camp administration website with Director login, persistent participant records, Excel import, QR generation/scanning, attendance, meals, teams, outreach credit, and certificate eligibility calculations.

## Local setup

```powershell
Copy-Item .env.example .env
npm install
npm run db:init
npm run seed
npm run dev
```

Login:

- Director ID: `YC-2026-000`
- Password: `ycdtp2026`

## Notes

- QR payloads contain only `YC2026:<participantId>:<secure-token>`.
- Attendance and meal APIs prevent duplicate records for the same participant/date/session or meal.
- The UI refreshes after scan/import actions and also polls protected pages for operational freshness.
- `npm run db:init` initializes the local SQLite database. `npm run db:push` is retained for environments where Prisma's schema engine is available.
