import {
  IsString,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  MinLength,
} from 'class-validator';
import { DocumentType, Gender, VehicleType } from '../../../domain/enums';
import { IsColombianPhone, IsAdult } from '../validators/colombian.validators';

export class CreateDeliveryProfileDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @IsColombianPhone()
  phone: string;

  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  documentNumber: string;

  @IsDateString()
  @IsAdult()
  birthDate: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsEnum(VehicleType)
  vehicleType: VehicleType;
}
