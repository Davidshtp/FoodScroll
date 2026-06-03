import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { OrderRepository, ORDER_REPOSITORY } from '../../../domain/repositories/order.repository';
import { RestaurantPort, RESTAURANT_PORT } from '../../ports/restaurant.port';
import { ForbiddenRoleError } from '../../../domain/errors/domain.errors';

export interface GetRestaurantOrdersInput {
  userId: string;
  authorization: string;
  role: string;
}

export interface GetRestaurantOrdersOutput {
  orders: Order[];
}

@Injectable()
export class GetRestaurantOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    @Inject(RESTAURANT_PORT) private readonly restaurantPort: RestaurantPort,
  ) {}

  async execute(input: GetRestaurantOrdersInput): Promise<GetRestaurantOrdersOutput> {
    if (input.role !== 'RESTAURANT') {
      throw new ForbiddenRoleError(input.role, 'access restaurant orders');
    }

    const restaurantId = await this.restaurantPort.getRestaurantByUserId(input.userId, input.authorization);
    const orders = await this.orderRepo.findByRestaurantId(restaurantId);
    return { orders };
  }
}
