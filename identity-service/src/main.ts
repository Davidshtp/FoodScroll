import { NestFactory } from '@nestjs/core';
import { AppModule } from './interfaces/modules/app.module';
import { ConfigService } from '@nestjs/config';
import { SERVER_PORT } from './infrastructure/config/constants';
import { ValidationPipe, Logger } from '@nestjs/common';
const cookieParser = require('cookie-parser');


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('IdentityService');

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  });

  // parse cookies
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );


  const port = configService.get<number>(SERVER_PORT) || 5560;

  // Bind to all interfaces for Docker container communication.
  await app.listen(port, '0.0.0.0');
  logger.log(`Identity Service corriendo en http://localhost:${port} (solo accesible internamente)`);
}
bootstrap();
