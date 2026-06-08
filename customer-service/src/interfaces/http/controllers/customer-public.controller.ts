import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { GetPublicCustomerProfileUseCase } from '../../../application/usecases/customer-profile/get-public-customer-profile.usecase';

@Controller('customer-profile/public')
export class CustomerPublicController {
  constructor(
    private readonly getPublicCustomerProfileUseCase: GetPublicCustomerProfileUseCase,
  ) {}

  @Get(':userId')
  async getProfile(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.getPublicCustomerProfileUseCase.execute(userId);
  }
}
