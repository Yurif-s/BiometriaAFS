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

  // Origem do site onde a extensão é injetada
  const seducOrigin = 'https://professor.seduc.ce.gov.br';
  if (!allowedOrigins.includes(seducOrigin)) {
    allowedOrigins.push(seducOrigin);
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sem origin (ex: extensões, curl, mobile)
      if (!origin) {
        return callback(null, true);
      }
      // Permitir chrome-extension:// origins
      if (origin.startsWith('chrome-extension://')) {
        return callback(null, true);
      }
      // Verificar lista de origens permitidas
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`Origin ${origin} não permitida pelo CORS`));
    },
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();