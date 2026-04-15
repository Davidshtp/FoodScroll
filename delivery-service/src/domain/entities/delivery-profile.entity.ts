import { Gender } from '../enums/gender.enum';
import { DocumentType } from '../enums/document-type.enum';
import { VehicleType } from '../enums/vehicle-type.enum';

export class DeliveryProfile {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly phone: string,
    public readonly documentType: DocumentType,
    public readonly documentNumber: string,
    public readonly birthDate: Date,
    public readonly gender: Gender,
    public readonly vehicleType: VehicleType,
    public readonly isActive: boolean,
    public readonly avatarUrl: string | null,
    public readonly activeVehicleId: string | null,
  ) {}

  static create(
    id: string,
    userId: string,
    firstName: string,
    lastName: string,
    phone: string,
    documentType: DocumentType,
    documentNumber: string,
    birthDate: Date,
    gender: Gender,
    vehicleType: VehicleType,
    avatarUrl?: string,
  ): DeliveryProfile {
    return new DeliveryProfile(
      id,
      userId,
      firstName,
      lastName,
      phone,
      documentType,
      documentNumber,
      birthDate,
      gender,
      vehicleType,
      true,
      avatarUrl ?? null,
      null,
    );
  }

  deactivate(): DeliveryProfile {
    return new DeliveryProfile(
      this.id,
      this.userId,
      this.firstName,
      this.lastName,
      this.phone,
      this.documentType,
      this.documentNumber,
      this.birthDate,
      this.gender,
      this.vehicleType,
      false,
      this.avatarUrl,
      this.activeVehicleId,
    );
  }

  updateAvatar(avatarUrl: string): DeliveryProfile {
    return new DeliveryProfile(
      this.id,
      this.userId,
      this.firstName,
      this.lastName,
      this.phone,
      this.documentType,
      this.documentNumber,
      this.birthDate,
      this.gender,
      this.vehicleType,
      this.isActive,
      avatarUrl,
      this.activeVehicleId,
    );
  }

  setActiveVehicle(vehicleId: string): DeliveryProfile {
    return new DeliveryProfile(
      this.id,
      this.userId,
      this.firstName,
      this.lastName,
      this.phone,
      this.documentType,
      this.documentNumber,
      this.birthDate,
      this.gender,
      this.vehicleType,
      this.isActive,
      this.avatarUrl,
      vehicleId,
    );
  }
}
