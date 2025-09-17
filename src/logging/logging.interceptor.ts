import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger } from 'winston';
import type { Observable } from 'rxjs';
import type { Response } from 'express';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  private extractMeta(reqUnknown: unknown) {
    let requestId: string | undefined;
    let method: string | undefined;
    let url: string | undefined;
    let ip: string | undefined;
    let userId: string | number | undefined;

    if (typeof reqUnknown === 'object' && reqUnknown !== null) {
      const r = reqUnknown as Record<string, unknown>;
      if (typeof r['requestId'] === 'string') requestId = r['requestId'];
      if (typeof r['method'] === 'string') method = r['method'];
      if (typeof r['originalUrl'] === 'string') url = r['originalUrl'];
      else if (typeof r['url'] === 'string') url = r['url'];
      if (typeof r['ip'] === 'string') ip = r['ip'];
      const user = r['user'];
      if (typeof user === 'object' && user !== null) {
        const id = (user as Record<string, unknown>)['id'];
        if (typeof id === 'string' || typeof id === 'number') userId = id;
      }
    }

    return { requestId, method, url, ip, userId } as const;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAtMs = Date.now();
    const res = context.switchToHttp().getResponse<Response>();
    const meta = this.extractMeta(context.switchToHttp().getRequest());

    this.logger.info({ message: 'request.in', ...meta });

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.info({
            message: 'request.out',
            statusCode: res?.statusCode,
            durationMs: Date.now() - startedAtMs,
            ...meta,
          });
        },
        error: (err: unknown) => {
          const errorMessage =
            err instanceof Error ? err.message : JSON.stringify(err);
          const errorStack = err instanceof Error ? err.stack : undefined;
          this.logger.error({
            message: errorMessage || 'unhandled_error',
            stack: errorStack,
            statusCode: res?.statusCode,
            durationMs: Date.now() - startedAtMs,
            ...meta,
          });
        },
      }),
    );
  }
}
