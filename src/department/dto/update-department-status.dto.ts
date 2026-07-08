import { IsString, IsOptional, Length, IsBoolean } from 'class-validator';
import { ApiProperty } from 'node_modules/@nestjs/swagger/dist/decorators/api-property.decorator';


export class UpdateDepartmentStatusDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}