import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

// Controllers
import { CodeController } from '../http/controllers/code.controller';

// Use Cases
import { GenerateCodeUseCase } from '../../application/usecases/code/generate-code.usecase';
import { VerifyEmailCodeUseCase } from '../../application/usecases/code/verify-email-code.usecase';
import { VerifyResetCodeUseCase } from '../../application/usecases/code/verify-reset-code.usecase';

// Infrastructure
import { CodeOrmEntity } from '../../infrastructure/persistence/typeorm/entities/code.orm-entity';
import { TypeOrmCodeRepository } from '../../infrastructure/persistence/typeorm/repositories/typeorm-code.repository';
import { BrevoEmailAdapter } from '../../infrastructure/email/brevo-email.adapter';

// Domain Symbols
import { CODE_REPOSITORY } from '../../domain/repositories/code.repository';
import { EMAIL_SENDER } from '../../application/ports/email-sender.port';

// Auth Module for User Repository
import { AuthModule } from './auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CodeOrmEntity]),
    ConfigModule,
    ScheduleModule.forRoot(),
    AuthModule,
  ],
  controllers: [CodeController],
  providers: [
    // Use Cases
    GenerateCodeUseCase,
    VerifyEmailCodeUseCase,
    VerifyResetCodeUseCase,

    // Repositories
    { provide: CODE_REPOSITORY, useClass: TypeOrmCodeRepository },

    // Ports
    { provide: EMAIL_SENDER, useClass: BrevoEmailAdapter },
  ],
  exports: [CODE_REPOSITORY],
})
export class CodeModule {}
