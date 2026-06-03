import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, In, Repository } from 'typeorm';
import { Order } from '../../../../domain/entities/order.entity';
import { OrderItem } from '../../../../domain/entities/order-item.entity';
import { OrderRepository } from '../../../../domain/repositories/order.repository';
import { OrderOrmEntity } from '../entities/order.orm-entity';
import { OrderItemOrmEntity } from '../entities/order-item.orm-entity';
import { OrderMapper, OrderItemMapper } from '../mappers/order.mapper';
import { OrderStatus } from '../../../../domain/enums/order-status.enum';

@Injectable()
export class TypeOrmOrderRepository implements OrderRepository {
  constructor(
    @InjectRepository(OrderOrmEntity)
    private readonly repo: Repository<OrderOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async createWithItems(order: Order, items: OrderItem[]): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const orderOrm = OrderMapper.toOrm(order);
      const savedOrder = await queryRunner.manager.save(OrderOrmEntity, orderOrm);

      const itemOrms = items.map(item => {
        const itemOrm = OrderItemMapper.toOrm(item);
        itemOrm.orderId = savedOrder.id;
        return itemOrm;
      });
      const savedItems = await queryRunner.manager.save(OrderItemOrmEntity, itemOrms);

      await queryRunner.commitTransaction();

      return OrderMapper.toDomain({
        ...savedOrder,
        orderItems: savedItems,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findById(id: string): Promise<Order | null> {
    const orm = await this.repo.findOne({ where: { id }, relations: ['orderItems'] });
    return orm ? OrderMapper.toDomain(orm) : null;
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    const orms = await this.repo.find({
      where: { customerId, status: Not(OrderStatus.CANCELLED as any) as any },
      relations: ['orderItems'],
    });
    return orms.map(o => OrderMapper.toDomain(o));
  }

  async findByRestaurantId(restaurantId: string): Promise<Order[]> {
    const orms = await this.repo.find({
      where: { restaurantId, status: Not(OrderStatus.CANCELLED as any) as any },
      relations: ['orderItems'],
    });
    return orms.map(o => OrderMapper.toDomain(o));
  }

  async findByDeliveryId(deliveryId: string): Promise<Order[]> {
    const orms = await this.repo.find({
      where: { deliveryId, status: Not(In([OrderStatus.CANCELLED, OrderStatus.DELIVERED] as any)) as any },
      relations: ['orderItems'],
    });
    return orms.map(o => OrderMapper.toDomain(o));
  }

  async findAvailableForDelivery(): Promise<Order[]> {
    const orms = await this.repo.find({
      where: { status: OrderStatus.READY_FOR_PICKUP as any, deliveryId: null as any },
      relations: ['orderItems'],
    });
    return orms.map(o => OrderMapper.toDomain(o));
  }

  async update(order: Order): Promise<Order> {
    const orm = OrderMapper.toOrm(order);
    const saved = await this.repo.save(orm);
    return OrderMapper.toDomain(saved);
  }

  async softDeleteWithItems(orderId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(OrderOrmEntity, { id: orderId }, { status: OrderStatus.CANCELLED });
      await queryRunner.manager.softDelete(OrderItemOrmEntity, { orderId });
      await queryRunner.manager.softDelete(OrderOrmEntity, { id: orderId });
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
