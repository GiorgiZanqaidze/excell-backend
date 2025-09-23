# Logging Module (NestJS + Winston)

This module provides structured logging using Winston:

- JSON logs to files and MongoDB
- Colorized/human-readable console output
- Request ID (correlation id) on every request
- Global request/response interceptor
- Access logs (endpoints) separated from internal logs

## Structure

- `logging.module.ts` — Winston configuration (console/file/Mongo transports)
- `request-id.middleware.ts` — attaches `x-request-id` per request
- `logging.interceptor.ts` — `request.in` / `request.out` + error logging
- `entities/log-entry.entity.ts` — Mongo logs collection schema (TS interface)

## Environment Variables

- `LOG_LEVEL` (default: `info`)
- `LOG_DIR` (default: `logs`)
- `MONGO_URI` or `MONGO_HOST`/`MONGO_PORT`/`MONGO_DB`

## Destinations

- Console: colorized, compact string (level, time, message, meta)
- Files: `logs/application-%DATE%.log`, `logs/error-%DATE%.log` (JSON, rotated)
- MongoDB: `logs` collection (structured JSON)

## Access vs Internal

- Access (endpoint): `message=\`http.access\``, `logType=access`, includes: method, url, statusCode, durationMs, userId, ip, userAgent
- Internal: `request.in`/`request.out` (interceptor) + domain logs inside services

## Usage in Services

```ts
import { Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

constructor(
  @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
) {}

this.logger.log({ message: 'import.start', templateName, size });
this.logger.warn({ message: 'validation.warn', row, reason });
this.logger.error({ message: 'import.failed', stack: err?.stack });
```

## Troubleshooting

- winston_daily_rotate_file default import error: use `import 'winston-daily-rotate-file'` and `new winston.transports.DailyRotateFile(...)`.
- `logger.info is not a function`: use Nest `LoggerService` and call `logger.log({...})`.

## Notes

- Do not log sensitive data.
- Use levels appropriately: `info`, `warn`, `error`.
- You can disable Mongo transport by removing it from `logging.module.ts`.
