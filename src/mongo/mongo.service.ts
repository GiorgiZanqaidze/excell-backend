import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient, Db } from 'mongodb';

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private client?: MongoClient;
  private db?: Db;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const uri =
      this.configService.get<string>('MONGO_URI') ||
      `mongodb://${this.configService.get<string>('MONGO_HOST') ?? 'localhost'}:${this.configService.get<number>('MONGO_PORT') ?? 27017}`;
    const dbName =
      this.configService.get<string>('MONGO_DB') ?? 'excell_backend';

    this.client = new MongoClient(uri, {
      // options can be added here
    });
    await this.client.connect();
    this.db = this.client.db(dbName);
  }

  getDatabase(): Db {
    if (!this.db) {
      throw new Error('Mongo database is not initialized');
    }
    return this.db;
  }

  getCollection<TSchema = any>(name: string) {
    return this.getDatabase().collection<TSchema>(name);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.close();
    }
  }
}
