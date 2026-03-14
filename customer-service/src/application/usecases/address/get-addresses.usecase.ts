import { Inject, Injectable } from '@nestjs/common';
import { Address } from '../../../domain/entities/address.entity';
import {AddressRepository,ADDRESS_REPOSITORY} from '../../../domain/repositories/address.repository';

export interface GetAddressesInput {
  customerId: string;
}

export interface GetAddressesOutput {
  addresses: Address[];
}

@Injectable()
export class GetAddressesUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepo: AddressRepository,
  ) {}

  async execute(input: GetAddressesInput): Promise<GetAddressesOutput> {
    const addresses = await this.addressRepo.findByCustomerId(input.customerId);
    return { addresses };
  }
}
