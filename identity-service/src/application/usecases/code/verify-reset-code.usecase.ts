import { Inject, Injectable } from '@nestjs/common';
import { CodeType } from '../../../domain/value-objects/code-type.vo';
import { UserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository';
import { CodeRepository, CODE_REPOSITORY } from '../../../domain/repositories/code.repository';
import { PasswordHasher, PASSWORD_HASHER } from '../../../domain/services/password-hasher';
import { InvalidCodeError,CodeExpiredError,UserNotFoundError} from '../../../domain/errors/domain.errors';

export interface VerifyResetCodeInput {
  email: string;
  code: string;
  newPassword: string;
}

export interface VerifyResetCodeOutput {
  ok: boolean;
}

@Injectable()
export class VerifyResetCodeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(CODE_REPOSITORY) private readonly codeRepo: CodeRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: VerifyResetCodeInput): Promise<VerifyResetCodeOutput> {
    // Buscar usuario
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new UserNotFoundError();
    }

    // Buscar código válido
    const code = await this.codeRepo.findValidByUserIdAndType(
      user.id,
      CodeType.RESET_PASSWORD,
    );

    if (!code) {
      throw new InvalidCodeError();
    }

    // Verificar código
    if (code.isValid(input.code)) {
      // Hash nueva contraseña
      const newHash = await this.hasher.hash(input.newPassword);

      // Actualizar contraseña (esto también revoca sesiones)
      const updatedUser = user.updatePassword(newHash);
      await this.userRepo.save(updatedUser);

      // Marcar código como usado
      const usedCode = code.markAsUsed();
      await this.codeRepo.save(usedCode);

      return { ok: true };
    }

    // Código incorrecto - incrementar intentos fallidos
    const updatedCode = code.incrementFailedAttempts();
    await this.codeRepo.save(updatedCode);

    if (updatedCode.hasExceededMaxAttempts()) {
      throw new CodeExpiredError();
    }

    throw new InvalidCodeError(
      `Código inválido. Intentos fallidos: ${updatedCode.failedAttempts}`,
      updatedCode.failedAttempts,
    );
  }
}
