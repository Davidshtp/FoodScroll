import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
const cookieParser = require('cookie-parser');
import { GATEWAY_PORT } from './config/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Gateway');

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const port = configService.get<number>(GATEWAY_PORT) || 3000;
  await app.listen(port);
  logger.log(`Gateway corriendo en http://localhost:${port}/api`);
}
bootstrap();
