Excel Backend (NestJS)

This repository contains the backend API for Excel file import/export, built with NestJS. It handles file uploads, data validation, parsing, and exporting structured data as Excel files.

🚀 Features

Excel Import

Accept .xlsx files via upload.

Parse Excel to JSON using xlsx
.

Validate required columns and data types.

Return validation errors for invalid data.

Excel Export

Convert backend JSON data to .xlsx.

Download Excel file via API endpoint.

Optional Authentication

JWT-based security for protected routes.

Dockerized

Ready for containerized deployment.

Testing

Unit tests with Jest.

📂 Project Structure
src/
├─ app.module.ts          # Root module
├─ main.ts                # Entry point
├─ excel/
│  ├─ excel.module.ts
│  ├─ excel.controller.ts
│  ├─ excel.service.ts
│  ├─ dto/
│  │  └─ import-excel.dto.ts
│  └─ interfaces/
│     └─ excel.interface.ts
├─ auth/ (optional)
│  ├─ auth.module.ts
│  ├─ auth.service.ts
│  └─ jwt.strategy.ts
test/                     # Unit & e2e tests

⚡ Installation

Clone the repository:

git clone https://github.com/your-org/excel-backend.git
cd excel-backend


Install dependencies:

npm install


Create a .env file:

PORT=3000
JWT_SECRET=your_jwt_secret

🏃 Running the App
Development
npm run start:dev

Production
npm run build
npm run start:prod

Docker
docker build -t excel-backend .
docker run -p 3000:3000 excel-backend

📌 API Endpoints
Method	Endpoint	Description
POST	/excel/import	Upload and parse Excel file
GET	/excel/export	Export data as Excel file
GET	/excel/data	Fetch JSON data (for frontend preview)

Optional: Protect endpoints using JWT.

🧪 Testing

Run unit tests:

npm run test


Run test coverage:

npm run test:cov

🛠 Tech Stack

NestJS – Backend framework

Multer – File uploads

xlsx – Excel parsing & generation

Jest – Unit tests

Docker – Containerization

🔗 Contributing

Fork the repository

Create a new branch (feature/xyz)

Commit your changes

Open a pull request

📄 License

MIT License © [Your Name / Organization]