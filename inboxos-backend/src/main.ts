import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.enableCors({
  origin: [
    process.env.FRONTEND_URL,      // your Vercel URL on Render
    'http://localhost:8080',       // local dev
  ].filter(Boolean),
  credentials: true,
});


  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
