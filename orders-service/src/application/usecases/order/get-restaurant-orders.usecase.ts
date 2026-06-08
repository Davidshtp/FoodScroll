import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { OrderRepository, ORDER_REPOSITORY } from '../../../domain/repositories/order.repository';
import { RestaurantPort, RESTAURANT_PORT } from '../../ports/restaurant.port';
import { ForbiddenRoleError } from '../../../domain/errors/domain.errors';
import { CustomerInfoPort, CUSTOMER_INFO_PORT } from '../../ports/customer-info.port';

export interface EnrichedRestaurantOrder {
  order: Order;
  customer: {
    userId: string;
    firstName: string;
    lastName: string;
    phone: string;
    avatarUrl: string | null;
  } | null;
}

export interface GetRestaurantOrdersInput {
  userId: string;
  authorization: string;
  role: string;
}

export interface GetRestaurantOrdersOutput {
  orders: EnrichedRestaurantOrder[];
}

@Injectable()
export class GetRestaurantOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    @Inject(RESTAURANT_PORT) private readonly restaurantPort: RestaurantPort,
    @Inject(CUSTOMER_INFO_PORT) private readonly customerInfoPort: CustomerInfoPort,
  ) {}

  async execute(input: GetRestaurantOrdersInput): Promise<GetRestaurantOrdersOutput> {
    if (input.role !== 'RESTAURANT') {
      throw new ForbiddenRoleError(input.role, 'access restaurant orders');
    }

    const restaurantId = await this.restaurantPort.getRestaurantByUserId(input.userId, input.authorization);
    const orders = await this.orderRepo.findByRestaurantId(restaurantId);

    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const customer = await this.customerInfoPort
          .getCustomerInfo(order.customerId)
          .catch(() => null);

        return {
          order,
          customer: customer
            ? {
                userId: customer.profile.userId,
                firstName: customer.profile.firstName,
                lastName: customer.profile.lastName,
                phone: customer.profile.phone,
                avatarUrl: customer.profile.avatarUrl,
              }
            : null,
        };
      }),
    );

    return { orders: enrichedOrders };
  }
}
