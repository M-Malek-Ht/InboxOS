require('reflect-metadata');

const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const { ValidationPipe } = require('@nestjs/common');
const express = require('express');
const cookieParser = require('cookie-parser');

// References compiled dist checked into git so Vercel's NFT can trace it
const { AppModule } = require('../inboxos-backend/dist/app.module');

const server = express();
let app;

async function bootstrap() {
  if (app) return;
  const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(server));
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

module.exports = async function handler(req, res) {
  try {
    await bootstrap();
  } catch (err) {
    console.error('NestJS bootstrap failed:', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Bootstrap failed', message: err.message }));
    return;
  }
  req.url = req.url.replace(/^\/api/, '') || '/';
  server(req, res);
};
