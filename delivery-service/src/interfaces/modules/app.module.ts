import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import {
  DATABASE_HOST,
  DATABASE_NAME,
  DATABASE_PASSWORD,
  DATABASE_PORT,
  DATABASE_USER,
  JWT_SECRET_KEY,
} from '../../config/constants';

import {
  DeliveryProfileOrmEntity,
  VehicleOrmEntity,
  VehicleSoatOrmEntity,
  VehicleTechnoOrmEntity,
} from '../../infrastructure/persistence/typeorm/entities';

import {
  TypeOrmDeliveryProfileRepository,
  TypeOrmVehicleRepository,
} from '../../infrastructure/persistence/typeorm/repositories';

import {
  DELIVERY_PROFILE_REPOSITORY,
  VEHICLE_REPOSITORY,
} from '../../domain/repositories';

import {
  RUNT_VERIFICATION_PORT,
  DELIVERY_IDENTITY_PORT,
} from '../../application/ports';

import { RuntVerificationAdapter } from '../../infrastructure/http/runt-verification.adapter';

import { IdentityServiceClient } from '../../infrastructure/http/identity-service.client';

import {
  CreateDeliveryProfileUseCase,
  GetDeliveryProfileUseCase,
  UpdateDeliveryProfileUseCase,
} from '../../application/usecases/delivery-profile';

import {
  RegisterVehicleUseCase,
  GetVehicleUseCase,
  ResolveCaptchaUseCase,
  DeleteVehicleUseCase,
} from '../../application/usecases/vehicle';

import {
  DeliveryProfileController,
  VehicleController,
} from '../http/controllers';

import { ServiceSecretGuard, JwtAuthGuard } from '../http/guards';
import { LoggingInterceptor } from '../http/interceptors/logging.interceptor';
import { JwtStrategy } from '../http/strategies';
import { DomainExceptionFilter } from '../http/filters/domain-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>(JWT_SECRET_KEY);
        if (!secret) {
          throw new Error('JWT_SECRET_KEY is not configured');
        }
        return {
          secret,
          signOptions: { expiresIn: '1h' },
        };
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>(DATABASE_HOST),
        port: Number(config.get<string>(DATABASE_PORT)),
        username: config.get<string>(DATABASE_USER),
        password: config.get<string>(DATABASE_PASSWORD),
        database: config.get<string>(DATABASE_NAME),
        entities: [
          DeliveryProfileOrmEntity,
          VehicleOrmEntity,
          VehicleSoatOrmEntity,
          VehicleTechnoOrmEntity,
        ],
        synchronize: true,
        logging: false,
      }),
    }),
    TypeOrmModule.forFeature([
      DeliveryProfileOrmEntity,
      VehicleOrmEntity,
      VehicleSoatOrmEntity,
      VehicleTechnoOrmEntity,
    ]),
  ],
  controllers: [DeliveryProfileController, VehicleController],
  providers: [
    {
      provide: DELIVERY_PROFILE_REPOSITORY,
      useClass: TypeOrmDeliveryProfileRepository,
    },
    {
      provide: VEHICLE_REPOSITORY,
      useClass: TypeOrmVehicleRepository,
    },
    {
      provide: RUNT_VERIFICATION_PORT,
      useClass: RuntVerificationAdapter,
    },
    {
      provide: DELIVERY_IDENTITY_PORT,
      useClass: IdentityServiceClient,
    },
    CreateDeliveryProfileUseCase,
    GetDeliveryProfileUseCase,
    UpdateDeliveryProfileUseCase,
    RegisterVehicleUseCase,
    GetVehicleUseCase,
    ResolveCaptchaUseCase,
    DeleteVehicleUseCase,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: ServiceSecretGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
  ],
})
export class AppModule {}
