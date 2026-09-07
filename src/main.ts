import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api'); // ทำให้ทุก endpoint ขึ้นต้นด้วย /api
  await app.listen(3000);
}
bootstrap();