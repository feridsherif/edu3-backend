import { IsString, IsNotEmpty, IsInt, IsOptional, IsArray, ValidateNested, ArrayMinSize, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnswerDto {
  @ApiProperty({ example: 'Answer 1', description: 'The text of the answer' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ example: false, description: 'Indicates if the answer is correct' })
  @IsBoolean()
  @IsNotEmpty()
  isCorrect: boolean;
}

export class CreateQuestionDto {
  @ApiProperty({ example: 'What is the capital of France?', description: 'The text of the question' })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiProperty({ example: 10, description: 'The number of points the question is worth' })
  @IsInt()
  @IsNotEmpty()
  points: number;

  @ApiProperty({ example: 1, description: 'The order of the question in the quiz' })
  @IsInt()
  @IsOptional()
  sequenceOrder?: number;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerDto)
  answers: CreateAnswerDto[];
}
