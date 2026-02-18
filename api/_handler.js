require('reflect-metadata'); // Must be first — NestJS decorators depend on this

const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const { ValidationPipe } = require('@nestjs/common');
const express = require('express');
const cookieParser = require('cookie-parser');

// Pre-load the compiled NestJS app (ncc bundles this at build time)
const { AppModule } = require('./backend-dist/src/app.module');

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
  // Strip /api prefix so NestJS routes match (e.g. /api/emails → /emails)
  req.url = req.url.replace(/^\/api/, '') || '/';
  server(req, res);
};
