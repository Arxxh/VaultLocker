import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Credential } from '@prisma/client';

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
}
