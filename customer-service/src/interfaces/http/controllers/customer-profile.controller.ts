import { Controller, Get, Post, Patch, Delete, Body, Headers, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateCustomerProfileUseCase } from '../../../application/usecases/customer-profile/create-customer-profile.usecase';
import { GetCustomerProfileUseCase } from '../../../application/usecases/customer-profile/get-customer-profile.usecase';
import { UpdateCustomerProfileUseCase } from '../../../application/usecases/customer-profile/update-customer-profile.usecase';
import { UploadAvatarUseCase } from '../../../application/usecases/customer-profile/upload-avatar.usecase';
import { DeleteAvatarUseCase } from '../../../application/usecases/customer-profile/delete-avatar.usecase';
import { CreateCustomerProfileDto } from '../dtos/customer-profile.dto';
import { UpdateCustomerProfileDto } from '../dtos/customer-profile.dto';
import { UserId } from '../decorators/user-id.decorator';

@Controller('customer-profile')
export class CustomerProfileController {
  constructor(
    private readonly createProfileUseCase: CreateCustomerProfileUseCase,
    private readonly getProfileUseCase: GetCustomerProfileUseCase,
    private readonly updateProfileUseCase: UpdateCustomerProfileUseCase,
    private readonly uploadAvatarUseCase: UploadAvatarUseCase,
    private readonly deleteAvatarUseCase: DeleteAvatarUseCase,
  ) {}

@Post()
  async create(
    @UserId() userId: string,
    @Headers('authorization') authorization: string,
    @Body() dto: CreateCustomerProfileDto,
  ) {
    const result = await this.createProfileUseCase.execute({
      userId,
      ...dto,
      authorization,
    });
    return {
      ...result.profile,
      access_token: result.access_token,
    };
  }

  @Get()
  async findMe(@UserId() userId: string) {
    const result = await this.getProfileUseCase.execute({ userId });
    return {
      ...result.profile,
      addresses: result.addresses,
    };
  }

  @Patch()
  async update(
    @UserId() userId: string,
    @Body() dto: UpdateCustomerProfileDto,
  ) {
    const result = await this.updateProfileUseCase.execute({
      userId,
      ...dto,
    });
    return result.profile;
  }

  @Patch('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UserId() userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.uploadAvatarUseCase.execute({ userId, file });
    return { avatarUrl: result.avatarUrl };
  }

  @Delete('avatar')
  async deleteAvatar(@UserId() userId: string) {
    const result = await this.deleteAvatarUseCase.execute({ userId });
    return { avatarUrl: result.avatarUrl };
  }
}
