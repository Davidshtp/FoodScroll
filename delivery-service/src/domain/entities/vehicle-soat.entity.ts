export class VehicleSoat {
  constructor(
    public readonly id: string,
    public readonly vehicleId: string,
    public readonly policyNumber: string | null,
    public readonly insurer: string | null,
    public readonly status: string | null,
    public readonly issuanceStatus: string | null,
    public readonly origin: string | null,
    public readonly tariffType: string | null,
    public readonly issuedAt: Date | null,
    public readonly startDate: Date | null,
    public readonly endDate: Date | null,
    public readonly createdAt: Date,
  ) {}

  static create(
    id: string,
    vehicleId: string,
    policyNumber?: string,
    insurer?: string,
    status?: string,
    issuanceStatus?: string,
    origin?: string,
    tariffType?: string,
    issuedAt?: Date,
    startDate?: Date,
    endDate?: Date,
  ): VehicleSoat {
    return new VehicleSoat(
      id,
      vehicleId,
      policyNumber || null,
      insurer || null,
      status || null,
      issuanceStatus || null,
      origin || null,
      tariffType || null,
      issuedAt || null,
      startDate || null,
      endDate || null,
      new Date(),
    );
  }

  isVigente(): boolean {
    if (this.status !== 'VIGENTE') return false;
    if (!this.endDate) return false;
    return this.endDate >= new Date();
  }
}
