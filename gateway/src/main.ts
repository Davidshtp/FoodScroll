import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as httpProxy from 'http-proxy';
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
import { GATEWAY_PORT, ORDERS_SERVICE_URL } from './config/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Gateway');

  app.enableCors({
    origin: true,
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

  app.setGlobalPrefix('api');

  const port = configService.get<number>(GATEWAY_PORT) || 3000;
  await app.listen(port);

  const wsProxy = httpProxy.createProxyServer({
    target: configService.get<string>(ORDERS_SERVICE_URL, 'http://localhost:5567'),
    ws: true,
  });

  const server = app.getHttpServer();
  server.on('upgrade', (req, socket, head) => {
    if (req.url?.startsWith('/socket.io')) {
      wsProxy.ws(req, socket, head);
    } else {
      socket.destroy();
    }
  });

  logger.log(`Gateway corriendo en http://localhost:${port}/api`);
}
bootstrap();
