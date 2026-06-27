import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(WorkerModule);
  const logger = new Logger('WorkerMain');
  logger.log('Worker application context initialized');
  return appContext;
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
