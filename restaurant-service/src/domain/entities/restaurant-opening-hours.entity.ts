export interface RestaurantOpeningHoursProps {
  id: string;
  restaurantId: string;
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class RestaurantOpeningHours {
  readonly id: string;
  readonly restaurantId: string;
  readonly dayOfWeek: number;
  readonly openTime: string | null;
  readonly closeTime: string | null;
  readonly isClosed: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  private constructor(props: RestaurantOpeningHoursProps) {
    this.id = props.id;
    this.restaurantId = props.restaurantId;
    this.dayOfWeek = props.dayOfWeek;
    this.openTime = props.openTime;
    this.closeTime = props.closeTime;
    this.isClosed = props.isClosed;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.deletedAt = props.deletedAt ?? null;
  }

  static create(props: Omit<RestaurantOpeningHoursProps, 'createdAt' | 'updatedAt' | 'deletedAt'>): RestaurantOpeningHours {
    return new RestaurantOpeningHours({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }

  static reconstitute(props: RestaurantOpeningHoursProps): RestaurantOpeningHours {
    return new RestaurantOpeningHours(props);
  }

  update(props: Partial<{
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean;
  }>): RestaurantOpeningHours {
    return new RestaurantOpeningHours({
      id: this.id,
      restaurantId: this.restaurantId,
      dayOfWeek: this.dayOfWeek,
      openTime: props.openTime !== undefined ? props.openTime : this.openTime,
      closeTime: props.closeTime !== undefined ? props.closeTime : this.closeTime,
      isClosed: props.isClosed !== undefined ? props.isClosed : this.isClosed,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
    });
  }
}
