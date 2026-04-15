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
    public readonly isPrimary: boolean,
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
      false,
      null,
      null,
      null,
      null,
      new Date(),
      new Date(),
      null,
    );
  }

  markAsPrimary(): Vehicle {
    return new Vehicle(
      this.id,
      this.profileId,
      this.vehicleType,
      this.plate,
      this.brand,
      this.line,
      this.modelYear,
      this.color,
      true,
      this.soatStatus,
      this.soatExpiry,
      this.technoStatus,
      this.technoExpiry,
      this.createdAt,
      new Date(),
      this.deletedAt,
    );
  }

  softDelete(): Vehicle {
    return new Vehicle(
      this.id,
      this.profileId,
      this.vehicleType,
      this.plate,
      this.brand,
      this.line,
      this.modelYear,
      this.color,
      false,
      this.soatStatus,
      this.soatExpiry,
      this.technoStatus,
      this.technoExpiry,
      this.createdAt,
      new Date(),
      new Date(),
    );
  }

  canWork(): boolean {
    const now = new Date();
    const soatValid =
      this.soatExpiry &&
      this.soatExpiry >= now &&
      this.soatStatus === 'VIGENTE';
    const technoValid =
      this.technoExpiry &&
      this.technoExpiry >= now &&
      this.technoStatus === 'VIGENTE';
    return !!(soatValid && technoValid);
  }
}
