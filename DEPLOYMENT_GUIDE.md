# HexaCv Deployment Guide

This guide describes how to run and deploy the **HexaCv** platform in development, local Docker containers, and production hosting environments.

## 1. Local Development Launch

First, ensure your environment variables are configured. Copy the example file and modify as needed:
```bash
cp .env.example .env
```

Install packages and boot the server in development mode:
```bash
npm install
npm run dev
```

The Express server with Vite client middleware will launch, typically binding to [http://localhost:3000/](http://localhost:3000/).

## 2. Running Local Docker Containers

We provide a `docker-compose.yml` file to launch the complete stack (Web server, Postgres Database, and Redis Cache) with single-command ease.

To build and launch the stack:
```bash
docker-compose up --build
```

To run in background (detached mode):
```bash
docker-compose up -d
```

To shut down the containerized services:
```bash
docker-compose down
```

## 3. Database Migrations & Seeds

### Drizzle (Local Dev)
To push database schema changes to the MySQL/TiDB dev database:
```bash
npm run db:push
```

### Prisma (Production PostgreSQL)
Prisma is configured in `prisma/schema.prisma` for production PostgreSQL.

To generate the client and apply migrations:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

To seed the database with defaults (presets, admin, etc.):
```bash
npx prisma db seed
```

## 4. Production Cloud Deployments

### Frontend (Vercel)
- Import the repo into Vercel.
- Select **Vite** framework preset.
- Root directory: `./client` (or configure build command as `npm run build` and publish directory as `dist`).
- Add environment parameters matching `.env.example`.

### Backend (Render)
- Deploy as a **Web Service** on Render.
- Select the **Docker** runtime (it will automatically read the `Dockerfile` at the root).
- Bind environment parameters: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, etc.
