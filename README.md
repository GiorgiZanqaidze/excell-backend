# Excel Backend (NestJS)

API for generating Excel templates and processing uploaded Excel files into MongoDB. The system can generate a template, validate uploaded data, and store it in MongoDB. It also supports exporting data to Excel.

---

## 🚀 Features

- **Excel Templates**
  - Generate and download `.xlsx` templates (`/file/templates/:templateName/download`).
  - Column descriptions and examples in Swagger.
- **Excel Import to MongoDB**
  - Upload `.xlsx` (`/file/upload/:templateName`).
  - Simple type validation and aggregated error list.
- **Excel Export**
  - Export existing data to `.xlsx` (`GET /file/export/:templateName?limit=`).
- **Swagger Docs** — available under `/api`.
- **Docker Support** — `Dockerfile` and `docker-compose.yml`.
- **Basic Tests** — unit/e2e boilerplate.
- **Structured Logging** — Winston (console with colors, files with rotation, optional MongoDB transport).

---

## 📂 Project Structure (Actual)

```
excell-backend/
├─ src/
│  ├─ app.module.ts
│  ├─ main.ts
│  ├─ file/
│  │  ├─ file.controller.ts
│  │  ├─ file.module.ts
│  │  ├─ file.service.ts
│  │  ├─ dto/
│  │  └─ interfaces/
│  ├─ logging/
│  │  ├─ logging.module.ts
│  │  ├─ logging.interceptor.ts
│  │  ├─ request-id.middleware.ts
│  │  └─ entities/log-entry.entity.ts
│  └─ mongo/
│     ├─ mongo.module.ts
│     └─ mongo.service.ts
├─ test/
├─ docker-compose.yml
├─ Dockerfile
├─ env.example
├─ package.json
└─ tsconfig.json
```

---

## ⚙️ Development Setup

1. Prerequisites: Node.js 18+, npm, MongoDB (local or Docker)

2. Environment variables:

```
cp env.example .env
```

Configure `MONGO_URI` or `MONGO_HOST/MONGO_PORT/MONGO_DB`. See `env.example`.

3. Install & run:

```
npm ci
npm run start:dev
```

API runs on `http://localhost:3000`. Swagger: `http://localhost:3000/api`.

---

## 🐳 Docker / Compose

Local run with Mongo:

```
docker compose up -d --build
```

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api`
- Mongo: `mongodb://localhost:27017`

See `docker-compose.yml` for envs (`PORT`, `MONGO_URI`, …).

---

## 📘 Main API Endpoints

- `GET /` — healthcheck
- `GET /file/templates` — list available templates
- `GET /file/templates/:templateName` — template details
- `GET /file/templates/:templateName/download?includeSample=true|false` — download template
- `POST /file/upload/:templateName` — upload Excel and persist to MongoDB
- `GET /file/export/:templateName?limit=` — export data to Excel
- `GET /file/data/:templateName?page=&limit=` — paginated fetch from DB

Swagger includes schemas (`ExcelTemplate`, column specs, etc.).

---

## ✍️ Examples

List templates:

```
curl http://localhost:3000/file/templates
```

Download a specific template (e.g., users):

```
curl -L "http://localhost:3000/file/templates/users/download?includeSample=true" -o users_template.xlsx
```

Upload (users):

```
curl -X POST "http://localhost:3000/file/upload/users" \
  -F "file=@./users_template.xlsx"
```

Export (users):

```
curl -L "http://localhost:3000/file/export/users?limit=1000" -o users_export.xlsx
```

Fetch data:

```
curl "http://localhost:3000/file/data/users?page=1&limit=10"
```

---

## 🧩 Current Excel Templates

Available: `users`, `products`.

- `users` columns: `firstName` (required), `lastName` (required), `email` (required), `phone`, `birthDate` (date), `isActive` (boolean)
- `products` columns: `name` (required), `sku` (required), `price` (number, required), `category` (required), `stock` (number), `description`

Filling rules:

- Date: `YYYY-MM-DD`
- Boolean: `true/false`
- Numbers: decimal point, e.g., `999.99`

---

## 🧪 Testing / Quality

```
npm run test
npm run lint
npm run format
```

---

## 🗄️ Migration (Collections + Indexes)

Create collections and indexes:

```
npm run migrate
```

Relies on `.env` (`MONGO_URI` or `MONGO_HOST/MONGO_PORT/MONGO_DB`).

---

## 🌱 Seed (Sample Data)

Load sample data (5 users, 5 products):

```
npm run seed
```

Skips seeding if collections are not empty.

---

## ⚠️ Known Issues & Roadmap

- Headers consistency: generated template uses human-readable headers (e.g., "First Name"), while import expects field keys (e.g., `firstName`). Planned: direct binding of headers to keys during import.
- Excel dates: ensure `cellDates: true` and proper serial-to-date handling for all scenarios.
- Upload limits/filters: parameters from `env.example` to be fully integrated into upload interceptor.
- Mongo indexes: recommended unique indexes (`users.email`, `products.sku`) and `createdAt` index for performance.

This README reflects the current status and next steps for improvements.
