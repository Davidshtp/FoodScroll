import { VehicleTechno } from '../../../../domain/entities/vehicle-techno.entity';
import { VehicleTechnoOrmEntity } from '../entities/vehicle-techno.orm';

export class VehicleTechnoMapper {
  static toDomain(orm: VehicleTechnoOrmEntity): VehicleTechno {
    return new VehicleTechno(
      orm.id,
      orm.vehicleId,
      orm.certificateNumber ?? null,
      orm.reviewType ?? null,
      orm.cdaName ?? null,
      orm.status ?? null,
      orm.isCurrent ?? null,
      orm.issuedAt ?? null,
      orm.expiresAt ?? null,
      orm.plate ?? null,
      orm.consistency ?? null,
      orm.certificateUrl ?? null,
      orm.createdAt,
    );
  }

  static toOrm(domain: VehicleTechno): VehicleTechnoOrmEntity {
    const orm = new VehicleTechnoOrmEntity();
    orm.id = domain.id;
    orm.vehicleId = domain.vehicleId;
    orm.certificateNumber = domain.certificateNumber as any;
    orm.reviewType = domain.reviewType as any;
    orm.cdaName = domain.cdaName as any;
    orm.status = domain.status as any;
    orm.isCurrent = domain.isCurrent as any;
    orm.issuedAt = domain.issuedAt as any;
    orm.expiresAt = domain.expiresAt as any;
    orm.plate = domain.plate as any;
    orm.consistency = domain.consistency as any;
    orm.certificateUrl = domain.certificateUrl as any;
    return orm;
  }
}
