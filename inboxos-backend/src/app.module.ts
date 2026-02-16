import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { EmailsModule } from './emails/emails.module';
import { TasksModule } from './tasks/tasks.module';
import { EventsModule } from './events/events.module';
import { DraftsModule } from './drafts/drafts.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get<string>('DB_HOST'),
        port: Number(cfg.get<string>('DB_PORT')),
        username: cfg.get<string>('DB_USER'),
        password: cfg.get<string>('DB_PASS'),
        database: cfg.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true, // dev only
        ssl: true,
        extra: { ssl: { rejectUnauthorized: false } },

      }),
    }),

    EmailsModule,

    TasksModule,

    EventsModule,

    DraftsModule,

    UsersModule,

    AuthModule,

    AiModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
