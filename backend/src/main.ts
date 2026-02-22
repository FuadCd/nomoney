import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => callback(null, true),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // Trust first proxy so req.ip / X-Forwarded-For reflect the real client IP when behind dev proxy or load balancer
  app.set('trust proxy', 1);

  const port = process.env.PORT ?? 3002;
  await app.listen(port);
  console.log(`AccessER API running at http://localhost:${port}/api`);
}
bootstrap();
