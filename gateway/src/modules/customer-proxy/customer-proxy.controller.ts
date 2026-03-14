import { Controller, Get, Post, Patch, Delete, Body, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProxyService } from '../../infrastructure/http/proxy.service';

/**
 * Proxy de clientes.
 * Reenvía las peticiones al customer service.
 * Todos los endpoints requieren JWT.
 */
@Controller('customer')
export class CustomerProxyController {
  constructor(private readonly proxy: ProxyService) {}

  // ───── Perfil ─────

  @Post('profile')
  async createProfile(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'CUSTOMER',
      path: '/customer-profile',
      body,
    });
    return result.data;
  }

  @Get('profile')
  async getProfile(
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'CUSTOMER',
      path: '/customer-profile',
    });
    return result.data;
  }

  @Patch('profile')
  async updateProfile(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'PATCH',
      service: 'CUSTOMER',
      path: '/customer-profile',
      body,
    });
    return result.data;
  }

  // ───── Direcciones ─────

  @Post('address')
  async createAddress(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'CUSTOMER',
      path: '/address',
      body,
    });
    return result.data;
  }

  @Get('address')
  async getAddresses(
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'CUSTOMER',
      path: '/address',
    });
    return result.data;
  }

  @Patch('address/:addressId')
  async updateAddress(
    @Param('addressId') addressId: string,
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'PATCH',
      service: 'CUSTOMER',
      path: `/address/${addressId}`,
      body,
    });
    return result.data;
  }

  @Delete('address/:addressId')
  async removeAddress(
    @Param('addressId') addressId: string,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'DELETE',
      service: 'CUSTOMER',
      path: `/address/${addressId}`,
    });
    return result.data;
  }
}
