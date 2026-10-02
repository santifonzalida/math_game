import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Behind Railway's proxy: take the client IP from X-Forwarded-For, so rate limits
  // apply per player instead of to everyone at once.
  app.set('trust proxy', 1);
  const logger = new Logger('CORS');

  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  logger.log(`Allowed origins: ${allowedOrigins.join(', ')}`);

  app.enableCors({
    origin: (origin, callback) => {
      // No Origin header: same-origin requests, curl, Postman.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      logger.warn(
        `Blocked request from origin "${origin}". Add it to CORS_ORIGIN in .env to allow it.`,
      );
      // Rejecting without an error omits the CORS headers, so the browser blocks the response.
      callback(null, false);
    },
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
