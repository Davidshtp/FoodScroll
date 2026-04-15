import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  CreateDeliveryProfileUseCase,
  GetDeliveryProfileUseCase,
  UpdateDeliveryProfileUseCase,
} from '../../../application/usecases/delivery-profile';
import { CreateDeliveryProfileDto, UpdateDeliveryProfileDto } from '../dtos';
import { UserId } from '../decorators/user-id.decorator';

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
    @UserId() userId: string,
    @Body() dto: CreateDeliveryProfileDto,
  ) {
    return this.createProfileUseCase.execute({
      userId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      birthDate: new Date(dto.birthDate),
      gender: dto.gender,
      vehicleType: dto.vehicleType,
    });
  }

  @Get()
  async findMe(@UserId() userId: string) {
    return this.getProfileUseCase.execute(userId);
  }

  @Patch()
  async update(
    @UserId() userId: string,
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

  @Patch('status')
  @HttpCode(200)
  async setActive(
    @UserId() userId: string,
    @Body() dto: { isActive: boolean },
  ) {
    return this.updateProfileUseCase.execute(userId, {
      isActive: dto.isActive,
    });
  }
}
