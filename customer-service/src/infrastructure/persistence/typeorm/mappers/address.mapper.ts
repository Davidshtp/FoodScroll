import { Address } from '../../../../domain/entities/address.entity';
import { AddressOrmEntity } from '../entities/address.orm-entity';

export class AddressMapper {
  static toDomain(orm: AddressOrmEntity): Address {
    return Address.reconstitute({
      id: orm.id,
      customerId: orm.customerId,
      cityId: orm.cityId,
      alias: orm.alias,
      mainAddress: orm.mainAddress,
      neighborhood: orm.neighborhood,
      details: orm.details ?? null,
      latitude: orm.latitude,
      longitude: orm.longitude,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt ?? null,
    });
  }

  static toOrm(domain: Address): AddressOrmEntity {
    const orm = new AddressOrmEntity();
    orm.id = domain.id;
    orm.customerId = domain.customerId;
    orm.cityId = domain.cityId;
    orm.alias = domain.alias;
    orm.mainAddress = domain.mainAddress;
    orm.neighborhood = domain.neighborhood;
    orm.details = domain.details;
    orm.latitude = domain.latitude;
    orm.longitude = domain.longitude;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    orm.deletedAt = domain.deletedAt ?? null;
    return orm;
  }
}
