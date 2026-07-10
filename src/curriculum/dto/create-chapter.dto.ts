import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateChapterDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsInt()
  @IsOptional()
  sequenceOrder?: number;
}
