import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Controllers
import { AuthController } from '../http/controllers/auth.controller';

// Use Cases
import { RegisterUseCase } from '../../application/usecases/auth/register.usecase';
import { LoginUseCase } from '../../application/usecases/auth/login.usecase';
import { RefreshTokenUseCase } from '../../application/usecases/auth/refresh-token.usecase';
import { LogoutUseCase } from '../../application/usecases/auth/logout.usecase';

// Infrastructure
import { UserOrmEntity } from '../../infrastructure/persistence/typeorm/entities/user.orm-entity';
import { TypeOrmUserRepository } from '../../infrastructure/persistence/typeorm/repositories/typeorm-user.repository';
import { BcryptPasswordHasher } from '../../infrastructure/security/bcrypt-password-hasher';
import { JwtTokenGenerator } from '../../infrastructure/security/jwt-token-generator';

// Domain Symbols
import { USER_REPOSITORY } from '../../domain/repositories/user.repository';
import { PASSWORD_HASHER } from '../../domain/services/password-hasher';
import { TOKEN_GENERATOR } from '../../application/ports/token-generator.port';

// Strategies & Guards
import { JwtStrategy } from '../http/strategies/jwt.strategy';
import { JwtAuthGuard } from '../http/guards/jwt-auth.guard';
import { RolesGuard } from '../http/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity]),
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET_KEY');
        if (!secret) {
          throw new Error('JWT_SECRET_KEY is not configured');
        }
        return { secret };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Use Cases
    RegisterUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,

    // Repositories
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },

    // Domain Services
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },

    // Ports
    { provide: TOKEN_GENERATOR, useClass: JwtTokenGenerator },

    // Strategies & Guards
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    USER_REPOSITORY,
    PASSWORD_HASHER,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
