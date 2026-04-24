import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { DocumentType, Gender, VehicleType } from '../../../domain/enums';
import { IsColombianPhone } from '../validators/colombian.validators';

export class UpdateDeliveryProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  @IsColombianPhone()
  phone?: string;

  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
