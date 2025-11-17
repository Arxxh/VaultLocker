import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { Request } from 'express';
import { JwtPayload } from './interface/jwt-payload.interface';
import { RecoverPasswordDto } from './dto/recover-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión y obtener token JWT' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cerrar sesión del usuario autenticado' })
  logout(@Req() req: Request & { user: JwtPayload }) {
    const user = req.user;
    return this.authService.logout(user);
  }

  @Post('recover')
  @ApiOperation({ summary: 'Recuperar contraseña con PIN maestro y código' })
  recover(@Body() dto: RecoverPasswordDto) {
    return this.authService.recoverPassword(dto);
  }
}
