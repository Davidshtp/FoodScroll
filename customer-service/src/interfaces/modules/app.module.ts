import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

// Infrastructure - Config
import { DATABASE_HOST, DATABASE_NAME, DATABASE_PASSWORD, DATABASE_PORT, DATABASE_USER, JWT_SECRET_KEY } from '../../infrastructure/config/constants';

// Infrastructure - ORM Entities
import { CustomerProfileOrmEntity } from '../../infrastructure/persistence/typeorm/entities/customer-profile.orm-entity';
import { AddressOrmEntity } from '../../infrastructure/persistence/typeorm/entities/address.orm-entity';

// Infrastructure - Repositories
import { TypeOrmCustomerProfileRepository } from '../../infrastructure/persistence/typeorm/repositories/typeorm-customer-profile.repository';
import { TypeOrmAddressRepository } from '../../infrastructure/persistence/typeorm/repositories/typeorm-address.repository';
import { NatsServiceEventsPublisher } from '../../infrastructure/messaging/nats/nats-service-events.publisher';

// Domain - Repository tokens
import { CUSTOMER_PROFILE_REPOSITORY } from '../../domain/repositories/customer-profile.repository';
import { ADDRESS_REPOSITORY } from '../../domain/repositories/address.repository';
import { APP_STATUS_EVENTS_PUBLISHER } from '../../application/ports/customer-events.port';

// Application - Use Cases (Customer Profile)
import { CreateCustomerProfileUseCase } from '../../application/usecases/customer-profile/create-customer-profile.usecase';
import { GetCustomerProfileUseCase } from '../../application/usecases/customer-profile/get-customer-profile.usecase';
import { UpdateCustomerProfileUseCase } from '../../application/usecases/customer-profile/update-customer-profile.usecase';

// Application - Use Cases (Address)
import { CreateAddressUseCase } from '../../application/usecases/address/create-address.usecase';
import { GetAddressesUseCase } from '../../application/usecases/address/get-addresses.usecase';
import { UpdateAddressUseCase } from '../../application/usecases/address/update-address.usecase';
import { DeleteAddressUseCase } from '../../application/usecases/address/delete-address.usecase';

// Interfaces - Controllers
import { AppController } from '../http/controllers/app.controller';
import { CustomerProfileController } from '../http/controllers/customer-profile.controller';
import { AddressController } from '../http/controllers/address.controller';

// Interfaces - Guards, Interceptors, Filters, Strategies
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
        type: 'mysql',
        host: config.get<string>(DATABASE_HOST),
        port: Number(config.get<string>(DATABASE_PORT)),
        username: config.get<string>(DATABASE_USER),
        password: config.get<string>(DATABASE_PASSWORD),
        database: config.get<string>(DATABASE_NAME),
        entities: [CustomerProfileOrmEntity, AddressOrmEntity],
        synchronize: true,
        logging: false,
      }),
    }),
    TypeOrmModule.forFeature([CustomerProfileOrmEntity, AddressOrmEntity]),
  ],
  controllers: [AppController, CustomerProfileController, AddressController],
  providers: [
    // ───── Repositories ─────
    {
      provide: CUSTOMER_PROFILE_REPOSITORY,
      useClass: TypeOrmCustomerProfileRepository,
    },
    {
      provide: ADDRESS_REPOSITORY,
      useClass: TypeOrmAddressRepository,
    },
    {
      provide: APP_STATUS_EVENTS_PUBLISHER,
      useClass: NatsServiceEventsPublisher,
    },

    // ───── Use Cases (Customer Profile) ─────
    CreateCustomerProfileUseCase,
    GetCustomerProfileUseCase,
    UpdateCustomerProfileUseCase,

    // ───── Use Cases (Address) ─────
    CreateAddressUseCase,
    GetAddressesUseCase,
    UpdateAddressUseCase,
    DeleteAddressUseCase,

    // ───── Strategies ─────
    JwtStrategy,

    // ───── Global Guards ─────
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ServiceSecretGuard,
    },

    // ───── Global Interceptors ─────
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },

    // ───── Global Filters ─────
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
  ],
})
export class AppModule { }
