import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, Matches, IsUrl } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Gender } from '../../../domain/value-objects/gender.vo';

const COLOMBIAN_PHONE_REGEX = /^3\d{9}$/;

export class CreateCustomerProfileDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @Matches(COLOMBIAN_PHONE_REGEX, {
    message:
      'El teléfono debe ser un número celular colombiano válido. Ej: 3001234567',
  })
  @IsNotEmpty()
  phone: string;

  @IsUrl({}, { message: 'El avatarUrl debe ser una URL válida' })
  @IsOptional()
  avatarUrl?: string;

  @IsDateString(
    {},
    { message: 'birthDate debe tener formato ISO 8601. Ej: 1995-06-15' },
  )
  @IsNotEmpty()
  birthDate: string;

  @IsEnum(Gender, {
    message: `gender debe ser uno de: ${Object.values(Gender).join(', ')}`,
  })
  @IsNotEmpty()
  gender: Gender;
}

export class UpdateCustomerProfileDto extends PartialType(
  CreateCustomerProfileDto,
) { }
