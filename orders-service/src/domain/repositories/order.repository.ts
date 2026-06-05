import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

export interface OrderRepository {
  createWithItems(order: Order, items: OrderItem[]): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  findByRestaurantId(restaurantId: string): Promise<Order[]>;
  findByDeliveryId(deliveryId: string): Promise<Order[]>;
  findAvailableForDelivery(): Promise<Order[]>;
  findDeliveredByCustomerId(customerId: string, page: number, limit: number): Promise<{ orders: Order[]; total: number }>;
  findDeliveredByRestaurantId(restaurantId: string, page: number, limit: number): Promise<{ orders: Order[]; total: number }>;
  findDeliveredByDeliveryId(deliveryId: string, page: number, limit: number): Promise<{ orders: Order[]; total: number }>;
  update(order: Order): Promise<Order>;
  softDeleteWithItems(orderId: string): Promise<void>;
  delete(id: string): Promise<void>;
}

export const ORDER_REPOSITORY = 'ORDER_REPOSITORY';
