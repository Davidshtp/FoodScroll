import { Controller, Post, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { HttpClientService } from '../../infrastructure/http/http-client.service';
import { ProxyService } from '../../infrastructure/http/proxy.service';

/**
 * Proxy de códigos (reset password, confirm email).
 * Reenvía las peticiones al identity service.
 * NO contiene lógica de negocio.
 */
@Controller('code')
export class CodeProxyController {
  constructor(
    private readonly httpClient: HttpClientService,
    private readonly proxy: ProxyService,
  ) {}

  // ───── Endpoints públicos (sin JWT) ─────

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post('request-reset-code')
  async requestResetCode(@Body() body: any, @Req() req: Request) {
    const result = await this.proxy.forwardPublic(req, {
      method: 'POST',
      service: 'IDENTITY',
      path: '/code/request-reset-code',
      body,
    });
    return result.data;
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('verify-reset-code')
  async verifyResetCode(@Body() body: any, @Req() req: Request) {
    const result = await this.proxy.forwardPublic(req, {
      method: 'POST',
      service: 'IDENTITY',
      path: '/code/verify-reset-code',
      body,
    });
    return result.data;
  }

  // ───── Endpoints protegidos (requieren JWT) ─────

  @Post('request-confirm-email')
  async requestConfirmEmail(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'IDENTITY',
      path: '/code/request-confirm-email',
      body,
    });
    return result.data;
  }

  @Post('verify-confirm-email')
  async verifyConfirmEmail(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'IDENTITY',
      path: '/code/verify-confirm-email',
      body,
    });
    return result.data;
  }
}
