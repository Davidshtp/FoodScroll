import { IsString, IsDateString, IsEnum, IsNotEmpty } from 'class-validator';
import { DocumentType, Gender, VehicleType } from '../../../domain/enums';

export class CreateDeliveryProfileDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @IsDateString()
  birthDate: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsEnum(VehicleType)
  vehicleType: VehicleType;
}
