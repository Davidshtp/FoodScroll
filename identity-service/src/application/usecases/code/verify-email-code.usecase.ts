import { Inject, Injectable } from '@nestjs/common';
import { CodeType } from '../../../domain/value-objects/code-type.vo';
import { UserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository';
import { CodeRepository, CODE_REPOSITORY } from '../../../domain/repositories/code.repository';
import { InvalidCodeError,CodeExpiredError,UserNotFoundError} from '../../../domain/errors/domain.errors';

export interface VerifyEmailCodeInput {
  email: string;
  code: string;
}

export interface VerifyEmailCodeOutput {
  ok: boolean;
}

@Injectable()
export class VerifyEmailCodeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(CODE_REPOSITORY) private readonly codeRepo: CodeRepository,
  ) {}

  async execute(input: VerifyEmailCodeInput): Promise<VerifyEmailCodeOutput> {
    // Buscar usuario
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new UserNotFoundError();
    }

    // Buscar código válido
    const code = await this.codeRepo.findValidByUserIdAndType(
      user.id,
      CodeType.CONFIRM_EMAIL,
    );

    if (!code) {
      throw new InvalidCodeError();
    }

    // Verificar código
    if (code.isValid(input.code)) {
      // Verificar email del usuario
      const verifiedUser = user.verifyEmail();
      await this.userRepo.save(verifiedUser);

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
