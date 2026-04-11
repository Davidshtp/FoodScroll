import { Gender } from '../value-objects/gender.vo';

export interface CustomerProfileProps {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl: string | null;
  birthDate: Date;
  gender: Gender;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class CustomerProfile {
  readonly id: string;
  readonly userId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string;
  readonly avatarUrl: string | null;
  readonly birthDate: Date;
  readonly gender: Gender;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  private constructor(props: CustomerProfileProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.phone = props.phone;
    this.avatarUrl = props.avatarUrl;
    this.birthDate = props.birthDate;
    this.gender = props.gender;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.deletedAt = props.deletedAt ?? null;
  }

  static create(props: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    phone: string;
    avatarUrl: string | null;
    birthDate: Date;
    gender: Gender;
  }): CustomerProfile {
    return new CustomerProfile({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }

  static reconstitute(props: CustomerProfileProps): CustomerProfile {
    return new CustomerProfile(props);
  }

  update(props: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    avatarUrl: string | null;
    birthDate: Date;
    gender: Gender;
  }>): CustomerProfile {
    return new CustomerProfile({
      id: this.id,
      userId: this.userId,
      firstName: props.firstName ?? this.firstName,
      lastName: props.lastName ?? this.lastName,
      phone: props.phone ?? this.phone,
      avatarUrl: props.avatarUrl !== undefined ? props.avatarUrl : this.avatarUrl,
      birthDate: props.birthDate ?? this.birthDate,
      gender: props.gender ?? this.gender,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
    });
  }
}
