import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { OrderRepository, ORDER_REPOSITORY } from '../../../domain/repositories/order.repository';
import { RestaurantPort, RESTAURANT_PORT } from '../../ports/restaurant.port';
import { OrderNotFoundError, UnauthorizedOrderAccessError } from '../../../domain/errors/domain.errors';
import { RestaurantInfoPort, RESTAURANT_INFO_PORT } from '../../ports/restaurant-info.port';
import { CustomerInfoPort, CUSTOMER_INFO_PORT } from '../../ports/customer-info.port';

export interface EnrichedOrderDetail {
  order: Order;
  restaurant: {
    id: string;
    name: string;
    logoUrl: string;
  } | null;
  customer: {
    userId: string;
    firstName: string;
    lastName: string;
    phone: string;
    avatarUrl: string | null;
  } | null;
}

export interface GetOrderInput {
  orderId: string;
  userId: string;
  role: string;
  authorization: string;
}

export interface GetOrderOutput {
  order: EnrichedOrderDetail;
}

@Injectable()
export class GetOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    @Inject(RESTAURANT_PORT) private readonly restaurantPort: RestaurantPort,
    @Inject(RESTAURANT_INFO_PORT) private readonly restaurantInfoPort: RestaurantInfoPort,
    @Inject(CUSTOMER_INFO_PORT) private readonly customerInfoPort: CustomerInfoPort,
  ) {}

  async execute(input: GetOrderInput): Promise<GetOrderOutput> {
    const order = await this.orderRepo.findById(input.orderId);
    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    let authorized = false;

    if (input.role === 'CUSTOMER') {
      authorized = order.customerId === input.userId;
    } else if (input.role === 'RESTAURANT') {
      const restaurantId = await this.restaurantPort.getRestaurantByUserId(input.userId, input.authorization);
      authorized = order.restaurantId === restaurantId;
    } else if (input.role === 'DELIVERY') {
      authorized = order.deliveryId === input.userId;
    }

    if (!authorized) {
      throw new UnauthorizedOrderAccessError(input.orderId);
    }

    const [restaurant, customer] = await Promise.all([
      this.restaurantInfoPort.getRestaurantInfo(order.restaurantId).catch(() => null),
      order.customerId
        ? this.customerInfoPort.getCustomerInfo(order.customerId).catch(() => null)
        : Promise.resolve(null),
    ]);

    return {
      order: {
        order,
        restaurant: restaurant
          ? {
              id: restaurant.id,
              name: restaurant.name,
              logoUrl: restaurant.logoUrl,
            }
          : null,
        customer: customer
          ? {
              userId: customer.profile.userId,
              firstName: customer.profile.firstName,
              lastName: customer.profile.lastName,
              phone: customer.profile.phone,
              avatarUrl: customer.profile.avatarUrl,
            }
          : null,
      },
    };
  }
}
