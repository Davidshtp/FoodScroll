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

  // Bind explicitly to IPv4 localhost.
  // This avoids cases where `localhost` resolves to IPv6 (::1) but some callers use 127.0.0.1.
  await app.listen(port, '127.0.0.1');
  logger.log(`Identity Service corriendo en http://localhost:${port} (solo accesible internamente)`);
}
bootstrap();
