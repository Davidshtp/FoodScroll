export interface RestaurantProps {
  id: string;
  userId: string;
  name: string;
  description: string;
  phone: string;
  email: string;
  logoUrl: string;
  bannerUrl: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Restaurant {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly description: string;
  readonly phone: string;
  readonly email: string;
  readonly logoUrl: string;
  readonly bannerUrl: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  private constructor(props: RestaurantProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.name = props.name;
    this.description = props.description;
    this.phone = props.phone;
    this.email = props.email;
    this.logoUrl = props.logoUrl;
    this.bannerUrl = props.bannerUrl;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.deletedAt = props.deletedAt ?? null;
  }

  static create(props: {
    id: string;
    userId: string;
    name: string;
    description: string;
    phone: string;
    email: string;
    logoUrl: string;
    bannerUrl: string;
  }): Restaurant {
    return new Restaurant({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }

  static reconstitute(props: RestaurantProps): Restaurant {
    return new Restaurant(props);
  }

  updateBasicInfo(props: Partial<{
    name: string;
    description: string;
    phone: string;
    email: string;
    logoUrl: string | null;
    bannerUrl: string | null;
  }>): Restaurant {
    return new Restaurant({
      id: this.id,
      userId: this.userId,
      name: props.name ?? this.name,
      description: props.description ?? this.description,
      phone: props.phone ?? this.phone,
      email: props.email ?? this.email,
      logoUrl: props.logoUrl !== undefined && props.logoUrl !== null ? props.logoUrl : this.logoUrl,
      bannerUrl: props.bannerUrl !== undefined && props.bannerUrl !== null ? props.bannerUrl : this.bannerUrl,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
    });
  }
}
