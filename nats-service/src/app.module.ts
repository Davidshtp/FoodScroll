import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { NatsModule } from './nats/nats.module';
import { StreamService } from './stream/stream.service';
import { EventEmitterService } from './event-emitter/event-emitter.service';
import { EventsController } from './http/events.controller';
import { ServiceSecretGuard } from './http/guards/service-secret.guard';
import { JwtAuthGuard } from './http/guards/jwt-auth.guard';
import { JwtStrategy } from './http/strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    NatsModule,
  ],
  controllers: [EventsController],
  providers: [
    StreamService,
    EventEmitterService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: ServiceSecretGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [EventEmitterService],
})
export class AppModule {}
