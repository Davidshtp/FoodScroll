import {Controller,Post,Get,Req,Res,Body,} from '@nestjs/common';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { HttpClientService } from '../../infrastructure/http/http-client.service';
import { ProxyService } from '../../infrastructure/http/proxy.service';

@Controller('auth')
export class AuthProxyController {
  constructor(
    private readonly httpClient: HttpClientService,
    private readonly proxy: ProxyService,
  ) {}

  // ───── Endpoints públicos (sin JWT) ─────

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('register')
  async register(@Body() body: any, @Req() req: Request) {
    const result = await this.proxy.forwardPublic(req, {
      method: 'POST',
      service: 'IDENTITY',
      path: '/auth/register',
      body,
    });
    return result.data;
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('login')
  async login(
    @Body() body: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.proxy.forwardPublic(req, {
      method: 'POST',
      service: 'IDENTITY',
      path: '/auth/login',
      body,
    });

    // Reenviar Set-Cookie (refresh token para restaurant client)
    if (result.setCookieHeaders?.length) {
      res.setHeader('Set-Cookie', result.setCookieHeaders);
    }

    return result.data;
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Body() body: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.proxy.forwardPublic(req, {
      method: 'POST',
      service: 'IDENTITY',
      path: '/auth/refresh',
      body,
      cookies: req.headers.cookie,
    });

    // Reenviar Set-Cookie (rotación de refresh token)
    if (result.setCookieHeaders?.length) {
      res.setHeader('Set-Cookie', result.setCookieHeaders);
    }

    return result.data;
  }

  // ───── Endpoints protegidos (requieren JWT) ─────

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'IDENTITY',
      path: '/auth/logout',
      cookies: req.headers.cookie,
    });

    // Reenviar Set-Cookie (limpiar cookie de refresh token)
    if (result.setCookieHeaders?.length) {
      res.setHeader('Set-Cookie', result.setCookieHeaders);
    }

    return result.data;
  }

  @Get('me')
  async me(@Req() req: Request, @CurrentUser() user: any) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'IDENTITY',
      path: '/auth/me',
    });
    return result.data;
  }
}
