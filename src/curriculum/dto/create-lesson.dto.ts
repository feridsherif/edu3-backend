import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty({ example:'Lesson 1: Introduction to Programming', description: 'The title of the lesson' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example:'<p>This is the content of Lesson 1.</p>', description: 'The HTML content of the lesson' })
  @IsString()
  @IsNotEmpty()
  contentHtml: string;

  @ApiProperty({ example: 1, description: 'The order of the lesson in the chapter' })
  @IsInt()
  @IsOptional()
  sequenceOrder?: number;


  @IsBoolean()
  @IsOptional()
  isLocked?: boolean;
}
