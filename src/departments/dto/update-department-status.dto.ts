import { IsString, IsOptional, Length, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class UpdateDepartmentStatusDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}