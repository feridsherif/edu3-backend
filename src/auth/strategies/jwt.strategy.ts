import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service.js';
import { UnauthorizedException } from '@nestjs/common';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService
  ) {
    const secret = configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    try {
      const user = await this.usersService.findByIdWithPermissions(payload.sub);
      return {
        id: user.id,
        email: user.email,
        role: user.role, // role entity with permissions attached
        departmentId: user.department?.id ?? null
      };
    } catch {
      throw new UnauthorizedException('User not found or unauthorized');
    }
  }
}
