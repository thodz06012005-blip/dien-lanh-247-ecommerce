import { Injectable } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';

@Injectable()
export class UniqueJwtService extends JwtService {
  override signAsync(payload: object, options?: JwtSignOptions): Promise<string>;
  override signAsync(payload: string, options?: Omit<JwtSignOptions, keyof import('jsonwebtoken').SignOptions>): Promise<string>;
  override signAsync(payload: Buffer, options?: JwtSignOptions): Promise<string>;
  override signAsync(
    payload: object | string | Buffer,
    options?: JwtSignOptions,
  ): Promise<string> {
    if (typeof payload === 'object' && !Buffer.isBuffer(payload)) {
      return super.signAsync({ ...payload, jti: randomUUID() }, options);
    }
    return super.signAsync(payload as string, options);
  }
}
