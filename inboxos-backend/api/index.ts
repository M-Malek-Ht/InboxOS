import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';

const server = express();
let app: any;

async function bootstrap() {
  if (app) return;
  const nestApp = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
  );
  nestApp.use(cookieParser());
  nestApp.enableCors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:8080'].filter(Boolean),
    credentials: true,
  });
  nestApp.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  await nestApp.init();
  app = nestApp;
}

export default async function handler(req: any, res: any) {
  await bootstrap();
  server(req, res);
}
