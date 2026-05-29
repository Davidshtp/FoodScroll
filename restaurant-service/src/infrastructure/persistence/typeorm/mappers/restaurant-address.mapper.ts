import { RestaurantAddress } from '../../../../domain/entities/restaurant-address.entity';
import { RestaurantAddressOrmEntity } from '../entities/restaurant-address.orm';

export class RestaurantAddressMapper {
  static toDomain(orm: RestaurantAddressOrmEntity): RestaurantAddress {
    return RestaurantAddress.reconstitute({
      id: orm.id,
      restaurantId: orm.restaurantId,
      address: orm.address,
      cityId: orm.cityId,
      latitude: orm.latitude,
      longitude: orm.longitude,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt ?? null,
    });
  }

  static toOrm(domain: RestaurantAddress): RestaurantAddressOrmEntity {
    const orm = new RestaurantAddressOrmEntity();
    orm.id = domain.id;
    orm.restaurantId = domain.restaurantId;
    orm.address = domain.address;
    orm.cityId = domain.cityId;
    orm.latitude = domain.latitude;
    orm.longitude = domain.longitude;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    orm.deletedAt = domain.deletedAt;
    return orm;
  }
}
