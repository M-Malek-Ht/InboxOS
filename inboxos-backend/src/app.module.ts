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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const isProduction = cfg.get<string>('NODE_ENV') === 'production';
        const dbSyncRaw = cfg.get<string>('DB_SYNC');
        const dbSslRaw = cfg.get<string>('DB_SSL');

        const synchronize = dbSyncRaw
          ? dbSyncRaw.toLowerCase() === 'true'
          : !isProduction;
        const useSsl = dbSslRaw
          ? dbSslRaw.toLowerCase() === 'true'
          : isProduction;

        return {
          type: 'postgres',
          host: cfg.get<string>('DB_HOST'),
          port: Number(cfg.get<string>('DB_PORT')),
          username: cfg.get<string>('DB_USER'),
          password: cfg.get<string>('DB_PASS'),
          database: cfg.get<string>('DB_NAME'),
          autoLoadEntities: true,
          synchronize,
          migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
          migrationsRun: true,
          ssl: useSsl ? { rejectUnauthorized: false } : false,
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
