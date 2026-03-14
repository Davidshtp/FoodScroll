import {Controller,Get,Post,Patch,Delete,Body,Param,Headers} from '@nestjs/common';
import { CreateAddressUseCase } from '../../../application/usecases/address/create-address.usecase';
import { GetAddressesUseCase } from '../../../application/usecases/address/get-addresses.usecase';
import { UpdateAddressUseCase } from '../../../application/usecases/address/update-address.usecase';
import { DeleteAddressUseCase } from '../../../application/usecases/address/delete-address.usecase';
import { CreateAddressDto, UpdateAddressDto } from '../dtos/address.dto';

@Controller('address')
export class AddressController {
  constructor(
    private readonly createAddressUseCase: CreateAddressUseCase,
    private readonly getAddressesUseCase: GetAddressesUseCase,
    private readonly updateAddressUseCase: UpdateAddressUseCase,
    private readonly deleteAddressUseCase: DeleteAddressUseCase,
  ) {}

  @Post()
  async create(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateAddressDto,
  ) {
    const result = await this.createAddressUseCase.execute({
      customerId: userId,
      ...dto,
    });
    return result.address;
  }

  @Get()
  async findMyAddresses(@Headers('x-user-id') userId: string) {
    const result = await this.getAddressesUseCase.execute({ customerId: userId });
    return result.addresses;
  }

  @Patch(':addressId')
  async update(
    @Headers('x-user-id') userId: string,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    const result = await this.updateAddressUseCase.execute({
      addressId,
      customerId: userId,
      ...dto,
    });
    return result.address;
  }

  @Delete(':addressId')
  async remove(
    @Headers('x-user-id') userId: string,
    @Param('addressId') addressId: string,
  ) {
    return this.deleteAddressUseCase.execute({ addressId, customerId: userId });
  }
}
