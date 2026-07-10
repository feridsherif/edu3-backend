import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateChapterDto {
  @ApiProperty({ example: 'Introduction to Programming' })
  @IsString()
  @IsNotEmpty()
  title: string;
  
  @ApiProperty({ example: 1, description: 'The order of the chapter in the course' })
  @IsInt()
  @IsOptional()
  sequenceOrder?: number;
}
