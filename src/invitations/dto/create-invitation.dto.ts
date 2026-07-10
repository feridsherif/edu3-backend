import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvitationDto {
  @ApiProperty({ example: 'instructor@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'instructor', enum: ['instructor', 'curriculum_manager', 'student', 'admin'] })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiPropertyOptional({
    description: 'Department ID (required for instructor and curriculum_manager roles)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  departmentId?: string;
}
