import { VehicleType } from '../enums/vehicle-type.enum';

export class Vehicle {
  constructor(
    public readonly id: string,
    public readonly profileId: string,
    public readonly vehicleType: VehicleType,
    public readonly plate: string | null,
    public readonly brand: string | null,
    public readonly line: string | null,
    public readonly modelYear: number | null,
    public readonly color: string | null,
    // SOAT (latest status only)
    public readonly soatStatus: string | null,
    public readonly soatExpiry: Date | null,
    // Techno (latest status only)
    public readonly technoStatus: string | null,
    public readonly technoExpiry: Date | null,
    // Metadata
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}

  static create(
    id: string,
    profileId: string,
    vehicleType: VehicleType,
    plate?: string,
    brand?: string,
    line?: string,
    modelYear?: number,
    color?: string,
  ): Vehicle {
    return new Vehicle(
      id,
      profileId,
      vehicleType,
      plate || null,
      brand || null,
      line || null,
      modelYear || null,
      color || null,
      null,
      null,
      null,
      null,
      new Date(),
      new Date(),
      null,
    );
  }
}
