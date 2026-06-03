import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { OrderRepository, ORDER_REPOSITORY } from '../../../domain/repositories/order.repository';
import { CustomerIdentityPort, CUSTOMER_IDENTITY_PORT } from '../../ports/customer-identity.port';

export interface GetUserOrdersInput {
  userId: string;
  authorization: string;
}

export interface GetUserOrdersOutput {
  orders: Order[];
}

@Injectable()
export class GetUserOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    @Inject(CUSTOMER_IDENTITY_PORT) private readonly customerIdentityPort: CustomerIdentityPort,
  ) {}

  async execute(input: GetUserOrdersInput): Promise<GetUserOrdersOutput> {
    await this.customerIdentityPort.validateUserId(input.userId, input.authorization);
    const orders = await this.orderRepo.findByCustomerId(input.userId);
    return { orders };
  }
}
