import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// Modules
import { AuthModule } from './auth.module';
import { CodeModule } from './code.module';

// Controllers
import { AppController } from '../http/controllers/app.controller';

// Filters & Interceptors
import { DomainExceptionFilter } from '../http/filters/domain-exception.filter';
import { LoggingInterceptor } from '../http/interceptors/logging.interceptor';

// Guards
import { ServiceSecretGuard } from '../http/guards/service-secret.guard';

// Infrastructure
import { UserOrmEntity } from '../../infrastructure/persistence/typeorm/entities/user.orm-entity';
import { CodeOrmEntity } from '../../infrastructure/persistence/typeorm/entities/code.orm-entity';
import {DATABASE_HOST,DATABASE_PORT,DATABASE_USER,DATABASE_PASSWORD,DATABASE_NAME} from '../../infrastructure/config/constants';
import { AppStatusUpdatedConsumer } from '../../infrastructure/messaging/nats/app-status-updated.consumer';
import { SyncUserAppStatusUseCase } from '../../application/usecases/events/sync-user-app-status.usecase';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>(DATABASE_HOST) || 'localhost',
        port: Number(config.get<string>(DATABASE_PORT)) || 3306,
        username: config.get<string>(DATABASE_USER) || 'root',
        password: config.get<string>(DATABASE_PASSWORD) ?? 'default-password',
        database: config.get<string>(DATABASE_NAME) || 'identity-service',
        entities: [UserOrmEntity, CodeOrmEntity],
        synchronize: true,
        logging: false,
      }),
    }),
    AuthModule,
    CodeModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    { provide: APP_GUARD, useClass: ServiceSecretGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    SyncUserAppStatusUseCase,
    AppStatusUpdatedConsumer,
  ],
})
export class AppModule {}
