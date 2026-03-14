import { IsEmail, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

export class RequestCodeDto {
  @IsEmail({}, { message: 'Email inválido o no proporcionado' })
  @IsNotEmpty({ message: 'Email es obligatorio' })
  email: string;
}

export class VerifyResetCodeDto {
  @IsNotEmpty({ message: 'Email es obligatorio' })
  email: string;

  @IsNotEmpty({ message: 'El código es obligatorio' })
  @MinLength(6, { message: 'El código debe tener 6 dígitos' })
  @MaxLength(6, { message: 'El código debe tener 6 dígitos' })
  @Matches(/^[0-9]{6}$/, { message: 'El código debe ser numérico de 6 dígitos' })
  code: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(10, { message: 'La contraseña debe tener como máximo 10 caracteres' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])/, {
    message: 'La contraseña debe incluir al menos una letra mayúscula, una minúscula y un carácter especial',
  })
  newPassword: string;
}

export class VerifyEmailCodeDto {
  @IsEmail({}, { message: 'Email inválido o no proporcionado' })
  @IsNotEmpty({ message: 'Email es obligatorio' })
  email: string;

  @IsNotEmpty({ message: 'El código es obligatorio' })
  @MinLength(6, { message: 'El código debe tener 6 dígitos' })
  @MaxLength(6, { message: 'El código debe tener 6 dígitos' })
  @Matches(/^[0-9]{6}$/, { message: 'El código debe ser numérico de 6 dígitos' })
  code: string;
}
