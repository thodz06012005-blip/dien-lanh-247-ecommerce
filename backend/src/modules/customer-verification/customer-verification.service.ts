import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomInt } from 'crypto';
import { PrismaService } from '../../core/database/prisma.service';
import { toGuestLookupDetail } from '../service-operations/job-view';

@Injectable()
export class CustomerVerificationService {
  private readonly requestWindows = new Map<string, number[]>();
  constructor(private prisma: PrismaService, private config: ConfigService) {}
  private hash(value: string) { return createHash('sha256').update(`${value}:${this.config.get('LOOKUP_TOKEN_PEPPER') || 'local-only-pepper'}`).digest('hex'); }
  private normalizePhone(value: string) { return String(value || '').replace(/[\s.-]/g, ''); }
  private async deliverOtp(phone: string, requestCode: string, otp: string) {
    const url = this.config.get<string>('OTP_DELIVERY_WEBHOOK_URL');
    if (!url) return;
    await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Webhook-Secret': this.config.get('OTP_DELIVERY_WEBHOOK_SECRET') || '' },
      body: JSON.stringify({ channel: 'sms', recipient: phone, template: 'service_lookup', requestCode, otp, expiresInSeconds: 300 }),
    }).catch(() => undefined); // The public response remains generic and enumeration-safe if the provider is unavailable.
  }

  async requestOtp(requestCode: string, phone: string, ip: string) {
    const code = String(requestCode || '').trim().toUpperCase();
    const key = `${ip}:${code}`; const cutoff = Date.now() - 60_000;
    const recent = (this.requestWindows.get(key) || []).filter(value => value > cutoff);
    if (recent.length >= 5) return { success: true, message: 'Nếu thông tin hợp lệ, mã xác thực sẽ được gửi.' };
    recent.push(Date.now()); this.requestWindows.set(key, recent);
    const request = await this.prisma.serviceRequest.findUnique({ where: { id: code } });
    const matches = request && this.normalizePhone(request.customerPhone) === this.normalizePhone(phone);
    if (matches) {
      const otp = this.config.get('NODE_ENV') !== 'production' && this.config.get('LOOKUP_TEST_OTP') || String(randomInt(0, 1000000)).padStart(6, '0');
      await this.prisma.serviceLookupGrant.create({ data: { serviceRequestId: request.id, otpHash: this.hash(otp), expiresAt: new Date(Date.now() + 5 * 60_000) } });
      await this.deliverOtp(this.normalizePhone(phone), request.id, otp);
    }
    return { success: true, message: 'Nếu thông tin hợp lệ, mã xác thực sẽ được gửi.' };
  }

  async verify(requestCode: string, otp: string) {
    const id = String(requestCode || '').trim().toUpperCase();
    const grant = await this.prisma.serviceLookupGrant.findFirst({ where: { serviceRequestId: id, usedAt: null }, orderBy: { createdAt: 'desc' } });
    if (!grant || grant.expiresAt <= new Date() || grant.attempts >= 5 || grant.otpHash !== this.hash(String(otp || ''))) {
      if (grant && grant.attempts < 5) await this.prisma.serviceLookupGrant.update({ where: { id: grant.id }, data: { attempts: { increment: 1 } } });
      throw new UnauthorizedException('Mã xác thực không hợp lệ hoặc đã hết hạn');
    }
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 10 * 60_000);
    await this.prisma.serviceLookupGrant.update({ where: { id: grant.id }, data: { usedAt: new Date(), tokenHash: this.hash(token), expiresAt } });
    return { success: true, data: { token, requestId: id, expiresAt } };
  }

  async lookup(requestCode: string, token: string) {
    const grant = await this.prisma.serviceLookupGrant.findUnique({ where: { tokenHash: this.hash(token) } });
    if (!grant || grant.serviceRequestId !== requestCode || !grant.usedAt || grant.expiresAt <= new Date()) throw new UnauthorizedException('Quyền tra cứu không hợp lệ hoặc đã hết hạn');
    const request = await this.prisma.serviceRequest.findUnique({ where: { id: requestCode }, include: { assignedTechnician: true, quotes: { where: { status: { in: ['sent','approved','rejected'] } }, orderBy: { version: 'desc' }, take: 1 } } });
    if (!request) throw new UnauthorizedException('Quyền tra cứu không hợp lệ hoặc đã hết hạn');
    return { success: true, data: toGuestLookupDetail(request as any) };
  }
  async authorizeLookup(requestCode: string, token: string) {
    const grant = token ? await this.prisma.serviceLookupGrant.findUnique({ where: { tokenHash: this.hash(token) } }) : null;
    return Boolean(grant && grant.serviceRequestId === requestCode && grant.usedAt && grant.expiresAt > new Date());
  }
}
