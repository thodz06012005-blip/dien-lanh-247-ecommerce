import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtAdminRefreshStrategy extends PassportStrategy(Strategy, 'jwt-admin-refresh') {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) throw new Error('Missing required environment variable: JWT_REFRESH_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request.cookies?.['adminRefreshToken'],
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  validate(
    req: Request,
    payload: { sub: number; email: string; role: string; sid: string; fid: string; tv: number },
  ) {
    return {
      userId: Number(payload.sub),
      email: payload.email,
      role: payload.role,
      sessionId: payload.sid,
      familyId: payload.fid,
      tokenVersion: Number(payload.tv),
      refreshToken: req.cookies?.['adminRefreshToken'] ?? '',
    };
  }
}
