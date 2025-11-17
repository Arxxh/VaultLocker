import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/interface/current-user.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CredentialsService } from './credentials.service';
import { CreateCredentialDto } from './dto/create-credential.dto';

@Controller('credentials')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Get()
  async findAll(@CurrentUser() user: CurrentUserData) {
    return this.credentialsService.findByUser(Number(user.userId));
  }

  @Post()
  async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateCredentialDto) {
    return this.credentialsService.createForUser(Number(user.userId), dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseIntPipe) credentialId: number,
  ) {
    await this.credentialsService.removeFromUser(Number(user.userId), credentialId);
    return { status: 'ok' };
  }
}
