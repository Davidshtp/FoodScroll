import { Controller, Get, Post, Patch, Body, Headers } from '@nestjs/common';
import { CreateCustomerProfileUseCase } from '../../../application/usecases/customer-profile/create-customer-profile.usecase';
import { GetCustomerProfileUseCase } from '../../../application/usecases/customer-profile/get-customer-profile.usecase';
import { UpdateCustomerProfileUseCase } from '../../../application/usecases/customer-profile/update-customer-profile.usecase';
import { CreateCustomerProfileDto } from '../dtos/customer-profile.dto';
import { UpdateCustomerProfileDto } from '../dtos/customer-profile.dto';

@Controller('customer-profile')
export class CustomerProfileController {
  constructor(
    private readonly createProfileUseCase: CreateCustomerProfileUseCase,
    private readonly getProfileUseCase: GetCustomerProfileUseCase,
    private readonly updateProfileUseCase: UpdateCustomerProfileUseCase,
  ) {}

  @Post()
  async create(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateCustomerProfileDto,
  ) {
    const result = await this.createProfileUseCase.execute({
      userId,
      ...dto,
    });
    return result.profile;
  }

  @Get()
  async findMe(@Headers('x-user-id') userId: string) {
    const result = await this.getProfileUseCase.execute({ userId });
    return {
      ...result.profile,
      addresses: result.addresses,
    };
  }

  @Patch()
  async update(
    @Headers('x-user-id') userId: string,
    @Body() dto: UpdateCustomerProfileDto,
  ) {
    const result = await this.updateProfileUseCase.execute({
      userId,
      ...dto,
    });
    return result.profile;
  }
}
