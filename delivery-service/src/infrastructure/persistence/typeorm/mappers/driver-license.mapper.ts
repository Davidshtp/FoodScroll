import { DriverLicense } from '../../../../domain/entities/driver-license.entity';
import { DriverLicenseOrmEntity } from '../entities/driver-license.orm';

export class DriverLicenseMapper {
  static toDomain(orm: DriverLicenseOrmEntity): DriverLicense {
    return new DriverLicense(
      orm.documentNumber,
      orm.profileId,
      orm.licenseNumber ?? null,
      orm.issuingOffice ?? null,
      orm.issueDate ?? null,
      orm.status ?? null,
      orm.isActive,
      orm.verifiedAt ?? null,
      orm.createdAt,
      orm.updatedAt,
      orm.deletedAt,
    );
  }

  static toOrm(domain: DriverLicense): DriverLicenseOrmEntity {
    const orm = new DriverLicenseOrmEntity();
    orm.documentNumber = domain.documentNumber;
    orm.profileId = domain.profileId;
    orm.licenseNumber = domain.licenseNumber as any;
    orm.issuingOffice = domain.issuingOffice as any;
    orm.issueDate = domain.issueDate as any;
    orm.status = domain.status as any;
    orm.isActive = domain.isActive;
    orm.verifiedAt = domain.verifiedAt as any;
    return orm;
  }
}
