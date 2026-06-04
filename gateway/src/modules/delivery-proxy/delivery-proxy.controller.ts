import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { Role } from '../../config/constants';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProxyService } from '../../infrastructure/http/proxy.service';
import FormData from 'form-data';

/**
 * Proxy de delivery.
 * Reenvía las peticiones al delivery service.
 * Requiere JWT y rol DELIVERY.
 */
@Roles(Role.DELIVERY)
@Controller('delivery')
export class DeliveryProxyController {
  constructor(private readonly proxy: ProxyService) {}

  // ───── Perfil ─────

  @Post('profile')
  async createProfile(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'DELIVERY',
      path: '/delivery-profile',
      body,
    });
    return result.data;
  }

  @Get('profile')
  async getProfile(@Req() req: Request, @CurrentUser() user: any) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'DELIVERY',
      path: '/delivery-profile',
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
      service: 'DELIVERY',
      path: '/delivery-profile',
      body,
    });
    return result.data;
  }

  // ───── Avatar ─────

  @Patch('profile/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'PATCH',
      service: 'DELIVERY',
      path: '/delivery-profile/avatar',
      body: formData,
      isMultipart: true,
    });
    return result.data;
  }

  @Delete('profile/avatar')
  async deleteAvatar(
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'DELETE',
      service: 'DELIVERY',
      path: '/delivery-profile/avatar',
    });
    return result.data;
  }

  // ───── Vehicle ─────

  @Post('vehicle')
  @UseInterceptors(FileInterceptor('image'))
  async registerVehicle(
    @UploadedFile() file: any,
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('Imagen de licencia requerida');
    }

    const formData = new FormData();
    formData.append('image', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
    
    if (body.plate) formData.append('plate', body.plate);
    if (body.documentType) formData.append('documentType', body.documentType);
    if (body.documentNumber) formData.append('documentNumber', body.documentNumber);

    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'DELIVERY',
      path: '/vehicle/register-from-image',
      body: formData,
      isMultipart: true,
      timeout: 120000,
    });
    return result.data;
  }

  @Post('vehicle/manual')
  async registerVehicleManual(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'DELIVERY',
      path: '/vehicle/register-manual-data',
      body,
      timeout: 120000,
    });
    return result.data;
  }

  @Post('vehicle/captcha')
  async resolveCaptcha(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'DELIVERY',
      path: '/vehicle/resolve-captcha',
      body,
      timeout: 120000,
    });
    return result.data;
  }

  @Get('vehicle')
  async getVehicle(@Req() req: Request, @CurrentUser() user: any) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'DELIVERY',
      path: '/vehicle',
    });
    return result.data;
  }

  @Delete('vehicle')
  async deleteVehicle(@Req() req: Request, @CurrentUser() user: any) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'DELETE',
      service: 'DELIVERY',
      path: '/vehicle',
    });
    return result.data;
  }

  // ───── License ─────

  @Post('license/verify')
  @UseInterceptors(FileInterceptor('image'))
  async verifyLicense(
    @UploadedFile() file: any,
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const hasManualData = !!(body.documentType && body.documentNumber);
    const hasBase64 = !!(body.imageBase64 && body.imageBase64.length > 0);
    if (!file && !hasManualData && !hasBase64) {
      throw new BadRequestException(
        'Imagen o datos (documentType+documentNumber) requeridos',
      );
    }

    const formData = new FormData();
    if (file) {
      formData.append(
        'image',
        new Blob([file.buffer], { type: file.mimetype }),
        file.originalname,
      );
    }
    if (body.imageBase64) formData.append('imageBase64', body.imageBase64);
    if (body.documentType) formData.append('documentType', body.documentType);
    if (body.documentNumber)
      formData.append('documentNumber', body.documentNumber);

    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'DELIVERY',
      path: '/license/verify',
      body: formData,
      isMultipart: true,
      timeout: 180000,
    });
    return result.data;
  }

  @Post('license/captcha')
  async resolveLicenseCaptcha(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'DELIVERY',
      path: '/license/resolve-captcha',
      body,
      timeout: 120000,
    });
    return result.data;
  }

  @Get('license')
  async getLicense(@Req() req: Request, @CurrentUser() user: any) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'DELIVERY',
      path: '/license',
    });
    return result.data;
  }

  @Delete('license')
  async deleteLicense(@Req() req: Request, @CurrentUser() user: any) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'DELETE',
      service: 'DELIVERY',
      path: '/license',
    });
    return result.data;
  }
}
