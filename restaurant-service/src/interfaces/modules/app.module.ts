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
} from '../../infrastructure/config/constants';

import {
  RestaurantOrmEntity,
  RestaurantAddressOrmEntity,
  RestaurantOpeningHoursOrmEntity,
} from '../../infrastructure/persistence/typeorm/entities';

import {
  TypeOrmRestaurantRepository,
} from '../../infrastructure/persistence/typeorm/repositories';

import {
  RESTAURANT_REPOSITORY,
} from '../../domain/repositories';

import {
  CreateRestaurantUseCase,
  GetRestaurantUseCase,
  UpdateRestaurantUseCase,
  UpdateRestaurantAddressUseCase,
  GetRestaurantAddressUseCase,
  UpsertRestaurantOpeningHoursUseCase,
  GetRestaurantOpeningHoursUseCase,
  DeleteRestaurantUseCase,
  UploadLogoUseCase,
  UploadBannerUseCase,
  DeleteLogoUseCase,
  DeleteBannerUseCase,
  GetNearbyRestaurantsUseCase,
} from '../../application/usecases/restaurant';

import { IdentityServiceClient } from '../../infrastructure/http/identity-service.client';
import { RESTAURANT_IDENTITY_PORT } from '../../application/ports/restaurant-identity.port';
import { RestaurantOnboardingCalculator } from '../../application/services/restaurant-onboarding-calculator.service';
import { CloudinaryService } from '../../infrastructure/cloudinary/cloudinary.service';

import { RestaurantController } from '../http/controllers/restaurant.controller';
import { RestaurantAddressController } from '../http/controllers/restaurant-address.controller';
import { RestaurantOpeningHoursController } from '../http/controllers/restaurant-opening-hours.controller';
import { RestaurantInternalController } from '../http/controllers/restaurant-internal.controller';
import { RestaurantNearbyController } from '../http/controllers/restaurant-nearby.controller';

import { ServiceSecretGuard, JwtAuthGuard } from '../http/guards';
import { LoggingInterceptor } from '../http/interceptors/logging.interceptor';
import { DomainExceptionFilter } from '../http/filters/domain-exception.filter';
import { JwtStrategy } from '../http/strategies';

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
        type: 'postgres',
        host: config.get<string>(DATABASE_HOST),
        port: Number(config.get<string>(DATABASE_PORT)),
        username: config.get<string>(DATABASE_USER),
        password: config.get<string>(DATABASE_PASSWORD),
        database: config.get<string>(DATABASE_NAME),
        entities: [
          RestaurantOrmEntity,
          RestaurantAddressOrmEntity,
          RestaurantOpeningHoursOrmEntity,
        ],
        synchronize: true,
        logging: false,
      }),
    }),
    TypeOrmModule.forFeature([
      RestaurantOrmEntity,
      RestaurantAddressOrmEntity,
      RestaurantOpeningHoursOrmEntity,
    ]),
  ],
  controllers: [
    RestaurantController,
    RestaurantAddressController,
    RestaurantOpeningHoursController,
    RestaurantInternalController,
    RestaurantNearbyController,
  ],
  providers: [
    {
      provide: RESTAURANT_REPOSITORY,
      useClass: TypeOrmRestaurantRepository,
    },
    {
      provide: RESTAURANT_IDENTITY_PORT,
      useClass: IdentityServiceClient,
    },
    CreateRestaurantUseCase,
    GetRestaurantUseCase,
    UpdateRestaurantUseCase,
    UpdateRestaurantAddressUseCase,
    GetRestaurantAddressUseCase,
    UpsertRestaurantOpeningHoursUseCase,
    GetRestaurantOpeningHoursUseCase,
    DeleteRestaurantUseCase,
    UploadLogoUseCase,
    UploadBannerUseCase,
    DeleteLogoUseCase,
    DeleteBannerUseCase,
    GetNearbyRestaurantsUseCase,
    RestaurantOnboardingCalculator,
    CloudinaryService,
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
