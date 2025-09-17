import {
  Global,
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MongoDB } from 'winston-mongodb';
import { LoggingInterceptor } from './logging.interceptor';
import { RequestIdMiddleware } from './request-id.middleware';
import { mkdirSync } from 'node:fs';
import type { TransformableInfo } from 'logform';

@Global()
@Module({
  imports: [
    ConfigModule,
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logDir = config.get<string>('LOG_DIR') ?? 'logs';
        const logLevel = config.get<string>('LOG_LEVEL') ?? 'info';
        mkdirSync(logDir, { recursive: true });

        const consoleFormat = winston.format.combine(
          winston.format.colorize({ all: true }),
          winston.format.timestamp(),
          winston.format.printf((info: TransformableInfo) => {
            type Ext = TransformableInfo & {
              requestId?: string;
              method?: string;
              url?: string;
              statusCode?: number;
              durationMs?: number;
              userId?: string | number;
              stack?: string;
            };
            const e = info as Ext;

            const level =
              typeof e.level === 'string' ? e.level : String(e.level);
            const timestamp =
              typeof e.timestamp === 'string'
                ? e.timestamp
                : new Date().toISOString();
            const message =
              typeof e.message === 'string'
                ? e.message
                : JSON.stringify(e.message);

            const requestId =
              typeof e.requestId === 'string' ? e.requestId : undefined;
            const method = typeof e.method === 'string' ? e.method : undefined;
            const url = typeof e.url === 'string' ? e.url : undefined;
            const statusCode =
              typeof e.statusCode === 'number' ? e.statusCode : undefined;
            const durationMs =
              typeof e.durationMs === 'number' ? e.durationMs : undefined;
            const userId =
              typeof e.userId === 'string' || typeof e.userId === 'number'
                ? e.userId
                : undefined;

            const parts: string[] = [];
            if (requestId) parts.push(`requestId=${requestId}`);
            if (method) parts.push(method);
            if (url) parts.push(url);
            if (statusCode !== undefined) parts.push(`status=${statusCode}`);
            if (durationMs !== undefined)
              parts.push(`durationMs=${durationMs}`);
            if (userId !== undefined) parts.push(`userId=${userId}`);
            const metaStr = parts.length ? ` ${parts.join(' ')}` : '';

            const stack = typeof e.stack === 'string' ? e.stack : undefined;
            const stackStr = stack ? `\n${stack}` : '';

            return `${timestamp} ${level} ${message}${metaStr}${stackStr}`;
          }),
        );

        return {
          defaultMeta: {
            service: 'excel-backend',
            env: config.get<string>('NODE_ENV') ?? 'development',
          },
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
          transports: [
            new winston.transports.Console({
              level: logLevel,
              format: consoleFormat,
            }),
            new winston.transports.DailyRotateFile({
              dirname: logDir,
              filename: 'application-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              zippedArchive: true,
              maxFiles: '30d',
              level: logLevel,
            }),
            new winston.transports.DailyRotateFile({
              dirname: logDir,
              filename: 'error-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              zippedArchive: true,
              maxFiles: '90d',
              level: 'error',
            }),
            new MongoDB({
              db:
                config.get<string>('MONGO_URI') ||
                `mongodb://${config.get<string>('MONGO_HOST') ?? 'localhost'}:${
                  config.get<number>('MONGO_PORT') ?? 27017
                }/${config.get<string>('MONGO_DB') ?? 'excell_backend'}`,
              options: { directConnection: true },
              collection: 'logs',
              level: logLevel,
              tryReconnect: true,
              decolorize: true,
              storeHost: true,
              metaKey: 'meta',
            }),
          ],
        };
      },
    }),
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: LoggingInterceptor }],
  exports: [WinstonModule],
})
export class LoggingModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
