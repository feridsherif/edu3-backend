import { IsString, IsOptional, Length, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class UpdateDepartmentDto {
  @ApiPropertyOptional({ example: 'Computer Science' })
  @IsOptional()
  @IsString()
  @Length(1, 150)
  name?: string;

  @ApiPropertyOptional({ example: 'CS' })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  code?: string;

  @ApiPropertyOptional({ example: 'Department of Computer Science' })
  @IsOptional()
  @IsString()
  description?: string;
}