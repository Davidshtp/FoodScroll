import { CustomerProfile } from '../entities/customer-profile.entity';

export const CUSTOMER_PROFILE_REPOSITORY = Symbol('CUSTOMER_PROFILE_REPOSITORY');

export interface CustomerProfileRepository {
  save(profile: CustomerProfile): Promise<void>;
  findById(id: string): Promise<CustomerProfile | null>;
  findByUserId(userId: string): Promise<CustomerProfile | null>;
  existsByUserId(userId: string): Promise<boolean>;
}
