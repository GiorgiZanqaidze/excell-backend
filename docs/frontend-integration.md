## Frontend Integration — Minimal Guide

_Version: 2.0 (minimal)_

This guide reflects only what is derivable from the app bootstrap (`src/main.ts`).

### Base URL

- Default: `http://localhost:3000`
- The actual port comes from `.env` `PORT` (defaults to `3000`).

### CORS

- Enabled with credentials.
- Allowed origins are read from `.env` `CORS_ORIGINS` (comma-separated).
- Example: `CORS_ORIGINS=http://localhost:4200,http://localhost:5173`

### Swagger

- Available at: `/api`
- Example: `http://localhost:3000/api`

### REST Endpoints

The following endpoints are available under the `file` controller. Replace `http://localhost:3000` with your backend base URL.

#### 1) Download Excel template

- Method: `GET`
- Path: `/file/templates/:templateName/download`
- Query:
  - `includeSample` (optional) — `true|false` (include sample rows)
- Response: `.xlsx` file (binary)

Example:

```bash
curl -L "http://localhost:3000/file/templates/users/download?includeSample=true" -o users_template.xlsx
```

#### 2) Export data to Excel

- Method: `GET`
- Path: `/file/export/:templateName`
- Query:
  - `limit` (optional, default 1000)
- Response: `.xlsx` file (binary)

Example:

```bash
curl -L "http://localhost:3000/file/export/users?limit=500" -o users_export.xlsx
```

#### 3) Upload Excel (async via BullMQ)

- Method: `POST`
- Path: `/file/upload/:templateName/async`
- Body: `multipart/form-data` with field `file`
- Response: JSON `{ jobId: string, status: 'queued' }`

Example:

```bash
curl -X POST "http://localhost:3000/file/upload/users/async" \
  -F "file=@./users_template.xlsx"
```

Sample response:

```json
{ "jobId": "upload-1726932289-abc123xyz", "status": "queued" }
```

Use the returned `jobId` to poll the job status below.

#### 4) Get job status/result

- Method: `GET`
- Path: `/file/jobs/:id`
- Response:
  - `id`: string
  - `state`: string (e.g., `waiting`, `active`, `completed`, `failed`)
  - `progress`: number
  - `attemptsMade`: number
  - `returnvalue`: unknown (on success, contains the processing summary)
  - `failedReason?`: string

Example:

```bash
curl "http://localhost:3000/file/jobs/upload-1726932289-abc123xyz"
```

Sample success payload:

```json
{
  "id": "upload-1726932289-abc123xyz",
  "state": "completed",
  "progress": 100,
  "attemptsMade": 1,
  "returnvalue": {
    "message": "Processed 10 of 12 rows",
    "processed": 10,
    "errors": ["Row 3: Field 'email' is required", "Row 9: Invalid date"]
  }
}
```

Sample failure payload:

```json
{
  "id": "upload-1726932289-abc123xyz",
  "state": "failed",
  "progress": 10,
  "attemptsMade": 1,
  "failedReason": "Template 'users' not found"
}
```

#### 5) Fetch paginated data

- Method: `GET`
- Path: `/file/data/:templateName`
- Query:
  - `page` (optional, default 1)
  - `limit` (optional, default 10)
- Response: JSON array of documents

Example:

```bash
curl "http://localhost:3000/file/data/users?page=1&limit=10"
```

Sample item (users):

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+995555123456",
  "birthDate": "1990-01-01T00:00:00.000Z",
  "isActive": true,
  "createdAt": "2025-09-20T11:22:33.000Z",
  "updatedAt": "2025-09-20T11:22:33.000Z"
}
```

Sample item (products):

```json
{
  "name": "Laptop Computer",
  "sku": "LAP-001",
  "price": 999.99,
  "category": "Electronics",
  "stock": 50,
  "description": "High-performance laptop for professionals",
  "createdAt": "2025-09-20T11:22:33.000Z",
  "updatedAt": "2025-09-20T11:22:33.000Z"
}
```

### Client Setup Checklist

- Point your frontend base URL to the backend: e.g., `http://localhost:3000`.
- Ensure your app origin is listed in `CORS_ORIGINS`.
- For production behind HTTPS, use `https://` and enable `wss://` for any WebSocket usage.

### Health and Diagnostics

- Check the console output on server start for the bound port and Swagger URL.
- If requests are blocked by CORS, verify `CORS_ORIGINS` and restart the backend.

### Notes

- This guide lists the REST endpoints implemented in the project. For schemas and live contract, consult Swagger (`/api`).

### Can I change the base URL per environment?

Yes. Put it in your frontend environment file (e.g., Angular `environment.ts`) and inject it into the service.

### Where can I explore available columns and examples?

- Download a template with `GET /file/templates/:templateName/download?includeSample=true` to see column specs and an Instructions sheet.

---

If anything is unclear, open an issue or extend this doc with more Q&A.
