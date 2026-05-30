import { RestaurantOpeningHours } from '../../../../domain/entities/restaurant-opening-hours.entity';
import { RestaurantOpeningHoursOrmEntity } from '../entities/restaurant-opening-hours.orm';

export class RestaurantOpeningHoursMapper {
  static toDomain(orm: RestaurantOpeningHoursOrmEntity): RestaurantOpeningHours {
    return RestaurantOpeningHours.reconstitute({
      id: orm.id,
      restaurantId: orm.restaurantId,
      dayOfWeek: orm.dayOfWeek,
      openTime: orm.openTime,
      closeTime: orm.closeTime,
      isClosed: orm.isClosed,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt ?? null,
    });
  }

  static toOrm(domain: RestaurantOpeningHours): RestaurantOpeningHoursOrmEntity {
    const orm = new RestaurantOpeningHoursOrmEntity();
    orm.id = domain.id;
    orm.restaurantId = domain.restaurantId;
    orm.dayOfWeek = domain.dayOfWeek;
    orm.openTime = domain.openTime;
    orm.closeTime = domain.closeTime;
    orm.isClosed = domain.isClosed;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    orm.deletedAt = domain.deletedAt;
    return orm;
  }
}
