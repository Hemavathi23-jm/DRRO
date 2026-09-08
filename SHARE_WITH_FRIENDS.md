# Share DRRO with a friend (why they see no data)

## Why their system has no data

DRRO does **not** store disasters/requests inside the project zip.

All data lives in a **Supabase PostgreSQL** database.

Connection settings are in `DRRO/.env`:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`

That file is **gitignored**, so if you shared only Git / project source, your friend got an empty app with **no database connection** (or an empty new database).

## Fix options

### Option A — Same data as you (easiest)

1. Copy your `DRRO/.env` to their machine (same folder).
2. On their PC install:
   - Java 17
   - Maven
   - Node.js
3. Run backend:

```powershell
cd DRRO\backend
mvn spring-boot:run
```

4. Run frontend (new terminal):

```powershell
cd DRRO\frontend
npm install
npm run dev
```

5. Open http://localhost:5173/

They will see **your live cloud data**.

### Option B — Their own empty database

1. Create a free Supabase project.
2. Copy `DRRO/.env.example` → `DRRO/.env`
3. Fill `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` from Supabase.
4. Set `JPA_DDL_AUTO=update`
5. Start backend + frontend as above.

On first startup the app now **auto-seeds demo data** (disasters, locations, resources, requests, teams) if the database is empty.

## Checklist if UI is empty

- [ ] `DRRO/.env` exists on their PC
- [ ] Backend is running on port **8080** (no DB connection errors in terminal)
- [ ] Frontend is running on port **5173**
- [ ] Browser can open http://localhost:5173/dashboard
- [ ] Backend log shows `[DevDataSeeder] Ready — disasters=...`

## Important

Never post `.env` publicly (it contains the database password).
Share it privately (USB / WhatsApp chat / password manager).
