import { Exclude } from 'class-transformer';

export class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  role?: { id: string; name: string };
  department?: { id: string; name: string; code: string };

  @Exclude()
  password?: string;

  @Exclude()
  activationToken?: string;
}