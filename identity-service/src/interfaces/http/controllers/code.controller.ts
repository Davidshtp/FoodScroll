import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { GenerateCodeUseCase } from '../../../application/usecases/code/generate-code.usecase';
import { VerifyEmailCodeUseCase } from '../../../application/usecases/code/verify-email-code.usecase';
import { VerifyResetCodeUseCase } from '../../../application/usecases/code/verify-reset-code.usecase';
import { RequestCodeDto, VerifyResetCodeDto, VerifyEmailCodeDto } from '../dtos/code.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CodeType } from '../../../domain/value-objects/code-type.vo';

@Controller('code')
export class CodeController {
  constructor(
    private readonly generateCodeUseCase: GenerateCodeUseCase,
    private readonly verifyEmailCodeUseCase: VerifyEmailCodeUseCase,
    private readonly verifyResetCodeUseCase: VerifyResetCodeUseCase,
  ) {}

  @Post('request-reset-code')
  async requestResetCode(@Body() dto: RequestCodeDto) {
    return this.generateCodeUseCase.execute({
      email: dto.email,
      type: CodeType.RESET_PASSWORD,
    });
  }

  @Post('verify-reset-code')
  async verifyResetCode(@Body() dto: VerifyResetCodeDto) {
    return this.verifyResetCodeUseCase.execute({
      email: dto.email,
      code: dto.code,
      newPassword: dto.newPassword,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('request-confirm-email')
  async requestConfirmEmail(@Body() dto: RequestCodeDto) {
    return this.generateCodeUseCase.execute({
      email: dto.email,
      type: CodeType.CONFIRM_EMAIL,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-confirm-email')
  async verifyConfirmEmail(@Body() dto: VerifyEmailCodeDto) {
    return this.verifyEmailCodeUseCase.execute({
      email: dto.email,
      code: dto.code,
    });
  }
}
