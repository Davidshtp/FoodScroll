import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { DriverLicense } from '../../../../domain/entities/driver-license.entity';
import { DriverLicenseRepository } from '../../../../domain/repositories/driver-license.repository';
import { DriverLicenseOrmEntity } from '../entities/driver-license.orm';
import { DriverLicenseMapper } from '../mappers/driver-license.mapper';

@Injectable()
export class TypeOrmDriverLicenseRepository implements DriverLicenseRepository {
  constructor(
    @InjectRepository(DriverLicenseOrmEntity)
    private readonly repo: Repository<DriverLicenseOrmEntity>,
  ) {}

  async findByDocumentNumber(
    documentNumber: string,
  ): Promise<DriverLicense | null> {
    const orm = await this.repo.findOne({
      where: { documentNumber, deletedAt: IsNull() },
    });
    return orm ? DriverLicenseMapper.toDomain(orm) : null;
  }

  async findByDocumentNumberIncludingDeleted(
    documentNumber: string,
  ): Promise<DriverLicense | null> {
    const orm = await this.repo.findOne({
      where: { documentNumber },
      withDeleted: true,
    });
    return orm ? DriverLicenseMapper.toDomain(orm) : null;
  }

  async findByProfileId(profileId: string): Promise<DriverLicense | null> {
    const orm = await this.repo.findOne({
      where: { profileId, deletedAt: IsNull() },
    });
    return orm ? DriverLicenseMapper.toDomain(orm) : null;
  }

  async save(license: DriverLicense): Promise<DriverLicense> {
    const orm = DriverLicenseMapper.toOrm(license);
    const saved = await this.repo.save(orm);
    return DriverLicenseMapper.toDomain(saved);
  }

  async restore(documentNumber: string): Promise<void> {
    await this.repo.restore({ documentNumber });
  }

  async softDelete(documentNumber: string): Promise<void> {
    await this.repo.softDelete({ documentNumber });
  }
}
