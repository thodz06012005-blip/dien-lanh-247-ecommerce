import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import type { AuthAudience } from '../auth-cookie';

const requestAudience = (request: Request): AuthAudience => request.originalUrl.includes('/api/v1/admin/') ? 'admin' : 'customer';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret) throw new Error('Missing required environment variable: JWT_ACCESS_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => request.cookies?.[`${requestAudience(request)}_access`],
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  validate(request: Request, payload: any) {
    const expectedAudience = requestAudience(request);
    if (payload.aud !== expectedAudience) throw new UnauthorizedException('Phiên đăng nhập không đúng phạm vi');
    return { userId: payload.sub, email: payload.email, role: payload.role, audience: payload.aud };
  }
}
