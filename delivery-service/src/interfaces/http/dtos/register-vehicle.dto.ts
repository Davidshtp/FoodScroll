import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { VehicleType } from '../../../domain/enums';

export class RegisterVehicleDto {
  @IsOptional()
  @IsString()
  plate?: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;
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

  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;
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
