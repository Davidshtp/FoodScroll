import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  BadRequestException,
  Headers,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  RegisterVehicleUseCase,
  GetVehicleUseCase,
  ResolveCaptchaUseCase,
  DeleteVehicleUseCase,
} from '../../../application/usecases/vehicle';
import {
  RegisterVehicleDto,
  RegisterVehicleManualDto,
  ResolveRuntCaptchaDto,
} from '../dtos';
import { CurrentUser } from '../decorators/current-user.decorator';

interface MulterFile {
  buffer: Buffer;
}

@Controller('vehicle')
@UseGuards(JwtAuthGuard)
export class VehicleController {
  constructor(
    private readonly registerVehicleUseCase: RegisterVehicleUseCase,
    private readonly getVehicleUseCase: GetVehicleUseCase,
    private readonly resolveCaptchaUseCase: ResolveCaptchaUseCase,
    private readonly deleteVehicleUseCase: DeleteVehicleUseCase,
  ) {}

  @Post('register-from-image')
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(200)
  async registerFromImage(
    @UploadedFile() file: MulterFile,
    @CurrentUser('id') userId: string,
    @Headers('authorization') authorization: string,
    @Body() dto: RegisterVehicleDto,
  ) {
    let imageBuffer: Buffer | undefined;

    if (file) {
      imageBuffer = file.buffer;
    } else if (dto.imageBase64) {
      imageBuffer = Buffer.from(dto.imageBase64, 'base64');
    }

    if (!imageBuffer || imageBuffer.length === 0) {
      throw new BadRequestException('Imagen de licencia requerida');
    }

    const result = await this.registerVehicleUseCase.execute({
      userId,
      imageBuffer,
      plate: dto.plate,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      authorization,
    });

    return {
      message: result.status.canWork
        ? 'Vehículo registrado correctamente y cuenta con SOAT y tecnomecánica vigentes.'
        : 'Vehículo registrado, pero estás inhábil hasta tener SOAT y tecnomecánicas vigentes.',
      vehicle: result.vehicle,
      status: result.status,
      access_token: result.access_token,
    };
  }

  @Post('register-manual-data')
  @HttpCode(200)
  async registerManualData(
    @CurrentUser('id') userId: string,
    @Headers('authorization') authorization: string,
    @Body() dto: RegisterVehicleManualDto,
  ) {
    const result = await this.registerVehicleUseCase.execute({
      userId,
      plate: dto.plate,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      authorization,
    });

    return {
      message: result.status.canWork
        ? 'Vehículo registrado correctamente y cuenta con SOAT y tecnomecánica vigentes.'
        : 'Vehículo registrado, pero estás inhábil hasta tener SOAT y tecnomecánicas vigentes.',
      vehicle: result.vehicle,
      status: result.status,
      access_token: result.access_token,
    };
  }

  @Post('resolve-captcha')
  @HttpCode(200)
  async resolveCaptcha(
    @CurrentUser('id') userId: string,
    @Headers('authorization') authorization: string,
    @Body() dto: ResolveRuntCaptchaDto,
  ) {
    let parsed: any;
    try {
      parsed = JSON.parse(dto.captchaData);
    } catch {
      throw new BadRequestException(
        'captchaData inválido: debe ser JSON válido',
      );
    }

    if (!parsed.sessionId) {
      throw new BadRequestException('captchaData debe contener sessionId');
    }

    const result = await this.resolveCaptchaUseCase.execute({
      userId,
      sessionId: parsed.sessionId,
      captchaText: dto.captchaText,
      plate: dto.plate || parsed.plate,
      documentType: dto.documentType || parsed.documentType,
      documentNumber: dto.documentNumber || parsed.documentNumber,
      authorization,
    });

    return {
      message: result.status.canWork
        ? 'Vehículo registrado correctamente y cuenta con SOAT y tecnomecánica vigentes.'
        : 'Vehículo registrado, pero estás inhábil hasta tener SOAT y tecnomecánicas vigentes.',
      vehicle: result.vehicle,
      status: result.status,
      access_token: result.access_token,
    };
  }

  @Get()
  async findActive(@CurrentUser('id') userId: string) {
    return this.getVehicleUseCase.execute(userId);
  }

  @Delete()
  async deleteVehicle(
    @CurrentUser('id') userId: string,
    @Headers('authorization') authorization: string,
  ) {
    const result = await this.deleteVehicleUseCase.execute(
      userId,
      authorization,
    );
    return {
      message: result.message,
      access_token: result.access_token,
    };
  }
}
