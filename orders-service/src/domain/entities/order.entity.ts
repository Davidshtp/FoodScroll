import { OrderItem } from './order-item.entity';
import { OrderStatus } from '../enums/order-status.enum';

export interface OrderProps {
  id: string;
  customerId: string;
  restaurantId: string;
  deliveryId: string | null;
  customerAddressId: string;
  status: OrderStatus;
  totalAmount: number;
  orderItems: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Order {
  readonly id: string;
  readonly customerId: string;
  readonly restaurantId: string;
  readonly deliveryId: string | null;
  readonly customerAddressId: string;
  readonly status: OrderStatus;
  readonly totalAmount: number;
  readonly orderItems: OrderItem[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  private constructor(props: OrderProps) {
    this.id = props.id;
    this.customerId = props.customerId;
    this.restaurantId = props.restaurantId;
    this.deliveryId = props.deliveryId;
    this.customerAddressId = props.customerAddressId;
    this.status = props.status;
    this.totalAmount = props.totalAmount;
    this.orderItems = props.orderItems;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.deletedAt = props.deletedAt;
  }

  static create(props: {
    id: string;
    customerId: string;
    restaurantId: string;
    deliveryId: string | null;
    customerAddressId: string;
    status: OrderStatus;
    totalAmount: number;
    orderItems: OrderItem[];
  }): Order {
    return new Order({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }

  static reconstitute(props: OrderProps): Order {
    return new Order(props);
  }

  updateStatus(status: OrderStatus): Order {
    return new Order({
      ...this,
      status,
      updatedAt: new Date(),
    });
  }

  assignDelivery(deliveryId: string): Order {
    return new Order({
      ...this,
      deliveryId,
      status: OrderStatus.ACCEPTED,
      updatedAt: new Date(),
    });
  }

  markPickedUp(): Order {
    return new Order({
      ...this,
      status: OrderStatus.OUT_FOR_DELIVERY,
      updatedAt: new Date(),
    });
  }

  markAsDelivered(): Order {
    return new Order({
      ...this,
      status: OrderStatus.DELIVERED,
      updatedAt: new Date(),
    });
  }

  softDelete(): Order {
    return new Order({
      ...this,
      status: OrderStatus.CANCELLED,
      deletedAt: new Date(),
      updatedAt: new Date(),
    });
  }
}