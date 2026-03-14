export interface AddressProps {
  id: string;
  customerId: string;
  cityId: string;
  alias: string;
  mainAddress: string | null;
  neighborhood: string;
  details: string | null;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Address {
  readonly id: string;
  readonly customerId: string;
  readonly cityId: string;
  readonly alias: string;
  readonly mainAddress: string | null;
  readonly neighborhood: string;
  readonly details: string | null;
  readonly latitude: number;
  readonly longitude: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  private constructor(props: AddressProps) {
    this.id = props.id;
    this.customerId = props.customerId;
    this.cityId = props.cityId;
    this.alias = props.alias;
    this.mainAddress = props.mainAddress;
    this.neighborhood = props.neighborhood;
    this.details = props.details;
    this.latitude = props.latitude;
    this.longitude = props.longitude;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.deletedAt = props.deletedAt ?? null;
  }

  static create(props: Omit<AddressProps, 'createdAt' | 'updatedAt' | 'deletedAt'>): Address {
    return new Address({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }

  static reconstitute(props: AddressProps): Address {
    return new Address(props);
  }

  update(props: Partial<{
    alias: string;
    neighborhood: string;
    details: string | null;
  }>): Address {
    return new Address({
      id: this.id,
      customerId: this.customerId,
      cityId: this.cityId,
      alias: props.alias ?? this.alias,
      mainAddress: this.mainAddress,
      neighborhood: props.neighborhood ?? this.neighborhood,
      details: props.details !== undefined ? props.details : this.details,
      latitude: this.latitude,
      longitude: this.longitude,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
    });
  }
}
