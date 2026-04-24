import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  CreateDeliveryProfileUseCase,
  GetDeliveryProfileUseCase,
  UpdateDeliveryProfileUseCase,
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
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      gender: dto.gender,
      vehicleType: dto.vehicleType,
      avatarUrl: dto.avatarUrl,
    });
  }
}
