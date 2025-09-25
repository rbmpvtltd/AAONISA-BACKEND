// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { join } from 'path';

function isPrivateHost(hostname: string) {
  if (!hostname) return false;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;

  const parts = hostname.split('.');
  if (parts.length !== 4) return false;

  const [a, b] = parts.map(p => Number(p));
  if (Number.isNaN(a) || Number.isNaN(b)) return false;

  if (a === 10) return true;

  if (a === 172 && b >= 16 && b <= 31) return true;

  if (a === 192 && b === 168) return true;

  return false;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      try {
        const url = new URL(origin);
        const hostname = url.hostname;
        if (isPrivateHost(hostname)) {
          return callback(null, true);
        }

        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'), false);
      } catch (err) {
        return callback(new Error('Not allowed by CORS'), false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  app.use('/uploads', express.static(join(process.cwd(), 'src', 'uploads')));
  app.use(cookieParser());
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Demo API')
    .setDescription('API documentation for Demo project')
    .setVersion('1.0')
    .addTag('Demo')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('api', app, document);
  }

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
