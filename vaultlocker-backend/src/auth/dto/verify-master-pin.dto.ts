import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class VerifyMasterPinDto {
  @ApiProperty({ example: '123456', description: 'PIN maestro de 6 dígitos' })
  @IsString()
  @Matches(/^\d{6}$/)
  masterPin: string;
}
