import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Gender } from '../../../domain/enums';
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
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
