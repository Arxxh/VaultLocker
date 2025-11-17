import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCredentialDto {
  @ApiProperty({ example: 'example.com' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  site: string;

  @ApiProperty({ example: 'usuario@correo.com' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  username: string;

  @ApiProperty({ example: 'contraseña-segura' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
