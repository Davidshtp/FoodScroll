import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  Headers,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  CreateDeliveryProfileUseCase,
  GetDeliveryProfileUseCase,
  UpdateDeliveryProfileUseCase,
  UploadAvatarUseCase,
  DeleteAvatarUseCase,
} from '../../../application/usecases/delivery-profile';
import { CreateDeliveryProfileDto, UpdateDeliveryProfileDto } from '../dtos';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('delivery-profile')
@UseGuards(JwtAuthGuard)
export class DeliveryProfileController {
  constructor(
    private readonly createProfileUseCase: CreateDeliveryProfileUseCase,
    private readonly getProfileUseCase: GetDeliveryProfileUseCase,
    private readonly updateProfileUseCase: UpdateDeliveryProfileUseCase,
    private readonly uploadAvatarUseCase: UploadAvatarUseCase,
    private readonly deleteAvatarUseCase: DeleteAvatarUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  async create(
    @CurrentUser('id') userId: string,
    @Headers('authorization') authorization: string,
    @Body() dto: CreateDeliveryProfileDto,
  ) {
    const result = await this.createProfileUseCase.execute({
      userId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      birthDate: new Date(dto.birthDate),
      gender: dto.gender,
      vehicleType: dto.vehicleType,
      authorization,
    });
    return {
      ...result.profile,
      access_token: result.access_token,
    };
  }

  @Get()
  async findMe(@CurrentUser('id') userId: string) {
    return this.getProfileUseCase.execute(userId);
  }

  @Patch()
  async update(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateDeliveryProfileDto,
  ) {
    return this.updateProfileUseCase.execute(userId, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      gender: dto.gender,
      avatarUrl: dto.avatarUrl,
    });
  }

  @Patch('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.uploadAvatarUseCase.execute({ userId, file });
    return { avatarUrl: result.avatarUrl };
  }

  @Delete('avatar')
  async deleteAvatar(@CurrentUser('id') userId: string) {
    const result = await this.deleteAvatarUseCase.execute({ userId });
    return { avatarUrl: result.avatarUrl };
  }
}
