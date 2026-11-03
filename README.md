# Annual Attendance Record

Hospital staff leave, duty roster and Hijri / English attendance calendar.
Built with Next.js 16 + MongoDB. Deploys to Vercel.

## Quick start (local)

1. Install Node.js LTS (version 20.9 or newer) from https://nodejs.org
2. Copy `.env.example` to `.env.local` and fill in `MONGODB_URI`, `MONGODB_DB`, `JWT_SECRET`
3. In this folder run:

```
npm install
npm run dev
```

4. Open http://localhost:3000 - the first screen creates the **Main Admin** account.

## Features

- 3 admin accounts: 1 Main Admin (all privileges, final approvals) + 2 Admins
- Staff records: name, role, designation, department, phone
- Leave: any date range, 45 days per staff per calendar year (configurable), max 3 staff on leave on the same day (configurable)
- Admin leave requests wait for the Main Admin's approval; pending requests also count towards the limit of 3
- Shifts (Morning / Evening / Night by default, editable) with a 24-hour timeline for every day
- Assign, remove, substitute staff and move staff to another department
- English by default; one click switches to Arabic (right-to-left) with the Hijri (Umm al-Qura) calendar
- Annual sheet per staff per month with CSV export and print
- The app remembers where each admin left off (tab, month, language) in the database

## Who can do what

| Action | Main Admin | Admin (2nd / 3rd) |
|---|---|---|
| Add / edit staff | yes | yes |
| Duty roster: assign, substitute, transfer | yes | yes |
| Create / edit shifts | yes | yes |
| Assign leave | approved immediately | sent for approval |
| Approve / reject leave | yes | no |
| Remove staff | yes | sends a removal request |
| Delete shifts, manage admins, change settings | yes | no |

## Environment variables

| Name | Meaning |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `MONGODB_DB` | Database name (created automatically), e.g. `annual_attendance` |
| `JWT_SECRET` | Long random text (32+ characters) used to sign login cookies |

Generate a secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Deploy to Vercel

Push the project to GitHub, import it in Vercel, add the three environment variables, click Deploy.
In MongoDB Atlas > Network Access, allow `0.0.0.0/0` so Vercel can connect.
