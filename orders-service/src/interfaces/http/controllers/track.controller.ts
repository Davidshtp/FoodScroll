import { Controller, Get, Param, ParseUUIDPipe, UseGuards, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserId } from '../decorators/user-id.decorator';
import { UserRole } from '../decorators/user-role.decorator';
import { OrderRepository, ORDER_REPOSITORY } from '../../../domain/repositories/order.repository';
import {
  OrderNotFoundError,
  UnauthorizedOrderAccessError,
} from '../../../domain/errors/domain.errors';
import { RedisService } from '../../../infrastructure/redis/redis.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class TrackController {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    private readonly redisService: RedisService,
  ) {}

  @Get(':id/track')
  async getTrack(
    @Param('id', ParseUUIDPipe) orderId: string,
    @UserId() userId: string,
    @UserRole() role: string,
  ) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    const isCustomer = order.customerId === userId && role === 'CUSTOMER';
    const isRestaurant = order.restaurantId === userId && role === 'RESTAURANT';
    const isDelivery = order.deliveryId === userId && role === 'DELIVERY';
    if (!isCustomer && !isRestaurant && !isDelivery) {
      throw new UnauthorizedOrderAccessError(orderId);
    }

    const routeRaw = await this.redisService.lrange(`delivery:track:${orderId}`, 0, -1);
    const lastPosRaw = await this.redisService.get(`delivery:lastpos:${orderId}`);

    const route = (routeRaw || []).map((r) => JSON.parse(r));
    const lastPosition = lastPosRaw ? JSON.parse(lastPosRaw) : null;

    return {
      orderId: order.id,
      deliveryId: order.deliveryId,
      route,
      lastPosition,
    };
  }
}
