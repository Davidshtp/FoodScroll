import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../../../../domain/entities/cart.entity';
import { CartRepository } from '../../../../domain/repositories/cart.repository';
import { CartOrmEntity } from '../entities/cart.orm-entity';
import { CartItemOrmEntity } from '../entities/cart-item.orm-entity';
import { CartMapper, CartItemMapper } from '../mappers/cart.mapper';

@Injectable()
export class TypeOrmCartRepository implements CartRepository {
  constructor(
    @InjectRepository(CartOrmEntity)
    private readonly repo: Repository<CartOrmEntity>,
    @InjectRepository(CartItemOrmEntity)
    private readonly itemRepo: Repository<CartItemOrmEntity>,
  ) {}

  async findOrCreateByCustomerId(customerId: string): Promise<Cart> {
    let cartOrm = await this.repo.findOne({
      where: { customerId },
      relations: ['cartItems'],
    });

    if (!cartOrm) {
      const newCart = this.repo.create({
        id: crypto.randomUUID(),
        customerId,
        cartItems: [],
      });
      cartOrm = await this.repo.save(newCart);
      cartOrm.cartItems = [];
    }

    return CartMapper.toDomain(cartOrm);
  }

  async findByCustomerId(customerId: string): Promise<Cart | null> {
    const cartOrm = await this.repo.findOne({
      where: { customerId },
      relations: ['cartItems'],
    });
    return cartOrm ? CartMapper.toDomain(cartOrm) : null;
  }

  async save(cart: Cart): Promise<Cart> {
    const cartOrm = CartMapper.toOrm(cart);

    await this.itemRepo.delete({ cartId: cart.id });

    const savedCart = await this.repo.save(cartOrm);

    if (cart.cartItems.length > 0) {
      const itemOrms = cart.cartItems.map((item) => {
        const itemOrm = CartItemMapper.toOrm(item);
        itemOrm.cartId = cart.id;
        return itemOrm;
      });
      const savedItems = await this.itemRepo.save(itemOrms);
      return CartMapper.toDomain({ ...savedCart, cartItems: savedItems });
    }

    return CartMapper.toDomain({ ...savedCart, cartItems: [] });
  }

  async deleteByCustomerId(customerId: string): Promise<void> {
    const cartOrm = await this.repo.findOne({ where: { customerId } });
    if (cartOrm) {
      await this.itemRepo.delete({ cartId: cartOrm.id });
      await this.repo.delete(cartOrm.id);
    }
  }
}
