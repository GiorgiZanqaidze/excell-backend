import {
  Injectable,
  Module,
  OnModuleInit,
  Inject,
  LoggerService,
} from '@nestjs/common';
import type { ModuleMetadata } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { MongoService } from '../mongo/mongo.service';
import { USERS_COLLECTION, type User } from './entities/user.entity';
import { PRODUCTS_COLLECTION, type Product } from './entities/product.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { BullModule } from '@nestjs/bullmq';
import { FileProcessor } from './file.processor';

@Injectable()
class FileCollectionsInitializer implements OnModuleInit {
  constructor(
    private readonly mongo: MongoService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit(): Promise<void> {
    const startedAt = Date.now();
    const meta = {
      module: 'FileModule',
      component: 'FileCollectionsInitializer',
      action: 'ensureIndexes',
    } as const;

    this.logger.log({
      level: 'info',
      message: 'collections.ensure.start',
      ...meta,
    });

    try {
      const users = this.mongo.getCollection<User>(USERS_COLLECTION);
      await users.createIndex({ email: 1 }, { unique: true });
      await users.createIndex({ createdAt: -1 });

      const products = this.mongo.getCollection<Product>(PRODUCTS_COLLECTION);
      await products.createIndex({ sku: 1 }, { unique: true });
      await products.createIndex({ createdAt: -1 });

      this.logger.log({
        level: 'info',
        message: 'collections.ensure.success',
        durationMs: Date.now() - startedAt,
        ...meta,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : undefined;
      this.logger.error({
        level: 'error',
        message: errorMessage || 'collections.ensure.failed',
        stack: errorStack,
        durationMs: Date.now() - startedAt,
        ...meta,
      });
      throw err;
    }
  }
}

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'file',
      prefix: 'excell',
      defaultJobOptions: {
        removeOnComplete: true,
        attempts: 1,
      },
    }),
  ] as ModuleMetadata['imports'],
  controllers: [FileController],
  providers: [FileService, FileCollectionsInitializer, FileProcessor],
})
export class FileModule {}
