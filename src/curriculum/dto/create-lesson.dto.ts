import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  contentHtml: string;

  @IsInt()
  @IsOptional()
  sequenceOrder?: number;

  @IsBoolean()
  @IsOptional()
  isLocked?: boolean;
}
