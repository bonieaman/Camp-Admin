# Youth Camp 2026 Admin

Private camp administration website with Director login, persistent participant records, Excel import, QR generation/scanning, attendance, meals, teams, outreach credit, and certificate eligibility calculations.

## Local setup

```powershell
Copy-Item .env.example .env
npm install
npm run db:migrate
npm run seed
npm run dev
```

## Production deployment

Set these environment variables in Vercel before deploying:

- `DATABASE_URL`: PostgreSQL connection string from your Vercel database.
- `AUTH_SECRET`: Long random session-signing secret. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- `DIRECTOR_ID`: Director login ID.
- `DIRECTOR_PASSWORD_HASH`: Bcrypt hash of the Director password. Generate with `npm run auth:hash -- <password>`.

Vercel uses `npm run vercel-build`, which applies Prisma migrations, generates Prisma Client, and builds the Next.js app.

## Notes

- QR payloads contain only `YC2026:<participantId>:<secure-token>`.
- Attendance and meal APIs prevent duplicate records for the same participant/date/session or meal.
- The UI refreshes after scan/import actions and also polls protected pages for operational freshness.
- PostgreSQL is the production database. Set `DATABASE_URL`, then run `npm run db:migrate` to apply Prisma migrations.
