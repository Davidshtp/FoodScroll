import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  RegisterVehicleUseCase,
  GetVehicleUseCase,
  ResolveCaptchaUseCase,
} from '../../../application/usecases/vehicle';
import {
  RegisterVehicleDto,
  RegisterVehicleManualDto,
  ResolveRuntCaptchaDto,
} from '../dtos';
import { UserId } from '../decorators/user-id.decorator';

@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehicleController {
  constructor(
    private readonly registerVehicleUseCase: RegisterVehicleUseCase,
    private readonly getVehicleUseCase: GetVehicleUseCase,
    private readonly resolveCaptchaUseCase: ResolveCaptchaUseCase,
  ) {}

  @Post('register-from-image')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('image'))
  async registerFromImage(
    @UserId() userId: string,
    @UploadedFile() file: any,
    @Body() dto: RegisterVehicleDto,
  ) {
    if (!file) {
      throw new BadRequestException('Imagen de licencia requerida');
    }

    const imageBuffer = Buffer.from(file.buffer);
    const result = await this.registerVehicleUseCase.execute({
      userId,
      imageBuffer,
      plate: dto.plate,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      vehicleType: dto.vehicleType,
    });

    return {
      message: result.status.canWork
        ? 'Vehículo registrado correctamente y cuenta con SOAT y tecnomecánica vigentes.'
        : 'Vehículo registrado, pero estás inhábil hasta tener SOAT y tecnomecánicas vigentes.',
      vehicle: result.vehicle,
      status: result.status,
    };
  }

  @Post('register-manual-data')
  @HttpCode(200)
  async registerManualData(
    @UserId() userId: string,
    @Body() dto: RegisterVehicleManualDto,
  ) {
    const result = await this.registerVehicleUseCase.execute({
      userId,
      plate: dto.plate,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      vehicleType: dto.vehicleType,
    });

    return {
      message: result.status.canWork
        ? 'Vehículo registrado correctamente y cuenta con SOAT y tecnomecánica vigentes.'
        : 'Vehículo registrado, pero estás inhábil hasta tener SOAT y tecnomecánicas vigentes.',
      vehicle: result.vehicle,
      status: result.status,
    };
  }

  @Post('resolve-captcha')
  @HttpCode(200)
  async resolveCaptcha(
    @UserId() userId: string,
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
    });

    return {
      message: result.status.canWork
        ? 'Vehículo registrado correctamente y cuenta con SOAT y tecnomecánica vigentes.'
        : 'Vehículo registrado, pero estás inhábil hasta tener SOAT y tecnomecánicas vigentes.',
      vehicle: result.vehicle,
      status: result.status,
    };
  }

  @Get()
  async findActive(@UserId() userId: string) {
    return this.getVehicleUseCase.execute(userId);
  }
}