# FlexiApp

FlexiApp is a mobile-first rental fleet management platform featuring a NestJS + Prisma backend, Next.js + Tailwind UI, JWT authentication with RBAC, automated invoice generation, and a Dockerised deployment workflow.

## Features

- **Entities & CRUD** – Manage fleets, drivers, suppliers, customers, trips, invoices, and payments.
- **Automated invoicing** – When trips are completed a customer invoice and (for rent-in assets) a supplier invoice are generated automatically.
- **Dashboard analytics** – Filterable KPIs for revenue, receivables, payables, utilization, and top customers.
- **PDF invoices** – Download styled PDF invoices on demand.
- **Audit logging** – Every mutation is stored with actor metadata.
- **API documentation** – Swagger/OpenAPI available at `/docs`.
- **Docker ready** – Compose stack with PostgreSQL, backend, and frontend services.

## Project structure

```
├── backend/        # NestJS API with Prisma ORM
├── frontend/       # Next.js 14 app router + Tailwind UI
├── prisma/         # Prisma schema and seed script
├── docker-compose.yml
└── .env.example
```

## Getting started locally

1. **Clone & install**

   ```bash
   npm install --prefix backend
   npm install --prefix frontend
   npx prisma generate --schema backend/prisma/schema.prisma
   ```

2. **Setup environment** – Copy `.env.example` to `.env` and adjust as needed. Ensure `DATABASE_URL` points to a PostgreSQL instance.

3. **Database migrations & seed**

   ```bash
   npx prisma migrate deploy --schema backend/prisma/schema.prisma
   npx ts-node backend/prisma/seed.ts
   ```

4. **Run the API**

   ```bash
   npm run start:dev --prefix backend
   ```

5. **Run the frontend**

   ```bash
   npm run dev --prefix frontend
   ```

6. **Access the app**

   - Frontend UI: `http://localhost:3000`
   - API: `http://localhost:4000`
   - Swagger docs: `http://localhost:4000/docs`

The seed script provisions an admin user (`admin@flexiapp.local` / `password123`). Use this account to authenticate via the frontend login form.

## Docker deployment

1. Copy the sample environment file and adjust secrets if needed.

   ```bash
   cp .env.example .env
   ```

2. Build and start the stack.

   ```bash
   docker compose up --build
   ```

3. Apply migrations and seed the database (inside the backend container).

   ```bash
   docker compose exec backend npx prisma migrate deploy --schema prisma/schema.prisma
   docker compose exec backend npx ts-node prisma/seed.ts
   ```

Services are exposed on `http://localhost:3000` (frontend) and `http://localhost:4000` (backend + docs).

## Environment variables

| Name | Description |
| ---- | ----------- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma |
| `JWT_SECRET` | Secret for signing JWT access tokens |
| `PORT` | API listening port (default `4000`) |
| `NEXT_PUBLIC_API_URL` | Base URL for frontend API requests |

## API Overview

Authentication uses JWT bearer tokens. After logging in with `/auth/login`, include `Authorization: Bearer <token>` in subsequent requests. The RBAC layer enforces role-specific access (e.g., audit logs and destructive mutations are restricted to admins).

Key endpoints include:

- `POST /auth/login` – obtain access token
- `GET /dashboard` – aggregated KPIs
- `CRUD /fleets`, `/drivers`, `/suppliers`, `/customers`
- `CRUD /trips` – marking a trip `COMPLETED` auto-creates invoices
- `CRUD /invoices` + `GET /invoices/:id/pdf`
- `CRUD /payments` – updates invoice balances and statuses
- `GET /audit-logs` – audit history (admin only)

Refer to Swagger docs for full schema definitions and request/response examples.

## Testing

Manual QA can be performed through the frontend forms or via tools like Thunder Client/Postman using the OpenAPI specification at `/docs`.

## License

MIT
