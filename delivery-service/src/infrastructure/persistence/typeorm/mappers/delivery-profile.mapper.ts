import { DeliveryProfile } from '../../../../domain/entities/delivery-profile.entity';
import { DeliveryProfileOrmEntity } from '../entities/delivery-profile.orm';

export class DeliveryProfileMapper {
  static toDomain(orm: DeliveryProfileOrmEntity): DeliveryProfile {
    return new DeliveryProfile(
      orm.id,
      orm.userId,
      orm.firstName,
      orm.lastName,
      orm.phone,
      orm.documentType,
      orm.documentNumber,
      orm.birthDate,
      orm.gender,
      orm.vehicleType,
      orm.avatarUrl ?? null,
      orm.createdAt,
      orm.updatedAt,
    );
  }

  static toOrm(domain: DeliveryProfile): DeliveryProfileOrmEntity {
    const orm = new DeliveryProfileOrmEntity();
    orm.id = domain.id;
    orm.userId = domain.userId;
    orm.firstName = domain.firstName;
    orm.lastName = domain.lastName;
    orm.phone = domain.phone;
    orm.documentType = domain.documentType;
    orm.documentNumber = domain.documentNumber;
    orm.birthDate = domain.birthDate;
    orm.gender = domain.gender;
    orm.vehicleType = domain.vehicleType;
    orm.avatarUrl = domain.avatarUrl as any;
    return orm;
  }
}
