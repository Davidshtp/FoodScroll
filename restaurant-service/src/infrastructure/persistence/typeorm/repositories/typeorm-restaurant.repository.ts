import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Restaurant } from '../../../../domain/entities/restaurant.entity';
import { RestaurantAddress } from '../../../../domain/entities/restaurant-address.entity';
import { RestaurantOpeningHours } from '../../../../domain/entities/restaurant-opening-hours.entity';
import { RestaurantRepository } from '../../../../domain/repositories/restaurant.repository';
import { RestaurantOrmEntity } from '../entities/restaurant.orm';
import { RestaurantAddressOrmEntity } from '../entities/restaurant-address.orm';
import { RestaurantOpeningHoursOrmEntity } from '../entities/restaurant-opening-hours.orm';
import { RestaurantMapper } from '../mappers/restaurant.mapper';
import { RestaurantAddressMapper } from '../mappers/restaurant-address.mapper';
import { RestaurantOpeningHoursMapper } from '../mappers/restaurant-opening-hours.mapper';

@Injectable()
export class TypeOrmRestaurantRepository implements RestaurantRepository {
  constructor(
    @InjectRepository(RestaurantOrmEntity)
    private readonly restaurantRepo: Repository<RestaurantOrmEntity>,
    @InjectRepository(RestaurantAddressOrmEntity)
    private readonly addressRepo: Repository<RestaurantAddressOrmEntity>,
    @InjectRepository(RestaurantOpeningHoursOrmEntity)
    private readonly openingHoursRepo: Repository<RestaurantOpeningHoursOrmEntity>,
  ) {}

  async save(restaurant: Restaurant): Promise<Restaurant> {
    const orm = RestaurantMapper.toOrm(restaurant);
    const saved = await this.restaurantRepo.save(orm);
    return RestaurantMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Restaurant | null> {
    const orm = await this.restaurantRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    return orm ? RestaurantMapper.toDomain(orm) : null;
  }

  async findByUserId(userId: string): Promise<Restaurant | null> {
    const orm = await this.restaurantRepo.findOne({
      where: { userId, deletedAt: IsNull() },
    });
    return orm ? RestaurantMapper.toDomain(orm) : null;
  }

  async saveAddress(address: RestaurantAddress): Promise<RestaurantAddress> {
    const orm = RestaurantAddressMapper.toOrm(address);
    const saved = await this.addressRepo.save(orm);
    return RestaurantAddressMapper.toDomain(saved);
  }

  async findAddressByRestaurantId(restaurantId: string): Promise<RestaurantAddress | null> {
    const orm = await this.addressRepo.findOne({
      where: { restaurantId, deletedAt: IsNull() },
    });
    return orm ? RestaurantAddressMapper.toDomain(orm) : null;
  }

  async upsertOpeningHours(hours: RestaurantOpeningHours[]): Promise<RestaurantOpeningHours[]> {
    const orms = hours.map(RestaurantOpeningHoursMapper.toOrm);
    const saved = await this.openingHoursRepo.save(orms);
    return saved.map(RestaurantOpeningHoursMapper.toDomain);
  }

  async deleteById(id: string): Promise<void> {
    await this.restaurantRepo.softDelete({ id });
  }

  async deleteAddressById(restaurantId: string): Promise<void> {
    await this.addressRepo.softDelete({ restaurantId });
  }

  async deleteOpeningHoursByRestaurantId(restaurantId: string): Promise<void> {
    await this.openingHoursRepo.softDelete({ restaurantId });
  }

  async findOpeningHoursByRestaurantId(restaurantId: string): Promise<RestaurantOpeningHours[]> {
    const orms = await this.openingHoursRepo.find({
      where: { restaurantId, deletedAt: IsNull() },
      order: { dayOfWeek: 'ASC' },
    });
    return orms.map(RestaurantOpeningHoursMapper.toDomain);
  }
}
