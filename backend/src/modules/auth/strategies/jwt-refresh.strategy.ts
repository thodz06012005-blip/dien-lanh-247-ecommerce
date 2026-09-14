import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import type { AuthAudience } from '../auth-cookie';

const requestAudience = (request: Request): AuthAudience => request.originalUrl.includes('/api/v1/admin/') ? 'admin' : 'customer';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) throw new Error('Missing required environment variable: JWT_REFRESH_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request.cookies?.[`${requestAudience(request)}_refresh`],
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  validate(request: Request, payload: any) {
    const audience = requestAudience(request);
    if (payload.aud !== audience) throw new UnauthorizedException('Refresh token không đúng phạm vi');
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      audience: payload.aud,
      refreshToken: request.cookies?.[`${audience}_refresh`],
    };
  }
}
