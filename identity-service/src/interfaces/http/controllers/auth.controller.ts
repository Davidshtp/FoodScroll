import {Controller,Post,Body,Get,Request,UseGuards,Res} from '@nestjs/common';
import { Response } from 'express';
import { RegisterUseCase } from '../../../application/usecases/auth/register.usecase';
import { LoginUseCase } from '../../../application/usecases/auth/login.usecase';
import { RefreshTokenUseCase } from '../../../application/usecases/auth/refresh-token.usecase';
import { LogoutUseCase } from '../../../application/usecases/auth/logout.usecase';
import { RegisterDto, LoginDto } from '../dtos/auth.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ClientApp } from '../../../domain/value-objects/client-app.vo';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false,
  sameSite: 'strict' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.registerUseCase.execute({
      email: dto.email,
      password: dto.password,
      client: dto.client,
    });
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.loginUseCase.execute({
      email: dto.email,
      password: dto.password,
      client: dto.client,
    });

    const welcome = `Bienvenido a la aplicación. Usted inició sesión como ${dto.client}.`;

    // For restaurant client, use HTTP-only cookie for refresh token
    if (dto.client === ClientApp.RESTAURANT) {
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);
      return {
        access_token: result.accessToken,
        user: result.user,
        welcome,
      };
    }

    return {
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      user: result.user,
      welcome,
    };
  }

  @Post('refresh')
  async refresh(
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken =
      req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refresh_token;

    if (!refreshToken) {
      return { error: 'No refresh token' };
    }

    const result = await this.refreshTokenUseCase.execute({
      refreshToken,
    });

    // If using cookie, update it
    if (req.cookies?.[REFRESH_COOKIE_NAME]) {
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);
      return {
        access_token: result.accessToken,
        user: result.user,
      };
    }

    return {
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      user: result.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user?.id;
    
    if (userId) {
      await this.logoutUseCase.execute({ userId });
    }

    res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
    return { loggedOut: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req) {
    return req.user;
  }
}
