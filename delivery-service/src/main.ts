import { NestFactory } from '@nestjs/core';
import { AppModule } from './interfaces/modules/app.module';
import { ConfigService } from '@nestjs/config';
import { SERVER_PORT } from './config/constants';
import { ValidationPipe, Logger } from '@nestjs/common';
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('delivery-service');

  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });

  app.use(cookieParser());

  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = configService.get<number>(SERVER_PORT) || 5563;

  await app.listen(port);
  logger.log(
    `Delivery Service corriendo en http://localhost:${port} (solo accesible internamente)`,
  );
}
bootstrap();
