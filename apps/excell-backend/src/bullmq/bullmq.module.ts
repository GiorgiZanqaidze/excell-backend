import { Module } from '@nestjs/common';
import type { ModuleMetadata } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL');
        const host = config.get<string>('REDIS_HOST') || 'localhost';
        const port = Number(config.get<string>('REDIS_PORT') || 6379);
        const password = config.get<string>('REDIS_PASSWORD') || undefined;
        return {
          connection: url
            ? { url }
            : {
                host,
                port,
                password,
              },
        };
      },
    }),
  ] as ModuleMetadata['imports'],
})
export class BullmqModule {}
