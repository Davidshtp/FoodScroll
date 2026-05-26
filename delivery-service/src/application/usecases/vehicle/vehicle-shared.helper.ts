import { EntityManager } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  VehicleType,
  Vehicle,
  VehicleSoat,
  VehicleTechno,
} from '../../../domain';
import { VehicleOrmEntity } from '../../../infrastructure/persistence/typeorm/entities/vehicle.orm';
import { VehicleSoatOrmEntity } from '../../../infrastructure/persistence/typeorm/entities/vehicle-soat.orm';
import { VehicleTechnoOrmEntity } from '../../../infrastructure/persistence/typeorm/entities/vehicle-techno.orm';
import { VehicleMapper } from '../../../infrastructure/persistence/typeorm/mappers/vehicle.mapper';
import { VehicleSoatMapper } from '../../../infrastructure/persistence/typeorm/mappers/vehicle-soat.mapper';
import { VehicleTechnoMapper } from '../../../infrastructure/persistence/typeorm/mappers/vehicle-techno.mapper';
import { DeliveryProfileOrmEntity } from '../../../infrastructure/persistence/typeorm/entities/delivery-profile.orm';
import {
  OnboardingStatus,
  DeliveryIdentityPort,
} from '../../ports/delivery-identity.port';

export interface SaveVehicleInput {
  profileId: string;
  vehicleType: VehicleType;
  plate: string | null;
  brand: string | null;
  line: string | null;
  modelYear: number | null;
  color: string | null;
  soatStatus: string | null;
  soatExpiry: Date | null;
  rtmStatus: string | null;
  rtmExpiry: Date | null;
  soatHistory: any[];
  rtmHistory: any[];
  authorization?: string;
  identityPort?: DeliveryIdentityPort;
  userId?: string;
  onboardingStatus?: OnboardingStatus;
  isActiveOverride?: boolean;
}

export interface SaveVehicleResult {
  vehicle: Vehicle;
  soats: VehicleSoat[];
  technos: VehicleTechno[];
  canWork: boolean;
  reasons: string[];
  accessToken: string;
}

export class VehicleSharedHelper {
  static deriveVehicleType(
    classification?: string,
    vehicleClass?: string,
  ): VehicleType {
    if (
      classification === 'MOTO' ||
      vehicleClass?.toLowerCase().includes('motocicleta')
    ) {
      return VehicleType.MOTORCYCLE;
    }
    if (
      classification === 'CARRO' ||
      vehicleClass?.match(/carro|automovil|camioneta|campero|bus/i)
    ) {
      return VehicleType.CAR;
    }
    return VehicleType.MOTORCYCLE;
  }

  static determineCanWork(
    soats: VehicleSoat[],
    technos: VehicleTechno[],
  ): boolean {
    const latestSoat = VehicleSharedHelper.getLatestFromArray(soats, 'endDate');
    const latestTechno = VehicleSharedHelper.getLatestFromArray(
      technos,
      'expiresAt',
    );
    const soatOk = latestSoat ? latestSoat.isVigente() : false;
    const technoOk = latestTechno ? latestTechno.isVigente() : false;
    return soatOk && technoOk;
  }

  static getLatestFromArray<
    T extends { endDate?: Date | null; expiresAt?: Date | null },
  >(items: T[], dateField: 'endDate' | 'expiresAt'): T | null {
    if (items.length === 0) return null;
    return items.reduce(
      (latest, current) => {
        const currentDate = current[dateField];
        const latestDate = latest?.[dateField];
        if (!latestDate || (currentDate && currentDate > latestDate)) {
          return current;
        }
        return latest;
      },
      null as T | null,
    );
  }

  static findLatestSoat(history: any[]): VehicleSoat | null {
    const latest = VehicleSharedHelper.getLatestFromArray(history, 'endDate');
    if (!latest) return null;
    return VehicleSoat.create(
      latest.id || `soat-${Date.now()}`,
      latest.vehicleId || '',
      latest.policyNumber,
      latest.insurer,
      latest.status,
      latest.issuanceStatus,
      latest.origin,
      latest.tariffType,
      latest.issuedAt ? new Date(latest.issuedAt) : undefined,
      latest.startDate ? new Date(latest.startDate) : undefined,
      latest.endDate ? new Date(latest.endDate) : undefined,
    );
  }

  static findLatestTechno(history: any[]): VehicleTechno | null {
    const latest = VehicleSharedHelper.getLatestFromArray(history, 'expiresAt');
    if (!latest) return null;
    return VehicleTechno.create(
      latest.id || `techno-${Date.now()}`,
      latest.vehicleId || '',
      latest.certificateNumber,
      latest.reviewType,
      latest.cdaName,
      latest.status,
      latest.isCurrent,
      latest.issuedAt ? new Date(latest.issuedAt) : undefined,
      latest.expiresAt ? new Date(latest.expiresAt) : undefined,
      latest.plate,
      latest.consistency,
      latest.certificateUrl,
    );
  }

  static async saveVehicleWithHistory(
    manager: EntityManager,
    input: SaveVehicleInput,
  ): Promise<SaveVehicleResult> {
    const newVehicle = new Vehicle(
      uuidv4(),
      input.profileId,
      input.vehicleType,
      input.plate,
      input.brand,
      input.line,
      input.modelYear,
      input.color,
      input.soatStatus,
      input.soatExpiry,
      input.rtmStatus,
      input.rtmExpiry,
      new Date(),
      new Date(),
      null,
    );

    const vehicleRepo = manager.getRepository(VehicleOrmEntity);
    const soatRepo = manager.getRepository(VehicleSoatOrmEntity);
    const technoRepo = manager.getRepository(VehicleTechnoOrmEntity);

    const orm = VehicleMapper.toOrm(newVehicle);
    const savedVehicleOrm = await vehicleRepo.save(orm);
    const savedVehicle = VehicleMapper.toDomain(savedVehicleOrm);

    const soats: VehicleSoat[] = [];
    for (const item of input.soatHistory || []) {
      const soat = VehicleSoat.create(
        uuidv4(),
        savedVehicle.id,
        item.policyNumber,
        item.insurer,
        item.status,
        item.issuanceStatus,
        item.origin,
        item.tariffType,
        item.issuedAt ? new Date(item.issuedAt) : undefined,
        item.startDate ? new Date(item.startDate) : undefined,
        item.endDate ? new Date(item.endDate) : undefined,
      );
      const soatOrm = VehicleSoatMapper.toOrm(soat);
      const savedSoatOrm = await soatRepo.save(soatOrm);
      soats.push(VehicleSoatMapper.toDomain(savedSoatOrm));
    }

    const technos: VehicleTechno[] = [];
    for (const item of input.rtmHistory || []) {
      const techno = VehicleTechno.create(
        uuidv4(),
        savedVehicle.id,
        item.certificateNumber,
        item.reviewType,
        item.cda,
        item.status,
        item.isCurrent,
        item.issuedAt ? new Date(item.issuedAt) : undefined,
        item.expiresAt ? new Date(item.expiresAt) : undefined,
        item.plate,
        item.consistency,
        item.certificateUrl,
      );
      const technoOrm = VehicleTechnoMapper.toOrm(techno);
      const savedTechnoOrm = await technoRepo.save(technoOrm);
      technos.push(VehicleTechnoMapper.toDomain(savedTechnoOrm));
    }

    const canWork = VehicleSharedHelper.determineCanWork(soats, technos);
    const reasons: string[] = [];
    if (!canWork) {
      const latestSoat = VehicleSharedHelper.findLatestSoat(
        input.soatHistory || [],
      );
      const latestTechno = VehicleSharedHelper.findLatestTechno(
        input.rtmHistory || [],
      );
      if (!latestSoat || latestSoat.status !== 'VIGENTE')
        reasons.push('SOAT_NO_VIGENTE');
      if (!latestTechno || latestTechno.status !== 'VIGENTE')
        reasons.push('RTM_NO_VIGENTE');
    }

    const profileRepo = manager.getRepository(DeliveryProfileOrmEntity);
    await profileRepo.update(
      { id: input.profileId },
      { vehicleType: input.vehicleType },
    );

    let accessToken = '';
    if (input.authorization && input.identityPort && input.userId) {
      const identityResult = await input.identityPort.updateUserStatus({
        userId: input.userId,
        onboardingStatus: input.onboardingStatus || OnboardingStatus.COMPLETED,
        isActive: input.isActiveOverride ?? canWork,
        authorization: input.authorization,
      });
      accessToken = identityResult.access_token;
    }

    return {
      vehicle: savedVehicle,
      soats,
      technos,
      canWork,
      reasons,
      accessToken,
    };
  }
}
