import { IsEmail, IsEnum, MinLength, MaxLength, Matches, IsNotEmpty } from 'class-validator';
import { ClientApp } from '../../../domain/value-objects/client-app.vo';

export class RegisterDto {
  @IsEmail({}, { message: 'Email inválido o no proporcionado' })
  @IsNotEmpty({ message: 'Email es obligatorio' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(10, { message: 'La contraseña debe tener como máximo 10 caracteres' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])/, {
    message: 'La contraseña debe incluir al menos una letra mayúscula, una minúscula y un carácter especial',
  })
  password: string;

  @IsEnum(ClientApp, { message: 'Client inválido o no proporcionado (customer|delivery|restaurant)' })
  client: ClientApp;
}

export class LoginDto {
  @IsEmail({}, { message: 'Email inválido o no proporcionado' })
  @IsNotEmpty({ message: 'Email es obligatorio' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;

  @IsEnum(ClientApp, { message: 'Client inválido o no proporcionado (customer|delivery|restaurant)' })
  client: ClientApp;
}

export class RefreshTokenDto {
  refresh_token?: string;
}
