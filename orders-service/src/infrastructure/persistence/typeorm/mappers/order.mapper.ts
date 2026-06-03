import { Order } from '../../../../domain/entities/order.entity';
import { OrderItem } from '../../../../domain/entities/order-item.entity';
import { OrderOrmEntity } from '../entities/order.orm-entity';
import { OrderItemOrmEntity } from '../entities/order-item.orm-entity';

export class OrderItemMapper {
  static toDomain(orm: OrderItemOrmEntity): OrderItem {
    return OrderItem.reconstitute({
      id: orm.id,
      publicationId: orm.publicationId,
      productName: orm.productName,
      quantity: orm.quantity,
      unitPrice: orm.unitPrice,
      totalPrice: orm.totalPrice,
      observation: orm.observation ?? null,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt ?? null,
    });
  }

  static toOrm(domain: OrderItem): OrderItemOrmEntity {
    const orm = new OrderItemOrmEntity();
    orm.id = domain.id;
    orm.publicationId = domain.publicationId;
    orm.productName = domain.productName;
    orm.quantity = domain.quantity;
    orm.unitPrice = domain.unitPrice;
    orm.totalPrice = domain.totalPrice;
    orm.observation = domain.observation ?? null;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    orm.deletedAt = domain.deletedAt ?? null;
    return orm;
  }
}

export class OrderMapper {
  static toDomain(orm: OrderOrmEntity): Order {
    const orderItems = orm.orderItems?.map(item => OrderItemMapper.toDomain(item)) ?? [];
    return Order.reconstitute({
      id: orm.id,
      customerId: orm.customerId,
      restaurantId: orm.restaurantId,
      deliveryId: orm.deliveryId,
      customerAddressId: orm.customerAddressId,
      status: orm.status,
      totalAmount: orm.totalAmount,
      orderItems,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt ?? null,
    });
  }

  static toOrm(domain: Order): OrderOrmEntity {
    const orm = new OrderOrmEntity();
    orm.id = domain.id;
    orm.customerId = domain.customerId;
    orm.restaurantId = domain.restaurantId;
    orm.deliveryId = domain.deliveryId;
    orm.customerAddressId = domain.customerAddressId;
    orm.status = domain.status;
    orm.totalAmount = domain.totalAmount;
    orm.orderItems = domain.orderItems?.map(item => OrderItemMapper.toOrm(item)) ?? [];
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    orm.deletedAt = domain.deletedAt ?? null;
    return orm;
  }
}
