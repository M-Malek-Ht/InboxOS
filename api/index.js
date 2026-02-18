const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const { ValidationPipe } = require('@nestjs/common');
const express = require('express');
const cookieParser = require('cookie-parser');

const server = express();
let app;

async function bootstrap() {
  if (app) return;

  // Import the pre-compiled NestJS app from the backend's dist/ output
  const { AppModule } = require('../inboxos-backend/dist/src/app.module');

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

module.exports = async function handler(req, res) {
  await bootstrap();
  // Strip /api prefix so NestJS routes match (e.g. /api/emails → /emails)
  req.url = req.url.replace(/^\/api/, '') || '/';
  server(req, res);
};
