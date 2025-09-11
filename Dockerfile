## ---------- deps (production node_modules) ----------
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

## ---------- builder (install all + build) ----------
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

## ---------- runner (slim runtime) ----------
FROM node:18-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# copy only prod node_modules and build output
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

EXPOSE 3000
CMD ["node", "dist/main.js"]
