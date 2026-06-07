import { Controller, Get, Patch, Body, Param, UseGuards, Req, Inject, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UpdateUserUseCase } from '../../../application/usecases/user';
import { UserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository';

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
export class UserController {
  constructor(
    private readonly updateUserUseCase: UpdateUserUseCase,
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
  ) {}

  @Get(':userId')
  async getUserById(@Param('userId') userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return { id: user.id, role: user.role, email: user.email };
  }

  @UseGuards(JwtAuthGuard)
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