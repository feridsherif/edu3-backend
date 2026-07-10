import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateQuizDto {
  @ApiProperty({ example: 'Quiz 1: Basic Programming Concepts', description: 'The title of the quiz' })
  @IsString()
  @IsNotEmpty()
  title: string;
}
