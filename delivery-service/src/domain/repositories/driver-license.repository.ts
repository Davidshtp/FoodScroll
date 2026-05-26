import { DriverLicense } from '../entities/driver-license.entity';

export const DRIVER_LICENSE_REPOSITORY = Symbol('DRIVER_LICENSE_REPOSITORY');

export interface DriverLicenseRepository {
  findByDocumentNumber(documentNumber: string): Promise<DriverLicense | null>;
  findByDocumentNumberIncludingDeleted(
    documentNumber: string,
  ): Promise<DriverLicense | null>;
  findByProfileId(profileId: string): Promise<DriverLicense | null>;
  save(license: DriverLicense): Promise<DriverLicense>;
  restore(documentNumber: string): Promise<void>;
  softDelete(documentNumber: string): Promise<void>;
}
