import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const express = require('express');

const server = express();
let app: any;

async function bootstrap() {
  if (app) return;
  const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(server));
  nestApp.use(cookieParser());
  nestApp.enableCors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:8080'].filter(Boolean),
    credentials: true,
  });
  nestApp.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await nestApp.init();
  app = nestApp;
}

export default async function handler(req: any, res: any) {
  try {
    await bootstrap();
  } catch (err: any) {
    console.error('NestJS bootstrap failed:', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Bootstrap failed', message: err.message }));
    return;
  }
  req.url = req.url.replace(/^\/api/, '') || '/';
  server(req, res);
}
