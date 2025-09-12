import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  const logger = app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER);

  app.useLogger(logger);

  // Access log (distinct from internal logs)
  app.use(
    (
      req: Request & { requestId?: string; user?: { id?: string | number } },
      res: Response,
      next: NextFunction,
    ) => {
      const startedAt = Date.now();
      res.on('finish', () => {
        logger.log({
          message: 'http.access',
          logType: 'access',
          requestId: req.requestId,
          method: req.method,
          url: req.originalUrl || req.url,
          statusCode: res.statusCode,
          durationMs: Date.now() - startedAt,
          userId: req.user?.id,
          userAgent: req.get('user-agent'),
          contentLength: res.getHeader('content-length'),
          ip: req.ip,
        });
      });
      next();
    },
  );

  // Enable CORS
  app.enableCors({
    origin: (
      configService.get<string>('CORS_ORIGINS') ?? 'http://localhost:3000'
    ).split(','),

    credentials: true,
  });

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Excel Backend API')
    .setDescription('API for Excel file import/export operations')
    .setVersion('1.0')
    .addTag('app', 'Application endpoints')
    .addTag('file', 'File operations and Excel templates')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api`);
}

void bootstrap();
