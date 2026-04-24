import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Vehicle } from '../../../../domain/entities/vehicle.entity';
import { VehicleSoat } from '../../../../domain/entities/vehicle-soat.entity';
import { VehicleTechno } from '../../../../domain/entities/vehicle-techno.entity';
import { VehicleRepository } from '../../../../domain/repositories/vehicle.repository';
import { VehicleOrmEntity } from '../entities/vehicle.orm';
import { VehicleSoatOrmEntity } from '../entities/vehicle-soat.orm';
import { VehicleTechnoOrmEntity } from '../entities/vehicle-techno.orm';
import { VehicleMapper } from '../mappers/vehicle.mapper';
import { VehicleSoatMapper } from '../mappers/vehicle-soat.mapper';
import { VehicleTechnoMapper } from '../mappers/vehicle-techno.mapper';

@Injectable()
export class TypeOrmVehicleRepository implements VehicleRepository {
  constructor(
    @InjectRepository(VehicleOrmEntity)
    private readonly vehicleRepo: Repository<VehicleOrmEntity>,
    @InjectRepository(VehicleSoatOrmEntity)
    private readonly soatRepo: Repository<VehicleSoatOrmEntity>,
    @InjectRepository(VehicleTechnoOrmEntity)
    private readonly technoRepo: Repository<VehicleTechnoOrmEntity>,
  ) {}

  async save(vehicle: Vehicle): Promise<Vehicle> {
    const orm = VehicleMapper.toOrm(vehicle);
    if (vehicle.id) {
      orm.id = vehicle.id;
    }
    const saved = await this.vehicleRepo.save(orm);
    return VehicleMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Vehicle | null> {
    const orm = await this.vehicleRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    return orm ? VehicleMapper.toDomain(orm) : null;
  }

  async findAllByProfileId(profileId: string): Promise<Vehicle[]> {
    const orms = await this.vehicleRepo.find({
      where: { profileId, deletedAt: IsNull() },
    });
    return orms.map(VehicleMapper.toDomain);
  }

  async softDelete(id: string): Promise<void> {
    await this.vehicleRepo.softDelete({ id });
  }

  async findSoatsByVehicleId(vehicleId: string): Promise<VehicleSoat[]> {
    const orms = await this.soatRepo.find({
      where: { vehicleId },
      order: { createdAt: 'DESC' },
    });
    return orms.map(VehicleSoatMapper.toDomain);
  }

  async findTechnosByVehicleId(vehicleId: string): Promise<VehicleTechno[]> {
    const orms = await this.technoRepo.find({
      where: { vehicleId },
      order: { createdAt: 'DESC' },
    });
    return orms.map(VehicleTechnoMapper.toDomain);
  }
}
