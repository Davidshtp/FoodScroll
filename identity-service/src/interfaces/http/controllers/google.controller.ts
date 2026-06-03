import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { GoogleLoginUseCase } from '../../../application/usecases/auth/google-login.usecase';
import { GoogleLoginDto } from '../dtos/auth.dto';
import { ClientApp } from '../../../domain/value-objects/client-app.vo';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false,
  sameSite: 'strict' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

@Controller('auth')
export class GoogleController {
  constructor(
    private readonly googleLoginUseCase: GoogleLoginUseCase,
  ) {}

  @Post('google')
  async googleLogin(
    @Body() dto: GoogleLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.googleLoginUseCase.execute({
      idToken: dto.idToken,
      client: dto.client,
    });

    if (dto.client === ClientApp.RESTAURANT) {
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);
      return {
        access_token: result.accessToken,
        user: result.user,
        isNewUser: result.isNewUser,
      };
    }

    return {
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      user: result.user,
      isNewUser: result.isNewUser,
    };
  }
}
