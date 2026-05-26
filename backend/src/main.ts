// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { ValidationPipe } from '@nestjs/common';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
    : ['http://localhost:5173'];

  // Sempre incluir a URL do Vercel em produção
  const vercelUrlWithHyphen = 'https://biometria-afs.vercel.app';
  const vercelUrlNoHyphen = 'https://biometriaafs.vercel.app';
  if (!allowedOrigins.includes(vercelUrlWithHyphen)) {
    allowedOrigins.push(vercelUrlWithHyphen);
  }
  if (!allowedOrigins.includes(vercelUrlNoHyphen)) {
    allowedOrigins.push(vercelUrlNoHyphen);
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();