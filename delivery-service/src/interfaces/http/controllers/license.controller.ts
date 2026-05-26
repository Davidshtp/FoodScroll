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
  VerifyLicenseUseCase,
  ResolveLicenseCaptchaUseCase,
  GetLicenseUseCase,
  DeleteLicenseUseCase,
} from '../../../application/usecases/license';
import {
  VerifyLicenseDto,
  ResolveLicenseCaptchaDto,
} from '../dtos/verify-license.dto';
import { CurrentUser } from '../decorators/current-user.decorator';

interface MulterFile {
  buffer: Buffer;
}

@Controller('license')
@UseGuards(JwtAuthGuard)
export class LicenseController {
  constructor(
    private readonly verifyLicenseUseCase: VerifyLicenseUseCase,
    private readonly resolveLicenseCaptchaUseCase: ResolveLicenseCaptchaUseCase,
    private readonly getLicenseUseCase: GetLicenseUseCase,
    private readonly deleteLicenseUseCase: DeleteLicenseUseCase,
  ) {}

  @Post('verify')
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(200)
  async verify(
    @UploadedFile() file: MulterFile,
    @CurrentUser('id') userId: string,
    @Headers('authorization') authorization: string,
    @Body() dto: VerifyLicenseDto,
  ) {
    let imageBuffer: Buffer | undefined;

    if (file) {
      imageBuffer = file.buffer;
    } else if (dto.imageBase64) {
      imageBuffer = Buffer.from(dto.imageBase64, 'base64');
    }

    const hasManualData = !!(dto.documentType && dto.documentNumber);
    if (!imageBuffer && !hasManualData) {
      throw new BadRequestException(
        'Imagen o datos (documentType+documentNumber) requeridos',
      );
    }

    const result = await this.verifyLicenseUseCase.execute({
      userId,
      imageBuffer,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      authorization,
    });

    return {
      message: result.license.isActive
        ? 'Licencia de conducción verificada correctamente'
        : 'Licencia registrada, pero no se encuentra activa',
      license: result.license,
      status: result.status,
      access_token: result.access_token,
    };
  }

  @Post('resolve-captcha')
  @HttpCode(200)
  async resolveCaptcha(
    @CurrentUser('id') userId: string,
    @Headers('authorization') authorization: string,
    @Body() dto: ResolveLicenseCaptchaDto,
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

    const result = await this.resolveLicenseCaptchaUseCase.execute({
      userId,
      sessionId: parsed.sessionId,
      captchaText: dto.captchaText,
      documentType: dto.documentType || parsed.documentType,
      documentNumber: dto.documentNumber || parsed.documentNumber,
      authorization,
    });

    return {
      message: result.license.isActive
        ? 'Licencia de conducción verificada correctamente'
        : 'Licencia registrada, pero no se encuentra activa',
      license: result.license,
      status: result.status,
      access_token: result.access_token,
    };
  }

  @Get()
  async find(@CurrentUser('id') userId: string) {
    return this.getLicenseUseCase.execute(userId);
  }

  @Delete()
  async deleteLicense(
    @CurrentUser('id') userId: string,
    @Headers('authorization') authorization: string,
  ) {
    const result = await this.deleteLicenseUseCase.execute({
      userId,
      authorization,
    });
    return {
      message: result.message,
      access_token: result.access_token,
    };
  }
}
