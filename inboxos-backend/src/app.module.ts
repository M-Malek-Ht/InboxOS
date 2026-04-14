import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { HealthController } from './health.controller';
import { EmailsModule } from './emails/emails.module';
import { DraftsModule } from './drafts/drafts.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AiModule } from './ai/ai.module';
import { JobsModule } from './jobs/jobs.module';
import { SettingsModule } from './settings/settings.module';

function isEnvFlagEnabled(value: string | undefined, fallback: boolean): boolean {
  return value ? value.toLowerCase() === 'true' : fallback;
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const isProduction = cfg.get<string>('NODE_ENV') === 'production';
        const synchronize = isEnvFlagEnabled(
          cfg.get<string>('DB_SYNC'),
          !isProduction,
        );
        const useSsl = isEnvFlagEnabled(
          cfg.get<string>('DB_SSL'),
          isProduction,
        );
        const dbPort = Number(cfg.get<string>('DB_PORT') ?? 5432);
        const dbPoolMax = Number(cfg.get<string>('DB_POOL_MAX') ?? 10);

        return {
          type: 'postgres',
          host: cfg.get<string>('DB_HOST'),
          port: Number.isFinite(dbPort) ? dbPort : 5432,
          username: cfg.get<string>('DB_USER'),
          password: cfg.get<string>('DB_PASS'),
          database: cfg.get<string>('DB_NAME'),
          autoLoadEntities: true,
          synchronize,
          migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
          migrationsRun: true,
          ssl: useSsl ? { rejectUnauthorized: false } : false,
          extra: {
            max: Number.isFinite(dbPoolMax) ? dbPoolMax : 10,
            keepAlive: true,
          },
        };
      },
    }),

    EmailsModule,

    DraftsModule,

    UsersModule,

    AuthModule,

    AiModule,

    JobsModule,

    SettingsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
