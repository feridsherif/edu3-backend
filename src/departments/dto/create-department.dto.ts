import { IsString, IsOptional, Length, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateDepartmentDto {
  @ApiProperty({ example: 'Computer Science' })
  @IsString()
  @Length(1, 150)
  name: string;

  @ApiProperty({ example: 'CS' })
  @IsString()
  @Length(1, 20)
  code: string;

  @ApiPropertyOptional({ example: 'Department of Computer Science' })
  @IsOptional()
  @IsString()
  description?: string;
}
