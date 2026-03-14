import { IsString, IsNotEmpty, IsUUID, IsOptional, IsNumber, IsLatitude, IsLongitude, MaxLength } from 'class-validator';
import { PartialType, PickType } from '@nestjs/mapped-types';

export class CreateAddressDto {
  @IsUUID()
  @IsNotEmpty()
  cityId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  alias: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  mainAddress: string | null = null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  neighborhood: string;

  @IsString()
  @IsOptional()
  details?: string;

  @IsNumber()
  @IsLatitude()
  latitude: number;

  @IsNumber()
  @IsLongitude()
  longitude: number;
}

export class UpdateAddressDto extends PartialType(
  PickType(CreateAddressDto, ['alias', 'neighborhood', 'details'] as const),
) { }
