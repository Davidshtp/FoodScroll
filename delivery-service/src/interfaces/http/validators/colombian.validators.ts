import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsColombianPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isColombianPhone',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message:
          'El teléfono debe ser un número celular colombiano de 10 dígitos (ej: 3001234567)',
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          const cleaned = value.replace(/\D/g, '');
          return cleaned.length === 10 && cleaned.startsWith('3');
        },
      },
    });
  };
}

export function IsAdult(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAdult',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: 'Debes ser mayor de 18 años',
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          if (!value) return false;
          const birthDate = new Date(value);
          if (isNaN(birthDate.getTime())) return false;
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ) {
            age--;
          }
          return age >= 18;
        },
      },
    });
  };
}
