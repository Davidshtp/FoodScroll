import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Req,
  UseInterceptors,
  UseGuards,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { Role } from '../../config/constants';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsActiveGuard } from '../../common/guards/is-active.guard';
import { ProxyService } from '../../infrastructure/http/proxy.service';
import FormData from 'form-data';

@Roles(Role.RESTAURANT)
@Controller('restaurant')
export class RestaurantProxyController {
  constructor(private readonly proxy: ProxyService) { }

  @Post('profile')
  async createProfile(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'RESTAURANT',
      path: '/restaurant',
      body,
    });
    return result.data;
  }

  @Get('profile')
  async getProfile(@Req() req: Request, @CurrentUser() user: any) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'RESTAURANT',
      path: '/restaurant',
    });
    return result.data;
  }

  @Patch('profile')
  async updateProfile(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'PATCH',
      service: 'RESTAURANT',
      path: '/restaurant',
      body,
    });
    return result.data;
  }

  @Delete('profile')
  async deleteProfile(@Req() req: Request, @CurrentUser() user: any) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'DELETE',
      service: 'RESTAURANT',
      path: '/restaurant',
    });
    return result.data;
  }

  @Put('address')
  async upsertAddress(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'PUT',
      service: 'RESTAURANT',
      path: '/restaurant/address',
      body,
    });
    return result.data;
  }

  @Get('address')
  async getAddress(@Req() req: Request, @CurrentUser() user: any) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'RESTAURANT',
      path: '/restaurant/address',
    });
    return result.data;
  }

  @Put('opening-hours')
  async upsertOpeningHours(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'PUT',
      service: 'RESTAURANT',
      path: '/restaurant/opening-hours',
      body,
    });
    return result.data;
  }

   @Get('opening-hours')
   async getOpeningHours(@Req() req: Request, @CurrentUser() user: any) {
     const result = await this.proxy.forwardAuthenticated(req, user, {
       method: 'GET',
       service: 'RESTAURANT',
       path: '/restaurant/opening-hours',
     });
     return result.data;
   }

   // Publications endpoints
   @UseGuards(IsActiveGuard)
   @Post('publications')
   @UseInterceptors(FilesInterceptor('files', 10))
   async createPublication(
     @UploadedFiles() files: any[],
     @Body() body: any,
     @Req() req: Request,
     @CurrentUser() user: any,
   ) {
     if (!files || files.length === 0) {
       throw new BadRequestException('At least 1 image is required');
     }

     if (files.length > 10) {
       throw new BadRequestException('Maximum 10 images are allowed');
     }

      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
      });

      if (body.title) formData.append('title', body.title);
      if (body.description) formData.append('description', body.description);
      if (body.type) formData.append('type', body.type);

      const result = await this.proxy.forwardAuthenticated(req, user, {
        method: 'POST',
        service: 'PUBLICATIONS',
        path: '/publications',
        body: formData,
        isMultipart: true,
      });
     return result.data;
   }

   @Get('publications')
   async getPublications(
     @Req() req: Request,
     @CurrentUser() user: any,
   ) {
     const result = await this.proxy.forwardAuthenticated(req, user, {
       method: 'GET',
       service: 'PUBLICATIONS',
       path: '/publications',
     });
     return result.data;
   }

   @Get('publications/:id')
   async getPublication(
     @Req() req: Request,
     @CurrentUser() user: any,
   ) {
     const result = await this.proxy.forwardAuthenticated(req, user, {
       method: 'GET',
       service: 'PUBLICATIONS',
       path: `/publications/${req.params.id}`,
     });
     return result.data;
   }

   @UseGuards(IsActiveGuard)
   @Patch('publications/:id')
   @UseInterceptors(FilesInterceptor('files', 10))
   async updatePublication(
     @UploadedFiles() files: any[],
     @Body() body: any,
     @Req() req: Request,
     @CurrentUser() user: any,
   ) {
     const hasFiles = files && files.length > 0;
     const hasUrlsToDelete = body.imageUrlsToDelete && body.imageUrlsToDelete.length > 0;

     let payload = body;
     let isMultipart = false;

     if (hasFiles || hasUrlsToDelete) {
       const formData = new FormData();

       if (hasFiles) {
         if (files.length > 10) {
           throw new BadRequestException('Maximum 10 images are allowed');
         }
         files.forEach(file => {
           formData.append('files', file.buffer, {
             filename: file.originalname,
             contentType: file.mimetype,
           });
         });
       }

       if (body.title) formData.append('title', body.title);
       if (body.description) formData.append('description', body.description);
       if (body.type) formData.append('type', body.type);
        if (hasUrlsToDelete) {
          formData.append(
            'imageUrlsToDelete',
            typeof body.imageUrlsToDelete === 'string'
              ? body.imageUrlsToDelete
              : JSON.stringify(body.imageUrlsToDelete),
          );
        }

       payload = formData;
       isMultipart = true;
     }

     const result = await this.proxy.forwardAuthenticated(req, user, {
       method: 'PATCH',
       service: 'PUBLICATIONS',
       path: `/publications/${req.params.id}`,
       body: payload,
       isMultipart,
     });
     return result.data;
   }

   @UseGuards(IsActiveGuard)
   @Delete('publications/:id')
   async deletePublication(
     @Req() req: Request,
     @CurrentUser() user: any,
   ) {
     const result = await this.proxy.forwardAuthenticated(req, user, {
       method: 'DELETE',
       service: 'PUBLICATIONS',
       path: `/publications/${req.params.id}`,
     });
     return result.data;
   }
 }
