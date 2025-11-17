import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Credential } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCredentialDto } from './dto/create-credential.dto';

@Injectable()
export class CredentialsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: number): Promise<Credential[]> {
    return this.prisma.credential.findMany({
      where: { userId },
      select: {
        id: true,
        site: true,
        username: true,
        password: true,
        userId: true,
      },
    });
  }

  async createForUser(userId: number, dto: CreateCredentialDto): Promise<Credential> {
    return this.prisma.credential.create({
      data: {
        site: dto.site,
        username: dto.username,
        password: dto.password,
        userId,
      },
      select: {
        id: true,
        site: true,
        username: true,
        password: true,
        userId: true,
      },
    });
  }

  async removeFromUser(userId: number, credentialId: number): Promise<void> {
    const credential = await this.prisma.credential.findUnique({
      where: { id: credentialId },
      select: { id: true, userId: true },
    });

    if (!credential) {
      throw new NotFoundException('La credencial no existe');
    }

    if (credential.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para eliminar esta credencial');
    }

    await this.prisma.credential.delete({ where: { id: credentialId } });
  }
}
