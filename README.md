# Social Automation

A full-stack project for managing social media campaigns.

## Overview

This repository uses a monorepo-style structure utilizing standard package management:
- `apps/web` - Next.js App Router (React, Tailwind CSS, TypeScript).
- `apps/api` - Node.js + Express backend (TypeScript).
- `database` - Prisma ORM with PostgreSQL schema definitions.
- `queues` - BullMQ Queue definitions and Redis connections.
- `workers` - Background workers using BullMQ.

## Features

- [ ] User authentication
- [ ] Video upload module
- [ ] Social account manager
- [ ] Campaign scheduler
- [ ] Dashboard UI

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL database
- Redis server

### Installation
1. Install dependencies from the root:
   ```bash
   npm install
   ```
2. Setup environment variables by copying `.env.example` configurations across packages.
3. Apply database migrations:
   ```bash
   cd database
   npx prisma generate
   npx prisma db push
   ```

### Running Locally
To run all applications:
```bash
npm run dev
```

Or run packages individually:
- Web: `cd apps/web && npm run dev`
- API: `cd apps/api && npm run dev`
- Workers: `cd workers && npm start`
