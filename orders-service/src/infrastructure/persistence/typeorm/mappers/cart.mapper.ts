import { Cart } from '../../../../domain/entities/cart.entity';
import { CartItem } from '../../../../domain/entities/cart-item.entity';
import { CartOrmEntity } from '../entities/cart.orm-entity';
import { CartItemOrmEntity } from '../entities/cart-item.orm-entity';

export class CartItemMapper {
  static toDomain(orm: CartItemOrmEntity): CartItem {
    return CartItem.reconstitute({
      id: orm.id,
      publicationId: orm.publicationId,
      quantity: orm.quantity,
      observation: orm.observation ?? null,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: CartItem): CartItemOrmEntity {
    const orm = new CartItemOrmEntity();
    orm.id = domain.id;
    orm.publicationId = domain.publicationId;
    orm.quantity = domain.quantity;
    orm.observation = domain.observation ?? null;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}

export class CartMapper {
  static toDomain(orm: CartOrmEntity): Cart {
    const cartItems = orm.cartItems?.map((item) => CartItemMapper.toDomain(item)) ?? [];
    return Cart.reconstitute({
      id: orm.id,
      customerId: orm.customerId,
      cartItems,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Cart): CartOrmEntity {
    const orm = new CartOrmEntity();
    orm.id = domain.id;
    orm.customerId = domain.customerId;
    orm.cartItems = domain.cartItems?.map((item) => CartItemMapper.toOrm(item)) ?? [];
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
