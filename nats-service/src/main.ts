import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NATS_SERVICE_PORT, SERVER_PORT } from './config/constants';


async function bootstrap() {
  const logger = new Logger('NatsService');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = Number(configService.get<string>(NATS_SERVICE_PORT) ?? 5590 );

  await app.listen(port, 'localhost');
  logger.log(`NATS service corriendo en http://localhost:${port}`);

  process.on('SIGINT', async () => {
    logger.log('Shutting down NATS service');
    await app.close();
    process.exit(0);
  });
}

bootstrap();
