import { Vehicle } from '../../../../domain/entities/vehicle.entity';
import { VehicleOrmEntity } from '../entities/vehicle.orm';

export class VehicleMapper {
  static toDomain(orm: VehicleOrmEntity): Vehicle {
    return new Vehicle(
      orm.id,
      orm.profileId,
      orm.vehicleType,
      orm.plate ?? null,
      orm.brand ?? null,
      orm.line ?? null,
      orm.modelYear ?? null,
      orm.color ?? null,
      orm.isPrimary,
      orm.soatStatus ?? null,
      orm.soatExpiry ?? null,
      orm.technoStatus ?? null,
      orm.technoExpiry ?? null,
      orm.createdAt,
      orm.updatedAt,
      orm.deletedAt,
    );
  }

  static toOrm(domain: Vehicle): VehicleOrmEntity {
    const orm = new VehicleOrmEntity();
    orm.id = domain.id;
    orm.profileId = domain.profileId;
    orm.vehicleType = domain.vehicleType;
    orm.plate = domain.plate as any;
    orm.brand = domain.brand as any;
    orm.line = domain.line as any;
    orm.modelYear = domain.modelYear as any;
    orm.color = domain.color as any;
    orm.isPrimary = domain.isPrimary;
    orm.soatStatus = domain.soatStatus as any;
    orm.soatExpiry = domain.soatExpiry as any;
    orm.technoStatus = domain.technoStatus as any;
    orm.technoExpiry = domain.technoExpiry as any;
    return orm;
  }
}
