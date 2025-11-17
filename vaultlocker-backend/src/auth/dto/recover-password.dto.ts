import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RecoverPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: 'PIN maestro numérico de 6 dígitos' })
  @IsString()
  @Matches(/^\d{6}$/)
  masterPin: string;

  @ApiProperty({ example: 'VL-REC-1234567890' })
  @IsString()
  @MinLength(6)
  recoveryCode: string;

  @ApiProperty({ example: 'newStrongPassword123' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
