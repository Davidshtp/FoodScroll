import { Gender } from '../value-objects/gender.vo';
import { OnboardingStatus } from '../value-objects/onboarding-status.vo';

export interface CustomerProfileProps {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl: string | null;
  birthDate: Date;
  gender: Gender;
  onboardingStatus: OnboardingStatus;
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
  readonly onboardingStatus: OnboardingStatus;
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
    this.onboardingStatus = props.onboardingStatus;
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
      onboardingStatus: OnboardingStatus.REQUIRED_ADDRESS,
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
      onboardingStatus: this.onboardingStatus,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
    });
  }

  completeOnboarding(): CustomerProfile {
    return new CustomerProfile({
      id: this.id,
      userId: this.userId,
      firstName: this.firstName,
      lastName: this.lastName,
      phone: this.phone,
      avatarUrl: this.avatarUrl,
      birthDate: this.birthDate,
      gender: this.gender,
      onboardingStatus: OnboardingStatus.COMPLETED,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
    });
  }

  requireAddress(): CustomerProfile {
    return new CustomerProfile({
      id: this.id,
      userId: this.userId,
      firstName: this.firstName,
      lastName: this.lastName,
      phone: this.phone,
      avatarUrl: this.avatarUrl,
      birthDate: this.birthDate,
      gender: this.gender,
      onboardingStatus: OnboardingStatus.REQUIRED_ADDRESS,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
    });
  }
}
