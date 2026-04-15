import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DataSource } from 'typeorm';
import {
  Vehicle,
  VehicleType,
  VehicleSoat,
  VehicleTechno,
} from '../../../domain';
import {
  VehicleRepository,
  VEHICLE_REPOSITORY,
} from '../../../domain/repositories';
import {
  DeliveryProfileRepository,
  DELIVERY_PROFILE_REPOSITORY,
} from '../../../domain/repositories';
import {
  RuntVerificationPort,
  RUNT_VERIFICATION_PORT,
} from '../../../application/ports/runt-verification.port';
import {
  CaptchaResolutionError,
  RuntNeedsManualLicenseDataError,
  RuntVerificationError,
} from '../../../domain/errors/domain.errors';
import { GetDeliveryProfileUseCase } from '../delivery-profile';
import { VehicleOrmEntity } from '../../../infrastructure/persistence/typeorm/entities/vehicle.orm';
import { VehicleSoatOrmEntity } from '../../../infrastructure/persistence/typeorm/entities/vehicle-soat.orm';
import { VehicleTechnoOrmEntity } from '../../../infrastructure/persistence/typeorm/entities/vehicle-techno.orm';
import { DeliveryProfileOrmEntity } from '../../../infrastructure/persistence/typeorm/entities/delivery-profile.orm';
import { VehicleMapper } from '../../../infrastructure/persistence/typeorm/mappers/vehicle.mapper';
import { VehicleSoatMapper } from '../../../infrastructure/persistence/typeorm/mappers/vehicle-soat.mapper';
import { VehicleTechnoMapper } from '../../../infrastructure/persistence/typeorm/mappers/vehicle-techno.mapper';

export interface RegisterVehicleInput {
  userId: string;
  imageBuffer?: Buffer;
  plate?: string;
  documentType?: string;
  documentNumber?: string;
  vehicleType?: VehicleType;
}

export interface RegisterVehicleOutput {
  vehicle: Vehicle;
  soats: VehicleSoat[];
  technos: VehicleTechno[];
  status: {
    canWork: boolean;
    reasons: string[];
  };
}

@Injectable()
export class RegisterVehicleUseCase {
  private readonly logger = new Logger(RegisterVehicleUseCase.name);

  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepo: VehicleRepository,
    @Inject(DELIVERY_PROFILE_REPOSITORY)
    private readonly profileRepo: DeliveryProfileRepository,
    @Inject(RUNT_VERIFICATION_PORT)
    private readonly runtPort: RuntVerificationPort,
    private readonly getProfileUseCase: GetDeliveryProfileUseCase,
    private readonly dataSource: DataSource,
  ) {}

  async execute(input: RegisterVehicleInput): Promise<RegisterVehicleOutput> {
    const { profile } = await this.getProfileUseCase.execute(input.userId);

    const hasImage = input.imageBuffer && input.imageBuffer.length > 0;
    const hasManualData = !!(
      input.plate &&
      input.documentType &&
      input.documentNumber
    );

    if (!hasImage && !hasManualData) {
      throw new RuntVerificationError(
        'Imagen o datos (plate+documentType+documentNumber) requeridos',
        'INVALID_INPUT',
      );
    }

    const result = await this.runtPort.verifyFullAuto({
      imageBuffer: input.imageBuffer,
      plate: input.plate,
      documentType: input.documentType,
      documentNumber: input.documentNumber,
      maxAttempts: 5,
      retryDelayMs: 500,
    });

    if (result.needsManualInput) {
      if (
        result.manualStep === 'captcha' &&
        result.sessionId &&
        result.captchaPngBase64
      ) {
        throw new CaptchaResolutionError(
          JSON.stringify({
            sessionId: result.sessionId,
            captchaPngBase64: result.captchaPngBase64,
            plate: result.prefill?.plate,
            documentType: result.prefill?.documentType,
            documentNumber: result.prefill?.documentNumber,
          }),
        );
      }
      if (result.manualStep === 'license_data') {
        throw new RuntNeedsManualLicenseDataError(
          JSON.stringify({
            prefill: result.prefill || {},
            ocr: result.ocr || {},
          }),
        );
      }
      throw new RuntNeedsManualLicenseDataError(
        JSON.stringify({
          prefill: result.prefill || {},
          ocr: result.ocr || {},
        }),
      );
    }

    if (result.error || !result.verification) {
      throw new RuntVerificationError(
        result.message || 'Error en verificación RUNT',
        result.code || 'RUNT_VERIFICATION_ERROR',
      );
    }

    const verification = result.verification;
    const vehicleInfo = (verification.vehicleInfo || {}) as Record<string, any>;

    const vehicleType = this.deriveVehicleType(
      vehicleInfo.classification,
      vehicleInfo.vehicleClass,
    );

    const latestSoat = this.findLatestSoat(verification.soatHistory || []);
    const latestTechno = this.findLatestTechno(verification.rtmHistory || []);

    return await this.dataSource.transaction(async (manager) => {
      const newVehicle = new Vehicle(
        uuidv4(),
        profile.id,
        input.vehicleType ?? vehicleType,
        vehicleInfo.plate,
        vehicleInfo.brand,
        vehicleInfo.line,
        vehicleInfo.modelYear,
        vehicleInfo.color,
        false,
        verification.soatStatus ?? null,
        latestSoat?.endDate ? new Date(latestSoat.endDate) : null,
        verification.rtmStatus ?? null,
        latestTechno?.expiresAt ? new Date(latestTechno.expiresAt) : null,
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
      for (const item of verification.soatHistory || []) {
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
      for (const item of verification.rtmHistory || []) {
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

      await manager.getRepository(DeliveryProfileOrmEntity).update(profile.id, {
        activeVehicleId: savedVehicle.id,
      });

      const canWork = this.determineCanWork(soats, technos);
      const reasons: string[] = [];
      if (!canWork) {
        const latestSoat = this.findLatestSoat(verification.soatHistory || []);
        const latestTechno = this.findLatestTechno(
          verification.rtmHistory || [],
        );
        if (!latestSoat || latestSoat.status !== 'VIGENTE')
          reasons.push('SOAT_NO_VIGENTE');
        if (!latestTechno || latestTechno.status !== 'VIGENTE')
          reasons.push('RTM_NO_VIGENTE');
      }

      return {
        vehicle: savedVehicle,
        soats,
        technos,
        status: { canWork, reasons },
      };
    });
  }

  private deriveVehicleType(
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

  private determineCanWork(
    soats: VehicleSoat[],
    technos: VehicleTechno[],
  ): boolean {
    const latestSoat = this.getLatestFromArray(soats, 'endDate');
    const latestTechno = this.getLatestFromArray(technos, 'expiresAt');
    const soatOk = latestSoat ? latestSoat.isVigente() : false;
    const technoOk = latestTechno ? latestTechno.isVigente() : false;
    return soatOk && technoOk;
  }

  private getLatestFromArray<
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

  private findLatestSoat(history: any[]): any {
    return this.getLatestFromArray(history, 'endDate');
  }

  private findLatestTechno(history: any[]): any {
    return this.getLatestFromArray(history, 'expiresAt');
  }
}
