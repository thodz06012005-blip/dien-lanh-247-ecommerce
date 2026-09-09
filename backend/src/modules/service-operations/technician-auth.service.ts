import { CanActivate, ExecutionContext, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../core/database/prisma.service';
import { normalizePhone, technicianSelect } from './job-view';
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
@Injectable()
export class TechnicianAuthService {
  constructor(private readonly prisma: PrismaService) {}
  async login(phone: string, pin: string) {
    const tech = await this.prisma.technician.findUnique({ where: { phone: normalizePhone(phone) } });
    if (!tech?.pinHash || tech.status === 'inactive' || !(await bcrypt.compare(pin, tech.pinHash))) throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    const token = randomBytes(32).toString('hex');
    await this.prisma.$transaction(async tx => {
      // Recheck under lock, so resetting a PIN cannot race with creation of an old session.
      await tx.$queryRaw`SELECT id FROM Technician WHERE id = ${tech.id} FOR UPDATE`;
      const current = await tx.technician.findUniqueOrThrow({ where: { id: tech.id } });
      if (current.pinHash !== tech.pinHash || current.status === 'inactive') throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
      await tx.technicianSession.deleteMany({ where: { technicianId: tech.id, expiresAt: { lt: new Date() } } });
      await tx.technicianSession.create({ data: { tokenHash: tokenHash(token), technicianId: tech.id, expiresAt: new Date(Date.now() + 12 * 3600000) } });
    });
    const safe = await this.prisma.technician.findUniqueOrThrow({ where: { id: tech.id }, select: technicianSelect });
    return { token, expiresIn: 43200, technician: { ...safe, rating: Number(safe.rating) } };
  }
  async authenticate(header?: string) {
    const match = /^Bearer ([a-f0-9]{64})$/i.exec(header || '');
    if (!match) throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    const session = await this.prisma.technicianSession.findUnique({ where: { tokenHash: tokenHash(match[1]) }, include: { technician: { select: technicianSelect } } });
    if (!session || session.expiresAt <= new Date() || session.technician.status === 'inactive') throw new UnauthorizedException('Phiên đăng nhập đã hết hạn');
    return { ...session.technician, rating: Number(session.technician.rating), sessionHash: session.tokenHash };
  }
  async logout(hash: string) { await this.prisma.technicianSession.deleteMany({ where: { tokenHash: hash } }); }
  async setPin(id: string, pin: string) {
    const pinHash = await bcrypt.hash(pin, 12);
    await this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM Technician WHERE id = ${id} FOR UPDATE`;
      if (!(await tx.technician.findUnique({ where: { id } }))) throw new NotFoundException('Không tìm thấy kỹ thuật viên');
      await tx.technician.update({ where: { id }, data: { pinHash } });
      await tx.technicianSession.deleteMany({ where: { technicianId: id } });
    });
    return { id };
  }
}
export type TechnicianIdentity = Awaited<ReturnType<TechnicianAuthService['authenticate']>>;
@Injectable()
export class TechnicianGuard implements CanActivate {
  constructor(private readonly auth: TechnicianAuthService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.technician = await this.auth.authenticate(req.headers.authorization);
    return true;
  }
}
