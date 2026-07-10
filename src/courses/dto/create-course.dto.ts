
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DifficultyLevel } from '../entities/course.entity';

export class CreateCourseDto {
  @ApiProperty({ example: 'Introduction to Web3' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Learn the basics of Web3 and blockchain technology' })
  @IsString()
  @IsNotEmpty()
  shortDescription: string;

  @ApiProperty({ example: 'Full course description with detailed curriculum...' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'https://example.com/thumbnail.jpg' })
  @IsUrl()
  @IsOptional()
  thumbnail?: string;

  @ApiProperty({ enum: DifficultyLevel, example: DifficultyLevel.BEGINNER })
  @IsEnum(DifficultyLevel)
  difficultyLevel: DifficultyLevel;

  @ApiProperty({ example: 120 })
  @IsInt()
  @Min(1)
  estimatedDuration: number;

  @ApiProperty({ example: 'English' })
  @IsString()
  @IsNotEmpty()
  language: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsNotEmpty()
  departmentId: string;
}