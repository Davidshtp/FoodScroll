import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Controller
import { GoogleController } from '../http/controllers/google.controller';

// Use Case
import { GoogleLoginUseCase } from '../../application/usecases/auth/google-login.usecase';

// Adapter
import { GoogleOAuthAdapter } from '../../infrastructure/google/google-oauth.adapter';

// Ports / Symbols
import { GOOGLE_OAUTH } from '../../application/ports/google-oauth.port';

// AuthModule for shared providers
import { AuthModule } from './auth.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
  ],
  controllers: [GoogleController],
  providers: [
    GoogleLoginUseCase,
    {
      provide: GOOGLE_OAUTH,
      useClass: GoogleOAuthAdapter,
    },
  ],
})
export class GoogleModule {}
