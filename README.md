# Excel Backend (NestJS)

ეს არის Excel ფაილების შაბლონების გენერაციისა და ატვირთული Excel-ის დამუშავება/შენახვისთვის შექმნილი API **NestJS**-ზე. სისტემა ქმნის შაბლონს, ამოწმებს ატვირთულ მონაცემს და ინახავს MongoDB-ში.

---

## 🚀 შესაძლებლობები

- **Excel შაბლონები**
  - `.xlsx` შაბლონის გენერაცია და გადმოწერა (`/file/templates/:templateName/download`).
  - სვეტების აღწერა და მაგალითები Swagger-ში.
- **Excel იმპორტი MongoDB-ში**
  - `.xlsx` ატვირთვა (`/file/upload/:templateName`).
  - ველების ტიპების მარტივი ვალიდაცია და შეცდომების ჩამონათვალი.
- **Swagger დოკუმენტაცია** — `/api`.
- **Docker მხარდაჭერა** — `Dockerfile` და `docker-compose.yml`.
- **საწყისი ტესტები** — unit/e2e boilerplate.

შენიშვნა: ამ ეტაპზე JSON→Excel „ექსპორტის“ ენდპოინტი არ არის განხორციელებული (შაბლონის გენერაცია და იმპორტი არის გაშვებული ნაწილი).

---

## 📂 პროექტის სტრუქტურა (ფაქტობრივი)

```
excell-backend/
├─ src/
│  ├─ app.controller.ts
│  ├─ app.module.ts
│  ├─ app.service.ts
│  ├─ main.ts
│  ├─ file/
│  │  ├─ file.controller.ts
│  │  ├─ file.module.ts
│  │  ├─ file.service.ts
│  │  ├─ dto/
│  │  └─ interfaces/
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

## ⚙️ გარემოს მომზადება (Development)

1. წინაპირობები: Node.js 18+, npm, MongoDB (ლოკალურად ან დოკერით)

2. გარემოს ცვლადები:

```
cp env.example .env
```

მაშინვე საკვანძოა `MONGO_URI` ან `MONGO_HOST/MONGO_PORT/MONGO_DB`. იხილეთ `env.example`.

3. ინსტალაცია და გაშვება:

```
npm ci
npm run start:dev
```

აპი გაიშვება ნაგულისხმევად `http://localhost:3000`-ზე. Swagger: `http://localhost:3000/api`.

---

## 🐳 Docker / Compose

ლოკალური გაშვება Mongo-სთან ერთად:

```
docker compose up -d --build
```

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api`
- Mongo: `mongodb://localhost:27017`

შემხედვარე ცვლადები იხილეთ `docker-compose.yml`-ში (`PORT`, `MONGO_URI`, …).

---

## 📘 API ენდპოინტები (მთავარი)

- `GET /` — ჰელთჩეკი
- `GET /file/templates` — ხელმისაწვდომი შაბლონები
- `GET /file/templates/:templateName` — შაბლონის დეტალები
- `GET /file/templates/:templateName/download?includeSample=true|false` — Excel შაბლონის გადმოწერა
- `POST /file/upload/:templateName` — Excel-ის ატვირთვა და MongoDB-ში შენახვა
- `GET /file/data/:templateName?page=&limit=` — გვერდითობით მიღება DB-დან

Swagger დოკუმენტაცია მოიცავს სქემებს (`ExcelTemplate`, სვეტების აღწერები და სხვ.).

---

## ✍️ მაგალითები

შაბლონების სია:

```
curl http://localhost:3000/file/templates
```

კონკრეტული შაბლონის გადმოწერა (მაგ. users):

```
curl -L "http://localhost:3000/file/templates/users/download?includeSample=true" -o users_template.xlsx
```

ატვირთვა (users):

```
curl -X POST "http://localhost:3000/file/upload/users" \
  -F "file=@./users_template.xlsx"
```

მონაცემების მიღება:

```
curl "http://localhost:3000/file/data/users?page=1&limit=10"
```

---

## 🧩 Excel შაბლონები (ამჟამინდელი)

ხელმისაწვდომი შაბლონები: `users`, `products`.

- `users` სვეტები: `firstName` (required), `lastName` (required), `email` (required), `phone`, `birthDate` (date), `isActive` (boolean)
- `products` სვეტები: `name` (required), `sku` (required), `price` (number, required), `category` (required), `stock` (number), `description`

ფაილის შევსების წესები:

- თარიღი: `YYYY-MM-DD`
- Boolean: `true/false`
- რიცხვები: ათწილადი წერტილით, напр. `999.99`

---

## 🧪 ტესტირება / ხარისხი

```
npm run test
npm run lint
npm run format
```

---

## ⚠️ ცნობილი საკითხები და გეგმები

- ჰედერების შესაბამისობა: გენერირებული შაბლონი იყენებს ადამიანის-წასაკითხ სათაურებს ( напр. "First Name"), ხოლო იმპორტი ელოდება ველების `key`-ებს ( напр. `firstName`). ეს შეიძლება იწვევდეს ვალიდაციის შეცდომებს. გეგმაშია შაბლონიდან პირდაპირ სწორი `key`-ების ბაინდინგი იმპორტისას.
- Excel თარიღები: საჭიროებია `cellDates: true` და serial-to-date სწორად დამუშავება, რათა ყველა სცენარი სწორად იმუშაოს.
- ატვირთვის ლიმიტები/ფილტრები: `env.example`-ში აღწერილი პარამეტრები ინტეგრირდება ატვირთვის ინტერსეპტორში.
- Mongo ინდექსები: რეკომენდირებულია უნიკალური ინდექსები (`users.email`, `products.sku`) და `createdAt` ინდექსი წარმადობისთვის.

მოცემული README ასახავს მიმდინარე სტატუსს და გზას შემდგომი გაუმჯობესებებისკენ.
