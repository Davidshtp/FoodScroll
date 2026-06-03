import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

export interface OrderRepository {
  createWithItems(order: Order, items: OrderItem[]): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  findByRestaurantId(restaurantId: string): Promise<Order[]>;
  findByDeliveryId(deliveryId: string): Promise<Order[]>;
  findAvailableForDelivery(): Promise<Order[]>;
  update(order: Order): Promise<Order>;
  softDeleteWithItems(orderId: string): Promise<void>;
  delete(id: string): Promise<void>;
}

export const ORDER_REPOSITORY = 'ORDER_REPOSITORY';
