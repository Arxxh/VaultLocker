import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

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
    const user = await this.prisma.user.create({
      data: { email: data.email, password: hash },
    });

    const payload = { sub: user.id, email: user.email };
    const token = await this.jwt.signAsync(payload);

    return {
      message: 'Usuario registrado',
      user: { id: user.id, email: user.email },
      accessToken: token,
      access_token: token,
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

  async logout(user?: { sub: number; email: string }) {
    // No hay estado del lado del servidor para JWT, pero mantenemos el endpoint
    // para permitir revocación futura y logging centralizado.
    return {
      message: 'Sesión cerrada correctamente',
      user: user ? { id: user.sub, email: user.email } : undefined,
    };
  }
}
