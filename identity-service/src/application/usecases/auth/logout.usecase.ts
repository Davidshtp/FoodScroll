import { Inject, Injectable } from '@nestjs/common';
import { UserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository';

export interface LogoutInput {
  userId: string;
}

export interface LogoutOutput {
  loggedOut: boolean;
}

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
  ) {}

  async execute(input: LogoutInput): Promise<LogoutOutput> {
    const user = await this.userRepo.findById(input.userId);
    
    if (user) {
      const revokedUser = user.revokeSessions();
      await this.userRepo.save(revokedUser);
    }

    return { loggedOut: true };
  }
}
