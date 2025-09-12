import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongoModule } from './mongo/mongo.module';
import { FileModule } from './file/file.module';
import { LoggingModule } from './logging/logging.module';
import { BullmqModule } from './bullmq/bullmq.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BullmqModule,
    LoggingModule,
    MongoModule,
    FileModule,
  ],
})
export class AppModule {}
