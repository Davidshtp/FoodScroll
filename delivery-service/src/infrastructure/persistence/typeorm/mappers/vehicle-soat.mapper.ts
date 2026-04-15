import { VehicleSoat } from '../../../../domain/entities/vehicle-soat.entity';
import { VehicleSoatOrmEntity } from '../entities/vehicle-soat.orm';

export class VehicleSoatMapper {
  static toDomain(orm: VehicleSoatOrmEntity): VehicleSoat {
    return new VehicleSoat(
      orm.id,
      orm.vehicleId,
      orm.policyNumber ?? null,
      orm.insurer ?? null,
      orm.status ?? null,
      orm.issuanceStatus ?? null,
      orm.origin ?? null,
      orm.tariffType ?? null,
      orm.issuedAt ?? null,
      orm.startDate ?? null,
      orm.endDate ?? null,
      orm.createdAt,
    );
  }

  static toOrm(domain: VehicleSoat): VehicleSoatOrmEntity {
    const orm = new VehicleSoatOrmEntity();
    orm.id = domain.id;
    orm.vehicleId = domain.vehicleId;
    orm.policyNumber = domain.policyNumber as any;
    orm.insurer = domain.insurer as any;
    orm.status = domain.status as any;
    orm.issuanceStatus = domain.issuanceStatus as any;
    orm.origin = domain.origin as any;
    orm.tariffType = domain.tariffType as any;
    orm.issuedAt = domain.issuedAt as any;
    orm.startDate = domain.startDate as any;
    orm.endDate = domain.endDate as any;
    return orm;
  }
}
