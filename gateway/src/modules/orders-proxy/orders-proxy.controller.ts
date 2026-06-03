import {
  Controller,
  Get,
  Post,
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
 * Proxy de órdenes.
 * Reenvía las peticiones al orders service.
 * Requiere JWT y rol CUSTOMER, DELIVERY o RESTAURANT según la operación.
 */
@Roles(Role.CUSTOMER, Role.DELIVERY, Role.RESTAURANT)
@Controller('orders')
export class OrdersProxyController {
  constructor(private readonly proxy: ProxyService) {}

  // ───── Crear orden (CUSTOMER) ─────
  @Roles(Role.CUSTOMER)
  @Post()
  async createOrder(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'ORDERS',
      path: '/orders',
      body,
    });
    return result.data;
  }

  // ───── Obtener órdenes del restaurante (RESTAURANT) ─────
  @Roles(Role.RESTAURANT)
  @Get('restaurant')
  async getRestaurantOrders(
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'ORDERS',
      path: '/orders/restaurant',
    });
    return result.data;
  }

  // ───── Obtener órdenes disponibles para delivery (DELIVERY) ─────
  @Roles(Role.DELIVERY)
  @Get('available')
  async getAvailableOrders(
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'ORDERS',
      path: '/orders/available',
    });
    return result.data;
  }

  // ───── Obtener mis entregas (DELIVERY) ─────
  @Roles(Role.DELIVERY)
  @Get('my-deliveries')
  async getMyDeliveries(
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'ORDERS',
      path: '/orders/my-deliveries',
    });
    return result.data;
  }

  // ───── Confirmar orden (RESTAURANT) ─────
  @Roles(Role.RESTAURANT)
  @Post(':orderId/confirm')
  async confirmOrder(
    @Req() req: Request,
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'ORDERS',
      path: `/orders/${orderId}/confirm`,
    });
    return result.data;
  }

  // ───── Rechazar orden (RESTAURANT) ─────
  @Roles(Role.RESTAURANT)
  @Post(':orderId/reject')
  async rejectOrder(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'ORDERS',
      path: `/orders/${orderId}/reject`,
      body,
    });
    return result.data;
  }

  // ───── Empezar a preparar (RESTAURANT) ─────
  @Roles(Role.RESTAURANT)
  @Post(':orderId/preparing')
  async startPreparing(
    @Req() req: Request,
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'ORDERS',
      path: `/orders/${orderId}/preparing`,
    });
    return result.data;
  }

  // ───── Marcar como listo para recoger (RESTAURANT) ─────
  @Roles(Role.RESTAURANT)
  @Post(':orderId/ready')
  async markReady(
    @Req() req: Request,
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'ORDERS',
      path: `/orders/${orderId}/ready`,
    });
    return result.data;
  }

  // ───── Reclamar orden para delivery (DELIVERY) ─────
  @Roles(Role.DELIVERY)
  @Post(':orderId/accept')
  async acceptDelivery(
    @Req() req: Request,
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'ORDERS',
      path: `/orders/${orderId}/accept`,
    });
    return result.data;
  }

  // ───── Marcar orden como recogida (DELIVERY) ─────
  @Roles(Role.DELIVERY)
  @Post(':orderId/pickup')
  async pickupOrder(
    @Req() req: Request,
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'ORDERS',
      path: `/orders/${orderId}/pickup`,
    });
    return result.data;
  }

  // ───── Marcar orden como entregada (DELIVERY) ─────
  @Roles(Role.DELIVERY)
  @Post(':orderId/deliver')
  async deliverOrder(
    @Req() req: Request,
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'ORDERS',
      path: `/orders/${orderId}/deliver`,
    });
    return result.data;
  }

  // ───── Obtener orden específica (todos los roles) ─────
  @Get(':orderId')
  async getOrder(
    @Req() req: Request,
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'ORDERS',
      path: `/orders/${orderId}`,
    });
    return result.data;
  }

  // ───── Obtener mis órdenes (CUSTOMER) ─────
  @Roles(Role.CUSTOMER)
  @Get()
  async getMyOrders(
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'ORDERS',
      path: '/orders',
    });
    return result.data;
  }

  // ───── Cancelar orden ─────
  @Roles(Role.CUSTOMER)
  @Post(':orderId/cancel')
  async cancelOrder(
    @Req() req: Request,
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'ORDERS',
      path: `/orders/${orderId}/cancel`,
    });
    return result.data;
  }
}
