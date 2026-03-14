import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

// Infrastructure - Config
import {DATABASE_HOST,DATABASE_NAME,DATABASE_PASSWORD,DATABASE_PORT,DATABASE_USER, JWT_SECRET_KEY} from '../../infrastructure/config/constants';

// Infrastructure - ORM Entities
import { DepartmentOrmEntity } from '../../infrastructure/persistence/typeorm/entities/department.orm-entity';
import { CityOrmEntity } from '../../infrastructure/persistence/typeorm/entities/city.orm-entity';

// Infrastructure - Repositories
import { TypeOrmDepartmentRepository } from '../../infrastructure/persistence/typeorm/repositories/typeorm-department.repository';
import { TypeOrmCityRepository } from '../../infrastructure/persistence/typeorm/repositories/typeorm-city.repository';

// Domain - Repository tokens
import { DEPARTMENT_REPOSITORY } from '../../domain/repositories/department.repository';
import { CITY_REPOSITORY } from '../../domain/repositories/city.repository';

// Application - Use Cases
import { GetAllDepartmentsUseCase } from '../../application/usecases/department/get-all-departments.usecase';
import { CreateDepartmentUseCase } from '../../application/usecases/department/create-department.usecase';
import { GetCityByIdUseCase } from '../../application/usecases/city/get-city-by-id.usecase';
import { GetCitiesByDepartmentUseCase } from '../../application/usecases/city/get-cities-by-department.usecase';
import { CreateCityUseCase } from '../../application/usecases/city/create-city.usecase';
import { SeedLocationsUseCase } from '../../application/usecases/seed/seed-locations.usecase';
import { ReverseGeocodeUseCase } from '../../application/usecases/geocode/reverse-geocode.usecase';

// Application - Port tokens
import { GEOCODING_SERVICE_PORT } from '../../application/ports/geocoding-service.port';

// Infrastructure - Adapters
import { NominatimGeocodingAdapter } from '../../infrastructure/http/nominatim-geocoding.adapter';

// Interfaces - Controllers
import { DepartmentController } from '../http/controllers/department.controller';
import { CityController } from '../http/controllers/city.controller';
import { GeocodeController } from '../http/controllers/geocode.controller';

// Interfaces - Guards, Interceptors, Filters, Strategies
import { ServiceSecretGuard, JwtAuthGuard } from '../http/guards';
import { LoggingInterceptor } from '../http/interceptors/logging.interceptor';
import { DomainExceptionFilter } from '../http/filters/domain-exception.filter';
import { JwtStrategy } from '../http/strategies';

// Seed Runner
import { SeedRunner } from './seed-runner';

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
        entities: [DepartmentOrmEntity, CityOrmEntity],
        synchronize: true,
        logging: false,
      }),
    }),
    TypeOrmModule.forFeature([DepartmentOrmEntity, CityOrmEntity]),
  ],
  controllers: [DepartmentController, CityController, GeocodeController],
  providers: [
    // ───── Repositories ─────
    {
      provide: DEPARTMENT_REPOSITORY,
      useClass: TypeOrmDepartmentRepository,
    },
    {
      provide: CITY_REPOSITORY,
      useClass: TypeOrmCityRepository,
    },

    // ───── Use Cases ─────
    GetAllDepartmentsUseCase,
    CreateDepartmentUseCase,
    GetCityByIdUseCase,
    GetCitiesByDepartmentUseCase,
    CreateCityUseCase,
    SeedLocationsUseCase,
    ReverseGeocodeUseCase,

    // ───── Ports (External Services) ─────
    {
      provide: GEOCODING_SERVICE_PORT,
      useClass: NominatimGeocodingAdapter,
    },

    // ───── Seed Runner ─────
    SeedRunner,

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
export class AppModule {}
