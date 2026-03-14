import { Address } from '../entities/address.entity';

export const ADDRESS_REPOSITORY = Symbol('ADDRESS_REPOSITORY');

export interface AddressRepository {
  save(address: Address): Promise<void>;
  findById(id: string): Promise<Address | null>;
  findByCustomerId(customerId: string): Promise<Address[]>;
  remove(address: Address): Promise<void>;
}
