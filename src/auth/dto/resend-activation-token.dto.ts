import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendActivationTokenDto {
  @ApiProperty({
    description: 'Email address of the user to resend the activation token',
    example: 'user@example.com'
    })
    @IsEmail({}, { message: 'Invalid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;
}