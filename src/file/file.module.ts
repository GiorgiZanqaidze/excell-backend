import { Injectable, Module, OnModuleInit } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { MongoService } from '../mongo/mongo.service';
import { USERS_COLLECTION, type User } from './entities/user.entity';
import { PRODUCTS_COLLECTION, type Product } from './entities/product.entity';

@Injectable()
class FileCollectionsInitializer implements OnModuleInit {
  constructor(private readonly mongo: MongoService) {}

  async onModuleInit(): Promise<void> {
    const users = this.mongo.getCollection<User>(USERS_COLLECTION);
    await users.createIndex({ email: 1 }, { unique: true });
    await users.createIndex({ createdAt: -1 });

    const products = this.mongo.getCollection<Product>(PRODUCTS_COLLECTION);
    await products.createIndex({ sku: 1 }, { unique: true });
    await products.createIndex({ createdAt: -1 });
  }
}

@Module({
  controllers: [FileController],
  providers: [FileService, FileCollectionsInitializer],
})
export class FileModule {}
