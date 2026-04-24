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
    public readonly vehicleType: VehicleType | null,
    public readonly avatarUrl: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
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
    vehicleType: VehicleType | null,
    avatarUrl?: string,
  ): DeliveryProfile {
    const now = new Date();
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
      avatarUrl ?? null,
      now,
      now,
    );
  }
}
