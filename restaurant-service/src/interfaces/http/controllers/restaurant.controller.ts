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
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  CreateRestaurantUseCase,
  GetRestaurantUseCase,
  UpdateRestaurantUseCase,
  DeleteRestaurantUseCase,
} from '../../../application/usecases/restaurant';
import { CreateRestaurantDto, UpdateRestaurantDto } from '../dtos';
import { UserId } from '../decorators/user-id.decorator';

@Controller('restaurant')
@UseGuards(JwtAuthGuard)
export class RestaurantController {
  constructor(
    private readonly createRestaurantUseCase: CreateRestaurantUseCase,
    private readonly getRestaurantUseCase: GetRestaurantUseCase,
    private readonly updateRestaurantUseCase: UpdateRestaurantUseCase,
    private readonly deleteRestaurantUseCase: DeleteRestaurantUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  async create(
    @UserId() userId: string,
    @Headers('authorization') authorization: string,
    @Body() dto: CreateRestaurantDto,
  ) {
    const result = await this.createRestaurantUseCase.execute({
      userId,
      name: dto.name,
      description: dto.description,
      phone: dto.phone,
      email: dto.email,
      authorization,
    });
    return {
      ...result.restaurant,
      access_token: result.access_token,
    };
  }

  @Get()
  async findMe(@UserId() userId: string) {
    return this.getRestaurantUseCase.execute(userId);
  }

  @Patch()
  async update(
    @UserId() userId: string,
    @Body() dto: UpdateRestaurantDto,
  ) {
    return this.updateRestaurantUseCase.execute({
      userId,
      name: dto.name,
      description: dto.description,
      phone: dto.phone,
      email: dto.email,
      logoUrl: dto.logoUrl,
      bannerUrl: dto.bannerUrl,
    });
  }

  @Delete()
  @HttpCode(200)
  async remove(
    @UserId() userId: string,
    @Headers('authorization') authorization: string,
  ) {
    return this.deleteRestaurantUseCase.execute({
      userId,
      authorization,
    });
  }
}
