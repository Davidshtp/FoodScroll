import { Module } from '@nestjs/common';
import * as path from 'path';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { MulterModule } from '@nestjs/platform-express';
import { JwtStrategy } from './common/strategies/jwt.strategy';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { CorrelationInterceptor } from './common/interceptors/correlation.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AuthProxyModule } from './modules/auth-proxy/auth-proxy.module';
import { CodeProxyModule } from './modules/code-proxy/code-proxy.module';
import { HealthModule } from './modules/health/health.module';
import { LocationProxyModule } from './modules/location-proxy/location-proxy.module';
import { CustomerProxyModule } from './modules/customer-proxy/customer-proxy.module';
import { DeliveryProxyModule } from './modules/delivery-proxy/delivery-proxy.module';
import { RestaurantProxyModule } from './modules/restaurant-proxy/restaurant-proxy.module';
import { EngagementProxyModule } from './modules/engagement-proxy/engagement-proxy.module';
import { OrdersProxyModule } from './modules/orders-proxy/orders-proxy.module';
import { PublicationsProxyModule } from './modules/publications-proxy/publications-proxy.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(__dirname, '..', '.env'),
    }),

    PassportModule.register({ defaultStrategy: 'jwt' }),
    MulterModule.register({
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 60,
      },
    ]),

    InfrastructureModule,

    // ── Módulos proxy ──
    AuthProxyModule,
    CodeProxyModule,
    LocationProxyModule,
    CustomerProxyModule,
    DeliveryProxyModule,
    RestaurantProxyModule,
    EngagementProxyModule,
    OrdersProxyModule,
    PublicationsProxyModule,
    HealthModule,
  ],
  providers: [
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: CorrelationInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
