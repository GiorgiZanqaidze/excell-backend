# Excel Backend (NestJS)

This repository contains the **backend API** for Excel file import/export, built with **NestJS**. It handles file uploads, data validation, parsing, and exporting structured data as Excel files.

---

## 🚀 Features

- **Excel Import**
  - Accept `.xlsx` files via upload.
  - Parse Excel to JSON using [`xlsx`](https://www.npmjs.com/package/xlsx).
  - Validate required columns and data types.
  - Return validation errors for invalid data.
- **Excel Export**
  - Convert backend JSON data to `.xlsx`.
  - Download Excel file via API endpoint.
- **Optional Authentication**
  - JWT-based security for protected routes.
- **Dockerized**
  - Ready for containerized deployment.
- **Testing**
  - Unit tests with Jest.

---

## 📂 Project Structure

excel-backend/
├─ src/
│ ├─ app.module.ts
│ ├─ main.ts
│ ├─ excel/
│ │ ├─ excel.module.ts
│ │ ├─ excel.controller.ts
│ │ ├─ excel.service.ts
│ │ ├─ dto/
│ │ │ └─ import-excel.dto.ts
│ │ └─ interfaces/
│ │ └─ excel.interface.ts
│ └─ auth/ (optional)
│ ├─ auth.module.ts
│ ├─ auth.service.ts
│ └─ jwt.strategy.ts
├─ test/
├─ package.json
├─ tsconfig.json
└─ Dockerfile