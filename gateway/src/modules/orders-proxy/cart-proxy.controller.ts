import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { Role } from '../../config/constants';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProxyService } from '../../infrastructure/http/proxy.service';

/**
 * Proxy del carrito.
 * Reenvía las peticiones al orders service.
 * Requiere JWT y rol CUSTOMER.
 */
@Roles(Role.CUSTOMER)
@Controller('orders/cart')
export class CartProxyController {
  constructor(private readonly proxy: ProxyService) {}

  @Post('items')
  async addItem(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'ORDERS',
      path: '/cart/items',
      body,
    });
    return result.data;
  }

  @Get()
  async getCart(
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'ORDERS',
      path: '/cart',
    });
    return result.data;
  }

  @Patch('items/:cartItemId')
  async updateItem(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
    @Param('cartItemId') cartItemId: string,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'PATCH',
      service: 'ORDERS',
      path: `/cart/items/${cartItemId}`,
      body,
    });
    return result.data;
  }

  @Delete('items/:cartItemId')
  async removeItem(
    @Req() req: Request,
    @CurrentUser() user: any,
    @Param('cartItemId') cartItemId: string,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'DELETE',
      service: 'ORDERS',
      path: `/cart/items/${cartItemId}`,
    });
    return result.data;
  }

  @Delete()
  async clearCart(
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'DELETE',
      service: 'ORDERS',
      path: '/cart',
    });
    return result.data;
  }

  @Post('checkout')
  async checkout(
    @Req() req: Request,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'ORDERS',
      path: '/cart/checkout',
      body,
    });
    return result.data;
  }
}
