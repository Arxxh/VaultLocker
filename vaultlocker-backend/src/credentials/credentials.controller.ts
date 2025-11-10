import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/interface/current-user.interface';
import { CredentialsService } from './credentials.service';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('credentials')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Get()
  async findAll(@CurrentUser() user: CurrentUserData) {
    return this.credentialsService.findByUser(Number(user.userId));
  }
}
