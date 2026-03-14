import { CustomerProfile } from '../../../../domain/entities/customer-profile.entity';
import { Gender } from '../../../../domain/value-objects/gender.vo';
import { OnboardingStatus } from '../../../../domain/value-objects/onboarding-status.vo';
import { CustomerProfileOrmEntity } from '../entities/customer-profile.orm-entity';

export class CustomerProfileMapper {
  static toDomain(orm: CustomerProfileOrmEntity): CustomerProfile {
    return CustomerProfile.reconstitute({
      id: orm.id,
      userId: orm.userId,
      firstName: orm.firstName,
      lastName: orm.lastName,
      phone: orm.phone,
      avatarUrl: orm.avatarUrl ?? null,
      birthDate: orm.birthDate,
      gender: orm.gender as Gender,
      onboardingStatus: orm.onboardingStatus as OnboardingStatus,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt ?? null,
    });
  }

  static toOrm(domain: CustomerProfile): CustomerProfileOrmEntity {
    const orm = new CustomerProfileOrmEntity();
    orm.id = domain.id;
    orm.userId = domain.userId;
    orm.firstName = domain.firstName;
    orm.lastName = domain.lastName;
    orm.phone = domain.phone;
    orm.avatarUrl = domain.avatarUrl;
    orm.birthDate = domain.birthDate;
    orm.gender = domain.gender;
    orm.onboardingStatus = domain.onboardingStatus;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    orm.deletedAt = domain.deletedAt ?? null;
    return orm;
  }
}
