// src/auth/dto/activate.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ActivateDto {
  @ApiProperty({
    description: 'Activation token received via email',

  })
  @IsString()
  @IsNotEmpty()
  token: string;
}