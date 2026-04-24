import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class RegisterVehicleDto {
  @IsOptional()
  imageBase64?: string;

  @IsOptional()
  @IsString()
  plate?: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  documentNumber?: string;
}

export class RegisterVehicleManualDto {
  @IsNotEmpty()
  @IsString()
  plate: string;

  @IsNotEmpty()
  @IsString()
  documentType: string;

  @IsNotEmpty()
  @IsString()
  documentNumber: string;
}

export class ResolveRuntCaptchaDto {
  @IsString()
  captchaData: string;

  @IsString()
  captchaText: string;

  @IsString()
  @IsOptional()
  plate?: string;

  @IsString()
  @IsOptional()
  documentType?: string;

  @IsString()
  @IsOptional()
  documentNumber?: string;
}
