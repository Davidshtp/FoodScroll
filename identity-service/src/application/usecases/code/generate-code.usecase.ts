import { Inject, Injectable } from '@nestjs/common';
import { Code } from '../../../domain/entities/code.entity';
import { CodeType } from '../../../domain/value-objects/code-type.vo';
import { UserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository';
import { CodeRepository, CODE_REPOSITORY } from '../../../domain/repositories/code.repository';
import { EmailSender, EMAIL_SENDER } from '../../ports/email-sender.port';
import { UserNotFoundError, EmailAlreadyVerifiedError } from '../../../domain/errors/domain.errors';

export interface GenerateCodeInput {
  email: string;
  type: CodeType;
}

export interface GenerateCodeOutput {
  ok: boolean;
}

@Injectable()
export class GenerateCodeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(CODE_REPOSITORY) private readonly codeRepo: CodeRepository,
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSender,
  ) {}

  async execute(input: GenerateCodeInput): Promise<GenerateCodeOutput> {
    // Buscar usuario
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new UserNotFoundError();
    }

    // Si es confirmación de email y ya está verificado
    if (input.type === CodeType.CONFIRM_EMAIL && user.isVerified) {
      throw new EmailAlreadyVerifiedError();
    }

    // Invalidar códigos anteriores del mismo tipo
    await this.codeRepo.invalidateAllByUserIdAndType(user.id, input.type);

    // Generar nuevo código
    const code = Code.create(user.id, input.type);
    await this.codeRepo.save(code);

    // Enviar email
    try {
      await this.emailSender.sendCode(input.email, code.code, {
        type: input.type,
        expiryMinutes: Code.getExpiryMinutes(),
      });
    } catch (error) {
      // Log error but don't fail the operation
    }

    return { ok: true };
  }
}
