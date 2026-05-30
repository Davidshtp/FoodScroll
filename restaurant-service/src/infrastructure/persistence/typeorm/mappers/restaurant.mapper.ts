import { Restaurant } from '../../../../domain/entities/restaurant.entity';
import { RestaurantOrmEntity } from '../entities/restaurant.orm';

export class RestaurantMapper {
  static toDomain(orm: RestaurantOrmEntity): Restaurant {
    return Restaurant.reconstitute({
      id: orm.id,
      userId: orm.userId,
      name: orm.name,
      description: orm.description,
      phone: orm.phone,
      email: orm.email,
      logoUrl: orm.logoUrl,
      bannerUrl: orm.bannerUrl,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt ?? null,
    });
  }

  static toOrm(domain: Restaurant): RestaurantOrmEntity {
    const orm = new RestaurantOrmEntity();
    orm.id = domain.id;
    orm.userId = domain.userId;
    orm.name = domain.name;
    orm.description = domain.description;
    orm.phone = domain.phone;
    orm.email = domain.email;
    orm.logoUrl = domain.logoUrl;
    orm.bannerUrl = domain.bannerUrl;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    orm.deletedAt = domain.deletedAt;
    return orm;
  }
}
