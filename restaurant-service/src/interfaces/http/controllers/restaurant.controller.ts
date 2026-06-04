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
  CreateRestaurantUseCase,
  GetRestaurantUseCase,
  UpdateRestaurantUseCase,
  DeleteRestaurantUseCase,
  UploadLogoUseCase,
  UploadBannerUseCase,
  DeleteLogoUseCase,
  DeleteBannerUseCase,
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
    private readonly uploadLogoUseCase: UploadLogoUseCase,
    private readonly uploadBannerUseCase: UploadBannerUseCase,
    private readonly deleteLogoUseCase: DeleteLogoUseCase,
    private readonly deleteBannerUseCase: DeleteBannerUseCase,
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

  @Patch('logo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(
    @UserId() userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.uploadLogoUseCase.execute({ userId, file });
    return { logoUrl: result.imageUrl };
  }

  @Delete('logo')
  async deleteLogo(@UserId() userId: string) {
    const result = await this.deleteLogoUseCase.execute({ userId });
    return { logoUrl: result.imageUrl };
  }

  @Patch('banner')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBanner(
    @UserId() userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.uploadBannerUseCase.execute({ userId, file });
    return { bannerUrl: result.imageUrl };
  }

  @Delete('banner')
  async deleteBanner(@UserId() userId: string) {
    const result = await this.deleteBannerUseCase.execute({ userId });
    return { bannerUrl: result.imageUrl };
  }
}
