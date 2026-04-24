import { Controller, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UpdateUserUseCase } from '../../../application/usecases/user';

interface UpdateUserDto {
  isActive?: boolean;
  onboardingStatus?: string;
}

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    client: string;
    appStatus: string | null;
  };
  params: {
    userId: string;
  };
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly updateUserUseCase: UpdateUserUseCase) {}

  @Patch(':userId/onboarding')
  async updateUser(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateUserDto,
  ) {
    const result = await this.updateUserUseCase.execute({
      userId: req.params.userId,
      requesterUserId: req.user.id,
      isActive: dto.isActive,
      onboardingStatus: dto.onboardingStatus,
    });

    return result;
  }
}