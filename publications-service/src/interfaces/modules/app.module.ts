import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
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

import { HttpModule } from '@nestjs/axios';
import { RestaurantClientService } from '../../infrastructure/http/restaurant-client.service';

import { PublicationMongoRepository } from '../../infrastructure/persistence/mongodb/publication.repository';
import { PublicationSchema } from '../../infrastructure/database/publication.schema';

import { PUBLICATION_REPOSITORY } from '../../domain/repositories';

import { CreatePublicationUseCase } from '../../application/usecases/create-publication.usecase';
import { GetPublicationUseCase } from '../../application/usecases/get-publication.usecase';
import { GetPublicationsByRestaurantUseCase } from '../../application/usecases/get-publications-by-restaurant.usecase';
import { UpdatePublicationUseCase } from '../../application/usecases/update-publication.usecase';
import { DeletePublicationUseCase } from '../../application/usecases/delete-publication.usecase';

import { CloudinaryService } from '../../infrastructure/cloudinary/cloudinary.service';

import { PublicationController } from '../http/controllers/publication.controller';

import { ServiceSecretGuard, JwtAuthGuard } from '../http/guards';
import { LoggingInterceptor } from '../../interceptors/logging.interceptor';
import { DomainExceptionFilter } from '../http/filters/domain-exception.filter';
import { AllExceptionsFilter } from '../http/filters/all-exceptions.filter';
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
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: `mongodb://${config.get<string>(DATABASE_HOST)}:${config.get<string>(DATABASE_PORT)}/${config.get<string>(DATABASE_NAME)}`,
      }),
    }),
    MongooseModule.forFeature([
      { name: 'Publication', schema: PublicationSchema },
    ]),
    HttpModule,
  ],
  controllers: [
    PublicationController,
  ],
  providers: [
    {
      provide: PUBLICATION_REPOSITORY,
      useClass: PublicationMongoRepository,
    },
    CreatePublicationUseCase,
    GetPublicationUseCase,
    GetPublicationsByRestaurantUseCase,
    UpdatePublicationUseCase,
    DeletePublicationUseCase,
    RestaurantClientService,
    CloudinaryService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ServiceSecretGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
  ],
})
export class AppModule {}