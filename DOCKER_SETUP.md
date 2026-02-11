# Docker Setup Guide for InboxOS

This guide walks you through running InboxOS on your machine using Docker for the PostgreSQL database. No prior Docker experience required.

---

## Prerequisites

| Tool | Why you need it |
|------|----------------|
| **Docker Desktop** | Runs the PostgreSQL database in a container so you don't have to install PostgreSQL yourself. |
| **Node.js v18+** | Runs the backend and frontend code. Download from https://nodejs.org |
| **npm** | Comes with Node.js — used to install project dependencies. |

> **Windows users:** During Docker Desktop installation, make sure WSL 2 is enabled when prompted.

---

## Step 1 — Start Docker Desktop

1. Open **Docker Desktop** from your Applications / Start Menu.
2. Wait until the bottom-left status icon turns **green** and says **"Engine running"**.
   - If it stays orange/red, restart Docker Desktop.
3. Leave Docker Desktop open in the background — it needs to stay running.

---

## Step 2 — Start the PostgreSQL database

Open a terminal, navigate to the project root folder, and run:

```bash
cd InboxOS
docker compose up -d
```

> `docker compose up -d` starts PostgreSQL in the background. The `-d` flag means "detached" — your terminal stays free.

**First time?** Docker will download the PostgreSQL image (~80 MB). This only happens once.

To verify it is running:

```bash
docker compose ps
```

You should see a container named `inboxos-postgres` with status **Up**.

---

## Step 3 — Set up environment variables

### Backend

```bash
cp inboxos-backend/.env.example inboxos-backend/.env
```

Open `inboxos-backend/.env` in a text editor. The database values are already filled in and match the Docker container. You **must** fill in:

| Variable | Where to get it |
|----------|----------------|
| `JWT_SECRET` | Any random string (e.g. `mysecretkey123`). |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID. |
| `GOOGLE_CLIENT_SECRET` | Same place as above. |
| `MICROSOFT_CLIENT_ID` | Azure Portal → App registrations → Your app → Application (client) ID. |
| `MICROSOFT_CLIENT_SECRET` | Azure Portal → App registrations → Certificates & secrets → New client secret. |

> If you only plan to use Google login, you can leave the Microsoft values as-is (Microsoft login just won't work). Same applies vice versa.

### Frontend

```bash
cp inbox-flow-main/.env.example inbox-flow-main/.env
```

No changes needed — the default value points to `http://localhost:3000`.

---

## Step 4 — Install dependencies

Run these two commands (you can use two terminal windows in parallel):

```bash
cd inboxos-backend
npm install
```

```bash
cd inbox-flow-main
npm install
```

---

## Step 5 — Start the app

### Terminal 1 — Backend

```bash
cd inboxos-backend
npm run start:dev
```

The backend starts at **http://localhost:3000**. The database tables are created automatically on first start.

### Terminal 2 — Frontend

```bash
cd inbox-flow-main
npm run dev
```

The frontend starts at **http://localhost:8080**.

Open **http://localhost:8080** in your browser. You should see the InboxOS login page.

---

## Stopping everything

### Stop the backend/frontend

Press `Ctrl + C` in each terminal.

### Stop PostgreSQL

```bash
cd InboxOS
docker compose down
```

Your data is preserved in a Docker volume. Next time you run `docker compose up -d`, everything is still there.

To stop **and delete all data** (start fresh):

```bash
docker compose down -v
```

---

## Troubleshooting

### "docker: command not found"

Docker Desktop is not running, or it's not in your PATH. Open Docker Desktop first, wait for the green status, then try again.

### "port 5432 already in use"

Another PostgreSQL instance is using that port. Either:
- Stop the other instance, or
- Edit `docker-compose.yml` and change `"5432:5432"` to `"5433:5432"`, then set `DB_PORT=5433` in your backend `.env`.

### "ECONNREFUSED 127.0.0.1:5432"

The database container isn't running. Run `docker compose up -d` and check `docker compose ps`.

### Backend crashes on startup

- Make sure Docker Desktop is running and `docker compose ps` shows the container as **Up**.
- Make sure your `.env` file exists in `inboxos-backend/` and all `DB_*` values are filled in.

### "relation does not exist" errors

The backend creates tables automatically on startup. If you see this, restart the backend (`npm run start:dev`) — TypeORM will sync the schema.

---

## Quick reference

| Command | What it does |
|---------|-------------|
| `docker compose up -d` | Start PostgreSQL in the background |
| `docker compose down` | Stop PostgreSQL (keeps data) |
| `docker compose down -v` | Stop PostgreSQL and delete all data |
| `docker compose ps` | Check if PostgreSQL is running |
| `docker compose logs postgres` | View PostgreSQL logs |
