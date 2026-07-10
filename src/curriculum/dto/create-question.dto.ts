import { IsString, IsNotEmpty, IsInt, IsOptional, IsArray, ValidateNested, ArrayMinSize, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAnswerDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsBoolean()
  @IsNotEmpty()
  isCorrect: boolean;
}

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @IsInt()
  @IsNotEmpty()
  points: number;

  @IsInt()
  @IsOptional()
  sequenceOrder?: number;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerDto)
  answers: CreateAnswerDto[];
}
