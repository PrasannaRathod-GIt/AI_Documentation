import * as dotenv from 'dotenv';
dotenv.config({
  path: '../../.env'
});
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  app.setGlobalPrefix('api');
  await app.listen(3333);
}
bootstrap();
