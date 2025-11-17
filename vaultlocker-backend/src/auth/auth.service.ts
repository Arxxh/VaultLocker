import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RecoverPasswordDto } from './dto/recover-password.dto';
import { randomBytes } from 'crypto';
import { CurrentUserData } from './interface/current-user.interface';

function generateRecoveryCode() {
  const code = randomBytes(16).toString('hex').toUpperCase();
  return `VL-${code.match(/.{1,4}/g)?.join('-')}`;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(data: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new UnauthorizedException('El usuario ya existe');

    const hash = await bcrypt.hash(data.password, 10);
    const masterPinHash = await bcrypt.hash(data.masterPin, 10);
    const recoveryCode = generateRecoveryCode();
    const recoveryCodeHash = await bcrypt.hash(recoveryCode, 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hash,
        masterPinHash,
        recoveryCodeHash,
      },
    });

    const payload = { sub: user.id, email: user.email };
    const token = await this.jwt.signAsync(payload);

    return {
      message: 'Usuario registrado',
      user: { id: user.id, email: user.email },
      accessToken: token,
      access_token: token,
      recoveryCode,
    };
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) throw new UnauthorizedException('Credenciales inválidas');

    const payload = { sub: user.id, email: user.email };
    const token = await this.jwt.signAsync(payload);

    return {
      accessToken: token,
      access_token: token,
      user: { id: user.id, email: user.email },
    };
  }

  async recoverPassword(data: RecoverPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.masterPinHash || !user.recoveryCodeHash) {
      throw new UnauthorizedException('No hay datos de recuperación configurados');
    }

    const isPinValid = await bcrypt.compare(data.masterPin, user.masterPinHash);
    const isCodeValid = await bcrypt.compare(
      data.recoveryCode,
      user.recoveryCodeHash,
    );

    if (!isPinValid || !isCodeValid) {
      throw new UnauthorizedException('PIN maestro o código de recuperación inválidos');
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 10);
    const newRecoveryCode = generateRecoveryCode();
    const newRecoveryCodeHash = await bcrypt.hash(newRecoveryCode, 10);

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash, recoveryCodeHash: newRecoveryCodeHash },
    });

    const payload = { sub: updated.id, email: updated.email };
    const token = await this.jwt.signAsync(payload);

    return {
      message: 'Contraseña restablecida',
      accessToken: token,
      access_token: token,
      user: { id: updated.id, email: updated.email },
      recoveryCode: newRecoveryCode,
    };
  }

  async getProfile(user: CurrentUserData) {
    const profile = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        credentials: { select: { id: true } },
      },
    });

    if (!profile) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      id: profile.id,
      email: profile.email,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      credentialsCount: profile.credentials.length,
    };
  }

  async logout(user?: { sub: number; email: string }) {
    // No hay estado del lado del servidor para JWT, pero mantenemos el endpoint
    // para permitir revocación futura y logging centralizado.
    return {
      message: 'Sesión cerrada correctamente',
      user: user ? { id: user.sub, email: user.email } : undefined,
    };
  }
}
