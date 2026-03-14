import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('NatsService');
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.NATS_SERVICE_PORT ?? 5590);

  await app.listen(port, 'localhost');
  logger.log(`NATS service corriendo en http://localhost:${port}`);

  process.on('SIGINT', async () => {
    logger.log('Shutting down NATS service');
    await app.close();
    process.exit(0);
  });
}

bootstrap();
