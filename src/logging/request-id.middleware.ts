import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(
    req: Request & { requestId?: string },
    res: Response,
    next: NextFunction,
  ): void {
    const id =
      (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
    req.requestId = id;
    res.setHeader('x-request-id', id);
    next();
  }
}
