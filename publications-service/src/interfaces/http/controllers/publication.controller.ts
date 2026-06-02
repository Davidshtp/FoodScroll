import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { UserId } from '../decorators/user-id.decorator';
import { JwtAuthGuard, ServiceSecretGuard } from '../guards';
import { CreatePublicationUseCase } from '../../../application/usecases/create-publication.usecase';
import { GetPublicationUseCase } from '../../../application/usecases/get-publication.usecase';
import { GetPublicationsByRestaurantUseCase } from '../../../application/usecases/get-publications-by-restaurant.usecase';
import { UpdatePublicationUseCase } from '../../../application/usecases/update-publication.usecase';
import { DeletePublicationUseCase } from '../../../application/usecases/delete-publication.usecase';
import { CreatePublicationDto } from '../../../application/dtos/create-publication.dto';
import { UpdatePublicationDto } from '../../../application/dtos/update-publication.dto';
import { CloudinaryService } from '../../../infrastructure/cloudinary/cloudinary.service';
import { RestaurantClientService } from '../../../infrastructure/http/restaurant-client.service';

@Controller('publications')
@UseGuards(JwtAuthGuard, ServiceSecretGuard)
export class PublicationController {
  constructor(
    private readonly createPublicationUseCase: CreatePublicationUseCase,
    private readonly getPublicationUseCase: GetPublicationUseCase,
    private readonly getPublicationsByRestaurantUseCase: GetPublicationsByRestaurantUseCase,
    private readonly updatePublicationUseCase: UpdatePublicationUseCase,
    private readonly deletePublicationUseCase: DeletePublicationUseCase,
    private readonly cloudinaryService: CloudinaryService,
    private readonly restaurantClientService: RestaurantClientService,
  ) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 10))
  async createPublication(
    @Body() dto: CreatePublicationDto,
    @UploadedFiles() files: Express.Multer.File[],
    @UserId() userId: string,
    @Req() req: Request,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least 1 image is required');
    }

    if (files.length > 10) {
      throw new BadRequestException('Maximum 10 images are allowed');
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestException('Authorization header is required');
    }
    const jwt = authHeader.replace('Bearer ', '');

    const restaurantData = await this.restaurantClientService.getRestaurantByUserId(userId, jwt);
    const restaurantId = restaurantData.restaurant.id;

    const imageUrls = await this.cloudinaryService.uploadImages(files);

    return await this.createPublicationUseCase.execute(
      restaurantId,
      dto.title,
      dto.description,
      dto.type,
      dto.price,
      imageUrls,
    );
  }

  @Get(':id')
  async getPublication(
    @Param('id') id: string,
    @UserId() userId: string,
  ) {
    return await this.getPublicationUseCase.execute(id);
  }

  @Get()
  async getPublicationsByRestaurant(
    @UserId() userId: string,
    @Req() req: Request,
  ) {
    const authHeader = req.headers.authorization;
    const jwt = authHeader?.replace('Bearer ', '') || '';
    const restaurantData = await this.restaurantClientService.getRestaurantByUserId(userId, jwt);
    return await this.getPublicationsByRestaurantUseCase.execute(restaurantData.restaurant.id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files', 10))
  async updatePublication(
    @Param('id') id: string,
    @Body() dto: UpdatePublicationDto,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @UserId() userId: string,
    @Req() req: Request,
  ) {
    const existing = await this.getPublicationUseCase.execute(id);
    let currentUrls = existing.getImageUrls();

    const urlsToDelete = this.parseImageUrlsToDelete(req.body);

    if (urlsToDelete.length > 0) {
      const invalid = urlsToDelete.filter(url => !currentUrls.includes(url));
      if (invalid.length > 0) {
        throw new BadRequestException(
          `Image URLs not found in publication: ${invalid.join(', ')}`,
        );
      }
    }

    const afterDelete = currentUrls.length - urlsToDelete.length;
    const filesCount = files?.length || 0;
    const finalCount = afterDelete + filesCount;

    if (finalCount < 1) {
      throw new BadRequestException('At least 1 image is required');
    }
    if (finalCount > 10) {
      throw new BadRequestException('Maximum 10 images are allowed');
    }

    let newUrls: string[] = [];
    if (files && files.length > 0) {
      newUrls = await this.cloudinaryService.uploadImages(files);
    }

    if (urlsToDelete.length > 0) {
      await this.cloudinaryService.deleteImages(urlsToDelete);
      currentUrls = currentUrls.filter(url => !urlsToDelete.includes(url));
    }

    currentUrls = [...currentUrls, ...newUrls];

    return await this.updatePublicationUseCase.execute(
      id,
      dto.title,
      dto.description,
      dto.type,
      dto.price,
      currentUrls,
    );
  }

  @Delete(':id')
  async deletePublication(
    @Param('id') id: string,
    @UserId() userId: string,
  ) {
    await this.deletePublicationUseCase.execute(id);
    return { message: 'Publication deleted successfully' };
  }

  private parseImageUrlsToDelete(body: any): string[] {
    const raw = body?.imageUrlsToDelete;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (typeof parsed === 'string') {
          try {
            const innerParsed = JSON.parse(parsed);
            if (Array.isArray(innerParsed)) return innerParsed;
            return [parsed];
          } catch {
            return [parsed];
          }
        }
        return [];
      }       catch {
        const trimmed = raw.trim();
        if (!trimmed) return [];
        return trimmed.split(',').map(u => u.trim()).filter(u => u.length > 0);
      }
    }
    return [];
  }
}
