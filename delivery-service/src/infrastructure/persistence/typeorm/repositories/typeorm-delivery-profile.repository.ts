import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { DeliveryProfile } from '../../../../domain/entities/delivery-profile.entity';
import { DeliveryProfileRepository } from '../../../../domain/repositories/delivery-profile.repository';
import { DeliveryProfileOrmEntity } from '../entities/delivery-profile.orm';
import { DeliveryProfileMapper } from '../mappers/delivery-profile.mapper';
import { VehicleType } from '../../../../domain/enums/vehicle-type.enum';

@Injectable()
export class TypeOrmDeliveryProfileRepository implements DeliveryProfileRepository {
  constructor(
    @InjectRepository(DeliveryProfileOrmEntity)
    private readonly ormRepo: Repository<DeliveryProfileOrmEntity>,
  ) {}

  async save(profile: DeliveryProfile): Promise<DeliveryProfile> {
    const orm = DeliveryProfileMapper.toOrm(profile);
    if (profile.id) {
      orm.id = profile.id;
    }
    const saved = await this.ormRepo.save(orm);
    return DeliveryProfileMapper.toDomain(saved);
  }

  async findByUserId(userId: string): Promise<DeliveryProfile | null> {
    const orm = await this.ormRepo.findOne({
      where: { userId, deletedAt: IsNull() },
    });
    return orm ? DeliveryProfileMapper.toDomain(orm) : null;
  }

  async updateVehicleType(
    profileId: string,
    vehicleType: VehicleType | null,
  ): Promise<void> {
    await this.ormRepo.update({ id: profileId }, { vehicleType });
  }
}
