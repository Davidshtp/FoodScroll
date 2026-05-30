export interface RestaurantAddressProps {
  id: string;
  restaurantId: string;
  address: string;
  cityId: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class RestaurantAddress {
  readonly id: string;
  readonly restaurantId: string;
  readonly address: string;
  readonly cityId: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  private constructor(props: RestaurantAddressProps) {
    this.id = props.id;
    this.restaurantId = props.restaurantId;
    this.address = props.address;
    this.cityId = props.cityId;
    this.latitude = props.latitude;
    this.longitude = props.longitude;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.deletedAt = props.deletedAt ?? null;
  }

  static create(props: Omit<RestaurantAddressProps, 'createdAt' | 'updatedAt' | 'deletedAt'>): RestaurantAddress {
    return new RestaurantAddress({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }

  static reconstitute(props: RestaurantAddressProps): RestaurantAddress {
    return new RestaurantAddress(props);
  }

  update(props: Partial<{
    address: string;
    cityId: string;
    latitude: number;
    longitude: number;
  }>): RestaurantAddress {
    return new RestaurantAddress({
      id: this.id,
      restaurantId: this.restaurantId,
      address: props.address ?? this.address,
      cityId: props.cityId ?? this.cityId,
      latitude: props.latitude ?? this.latitude,
      longitude: props.longitude ?? this.longitude,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
    });
  }
}
