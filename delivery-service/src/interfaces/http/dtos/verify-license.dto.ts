import { IsString, IsOptional } from 'class-validator';

export class VerifyLicenseDto {
  @IsOptional()
  imageBase64?: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  documentNumber?: string;
}

export class ResolveLicenseCaptchaDto {
  @IsString()
  captchaData: string;

  @IsString()
  captchaText: string;

  @IsString()
  @IsOptional()
  documentType?: string;

  @IsString()
  @IsOptional()
  documentNumber?: string;
}
