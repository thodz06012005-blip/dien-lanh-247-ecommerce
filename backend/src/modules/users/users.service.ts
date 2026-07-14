import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthService } from '../auth/auth.service';
import {
  AddressDto,
  ChangePasswordDto,
  ClaimServiceRequestDto,
  ServiceRequestReviewDto,
  UpdateProfileDto,
} from './dto/account.dto';

interface AccountRow {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  normalizedPhone: string | null;
  role: string;
  isActive: number | boolean;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  passwordChangedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AddressRow {
  id: number;
  userId: number;
  label: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  note: string | null;
  isDefault: number | boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private normalizePhone(phone?: string | null) {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('84') ? `0${digits.slice(2)}` : digits;
  }

  private async getAccountRow(userId: number) {
    const rows = await this.prisma.$queryRawUnsafe<AccountRow[]>(
      `SELECT id, email, firstName, lastName, phone, normalizedPhone, role, isActive,
              emailVerifiedAt, phoneVerifiedAt, passwordChangedAt, lastLoginAt,
              createdAt, updatedAt
       FROM User WHERE id = ? LIMIT 1`,
      userId,
    );
    const user = rows[0];
    if (!user || !Boolean(user.isActive)) throw new UnauthorizedException('Tài khoản không còn hoạt động');
    return user;
  }

  private safeAccount(user: AccountRow) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      emailVerified: Boolean(user.emailVerifiedAt),
      phoneVerified: Boolean(user.phoneVerifiedAt),
      passwordChangedAt: user.passwordChangedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async linkEligibleRequests(user: AccountRow) {
    const clauses: string[] = [];
    const params: unknown[] = [user.id];
    if (user.emailVerifiedAt) {
      clauses.push('customerEmail = ?');
      params.push(user.email);
    }
    if (user.phoneVerifiedAt && user.normalizedPhone) {
      clauses.push('customerPhone = ?');
      params.push(user.normalizedPhone);
    }
    if (!clauses.length) return 0;
    return Number(await this.prisma.$executeRawUnsafe(
      `UPDATE ServiceRequest SET customerUserId = ?
       WHERE customerUserId IS NULL AND (${clauses.join(' OR ')})`,
      ...params,
    ));
  }

  async getOverview(userId: number) {
    const user = await this.getAccountRow(userId);
    await this.linkEligibleRequests(user);
    const [addresses, stats, unreadRows, sessions] = await Promise.all([
      this.listAddresses(userId),
      this.prisma.$queryRawUnsafe<Array<{ serviceCount: bigint; orderCount: bigint }>>(
        `SELECT
          (SELECT COUNT(*) FROM ServiceRequest WHERE customerUserId = ?) AS serviceCount,
          (SELECT COUNT(*) FROM \`Order\` WHERE userId = ?) AS orderCount`,
        userId,
        userId,
      ),
      this.prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
        'SELECT COUNT(*) AS total FROM CustomerNotification WHERE userId = ? AND readAt IS NULL',
        userId,
      ),
      this.prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
        'SELECT COUNT(*) AS total FROM AuthSession WHERE userId = ? AND revokedAt IS NULL AND expiresAt > NOW(3)',
        userId,
      ),
    ]);
    return {
      user: this.safeAccount(user),
      defaultAddress: addresses.find((address) => Boolean(address.isDefault)) ?? addresses[0] ?? null,
      stats: {
        services: Number(stats[0]?.serviceCount ?? 0),
        orders: Number(stats[0]?.orderCount ?? 0),
        unreadNotifications: Number(unreadRows[0]?.total ?? 0),
        activeSessions: Number(sessions[0]?.total ?? 0),
      },
    };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const current = await this.getAccountRow(userId);
    const normalizedPhone = this.normalizePhone(dto.phone);
    const duplicate = await this.prisma.$queryRawUnsafe<Array<{ id: number }>>(
      'SELECT id FROM User WHERE normalizedPhone = ? AND id <> ? LIMIT 1',
      normalizedPhone,
      userId,
    );
    if (duplicate.length) throw new ConflictException('Số điện thoại đã được sử dụng bởi tài khoản khác');
    const phoneChanged = current.normalizedPhone !== normalizedPhone;
    await this.prisma.$executeRawUnsafe(
      `UPDATE User
       SET firstName = ?, lastName = ?, phone = ?, normalizedPhone = ?,
           phoneVerifiedAt = CASE WHEN ? THEN NULL ELSE phoneVerifiedAt END
       WHERE id = ?`,
      dto.firstName.trim(),
      dto.lastName.trim(),
      normalizedPhone,
      normalizedPhone,
      phoneChanged ? 1 : 0,
      userId,
    );
    const updated = await this.getAccountRow(userId);
    return this.safeAccount(updated);
  }

  async listAddresses(userId: number) {
    await this.getAccountRow(userId);
    return this.prisma.$queryRawUnsafe<AddressRow[]>(
      `SELECT id, userId, label, fullName, phone, province, district, ward,
              streetAddress, note, isDefault, createdAt, updatedAt
       FROM Address WHERE userId = ?
       ORDER BY isDefault DESC, updatedAt DESC, id DESC`,
      userId,
    );
  }

  async createAddress(userId: number, dto: AddressDto) {
    await this.getAccountRow(userId);
    const countRows = await this.prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
      'SELECT COUNT(*) AS total FROM Address WHERE userId = ?',
      userId,
    );
    const makeDefault = dto.isDefault || Number(countRows[0]?.total ?? 0) === 0;
    const insertId = await this.prisma.$transaction(async (tx) => {
      if (makeDefault) await tx.$executeRawUnsafe('UPDATE Address SET isDefault = 0 WHERE userId = ?', userId);
      await tx.$executeRawUnsafe(
        `INSERT INTO Address
          (userId, label, fullName, phone, province, district, ward, streetAddress, note,
           isDefault, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
        userId,
        dto.label.trim(),
        dto.fullName.trim(),
        this.normalizePhone(dto.phone),
        dto.province.trim(),
        dto.district.trim(),
        dto.ward.trim(),
        dto.streetAddress.trim(),
        dto.note?.trim() || null,
        makeDefault ? 1 : 0,
      );
      const rows = await tx.$queryRawUnsafe<Array<{ id: bigint }>>('SELECT LAST_INSERT_ID() AS id');
      return Number(rows[0]?.id ?? 0);
    });
    return this.getAddressOwned(userId, insertId);
  }

  private async getAddressOwned(userId: number, addressId: number) {
    const rows = await this.prisma.$queryRawUnsafe<AddressRow[]>(
      `SELECT id, userId, label, fullName, phone, province, district, ward,
              streetAddress, note, isDefault, createdAt, updatedAt
       FROM Address WHERE id = ? AND userId = ? LIMIT 1`,
      addressId,
      userId,
    );
    if (!rows[0]) throw new NotFoundException('Không tìm thấy địa chỉ');
    return rows[0];
  }

  async updateAddress(userId: number, addressId: number, dto: AddressDto) {
    await this.getAddressOwned(userId, addressId);
    await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) await tx.$executeRawUnsafe('UPDATE Address SET isDefault = 0 WHERE userId = ?', userId);
      await tx.$executeRawUnsafe(
        `UPDATE Address SET label = ?, fullName = ?, phone = ?, province = ?, district = ?, ward = ?,
                            streetAddress = ?, note = ?, isDefault = ?, updatedAt = NOW(3)
         WHERE id = ? AND userId = ?`,
        dto.label.trim(),
        dto.fullName.trim(),
        this.normalizePhone(dto.phone),
        dto.province.trim(),
        dto.district.trim(),
        dto.ward.trim(),
        dto.streetAddress.trim(),
        dto.note?.trim() || null,
        dto.isDefault ? 1 : 0,
        addressId,
        userId,
      );
    });
    return this.getAddressOwned(userId, addressId);
  }

  async deleteAddress(userId: number, addressId: number) {
    const address = await this.getAddressOwned(userId, addressId);
    const inUse = await this.prisma.order.count({ where: { addressId, userId } });
    if (inUse > 0) throw new ConflictException('Không thể xóa địa chỉ đã được dùng trong đơn hàng');
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('DELETE FROM Address WHERE id = ? AND userId = ?', addressId, userId);
      if (Boolean(address.isDefault)) {
        await tx.$executeRawUnsafe(
          `UPDATE Address SET isDefault = 1
           WHERE id = (SELECT id FROM (SELECT id FROM Address WHERE userId = ? ORDER BY updatedAt DESC LIMIT 1) nextAddress)`,
          userId,
        );
      }
    });
    return { deleted: true };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const rows = await this.prisma.$queryRawUnsafe<Array<{ password: string }>>(
      'SELECT password FROM User WHERE id = ? AND isActive = 1 LIMIT 1',
      userId,
    );
    if (!rows[0] || !(await bcrypt.compare(dto.currentPassword, rows[0].password))) {
      throw new ForbiddenException('Mật khẩu hiện tại không đúng');
    }
    if (await bcrypt.compare(dto.newPassword, rows[0].password)) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại');
    }
    const rounds = Math.min(15, Math.max(8, Number(this.configService.get('BCRYPT_SALT_ROUNDS')) || 10));
    const hash = await bcrypt.hash(dto.newPassword, rounds);
    await this.prisma.$executeRawUnsafe(
      'UPDATE User SET password = ?, passwordChangedAt = NOW(3) WHERE id = ?',
      hash,
      userId,
    );
    await this.authService.revokeAllSessions(userId, 'PASSWORD_CHANGED');
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO CustomerNotification (userId, type, title, body, createdAt)
       VALUES (?, 'PASSWORD_CHANGED', 'Mật khẩu đã được thay đổi',
               'Tất cả phiên đăng nhập đã được thu hồi để bảo vệ tài khoản.', NOW(3))`,
      userId,
    );
    return { changed: true, requiresLogin: true };
  }

  async listOrders(userId: number) {
    await this.getAccountRow(userId);
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        orderNumber: true,
        subtotal: true,
        shippingFee: true,
        discount: true,
        totalAmount: true,
        status: true,
        note: true,
        createdAt: true,
        updatedAt: true,
        payment: { select: { method: true, status: true, amount: true, paidAt: true } },
        shipping: { select: { carrier: true, trackingNumber: true, status: true, estimatedDate: true, deliveredAt: true } },
        items: { select: { id: true, productName: true, variantName: true, price: true, quantity: true } },
      },
    });
  }

  async getOrder(userId: number, id: number) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      select: {
        id: true,
        orderNumber: true,
        subtotal: true,
        shippingFee: true,
        discount: true,
        totalAmount: true,
        status: true,
        note: true,
        createdAt: true,
        updatedAt: true,
        address: { select: { fullName: true, phone: true, province: true, district: true, ward: true, streetAddress: true } },
        payment: { select: { method: true, status: true, amount: true, paidAt: true } },
        shipping: { select: { carrier: true, trackingNumber: true, status: true, estimatedDate: true, deliveredAt: true } },
        items: { select: { id: true, productName: true, variantName: true, price: true, quantity: true } },
      },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return order;
  }

  async claimServiceRequest(userId: number, dto: ClaimServiceRequestDto) {
    const user = await this.getAccountRow(userId);
    const phone = this.normalizePhone(dto.phone);
    const rows = await this.prisma.$queryRawUnsafe<Array<{ id: string; customerUserId: number | null; customerPhone: string }>>(
      `SELECT id, customerUserId, customerPhone FROM ServiceRequest
       WHERE id = ? AND customerPhone = ? LIMIT 1`,
      dto.code.trim().toUpperCase(),
      phone,
    );
    const request = rows[0];
    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu với thông tin đã cung cấp');
    if (request.customerUserId && request.customerUserId !== userId) {
      throw new ConflictException('Yêu cầu đã được liên kết với tài khoản khác');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('UPDATE ServiceRequest SET customerUserId = ? WHERE id = ?', userId, request.id);
      if (user.normalizedPhone === phone) {
        await tx.$executeRawUnsafe('UPDATE User SET phoneVerifiedAt = COALESCE(phoneVerifiedAt, NOW(3)) WHERE id = ?', userId);
      }
      await tx.$executeRawUnsafe(
        `INSERT INTO CustomerNotification (userId, type, title, body, data, createdAt)
         VALUES (?, 'SERVICE_REQUEST_LINKED', 'Đã liên kết yêu cầu dịch vụ', ?, ?, NOW(3))`,
        userId,
        `Yêu cầu ${request.id} đã được thêm vào tài khoản của bạn.`,
        JSON.stringify({ requestId: request.id }),
      );
    });
    const updatedUser = await this.getAccountRow(userId);
    await this.linkEligibleRequests(updatedUser);
    return { linked: true, requestId: request.id };
  }

  async listServiceRequests(userId: number) {
    const user = await this.getAccountRow(userId);
    await this.linkEligibleRequests(user);
    return this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT sr.id, sr.workflowStatus AS status, sr.priority, sr.applianceType,
              sr.preferredDate, sr.preferredTimeSlot, sr.estimatedPrice, sr.finalPrice,
              sr.paymentStatus, sr.createdAt, sr.updatedAt,
              category.id AS serviceCategoryId, category.name AS serviceCategoryName
       FROM ServiceRequest sr
       INNER JOIN ServiceCategory category ON category.id = sr.serviceCategoryId
       WHERE sr.customerUserId = ?
       ORDER BY sr.createdAt DESC LIMIT 100`,
      userId,
    );
  }

  async getServiceRequest(userId: number, requestId: string) {
    const rows = await this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT sr.id, sr.customerName, sr.customerPhone, sr.customerEmail, sr.customerAddress,
              sr.district, sr.workflowStatus AS status, sr.priority, sr.applianceType,
              sr.issueDescription, sr.preferredDate, sr.preferredTimeSlot, sr.note,
              sr.estimatedPrice, sr.finalPrice, sr.paymentStatus, sr.createdAt, sr.updatedAt,
              category.id AS serviceCategoryId, category.name AS serviceCategoryName,
              technician.name AS technicianName, technician.avatar AS technicianAvatar
       FROM ServiceRequest sr
       INNER JOIN ServiceCategory category ON category.id = sr.serviceCategoryId
       LEFT JOIN Technician technician ON technician.id = sr.assignedTechnicianId
       WHERE sr.id = ? AND sr.customerUserId = ? LIMIT 1`,
      requestId.trim().toUpperCase(),
      userId,
    );
    if (!rows[0]) throw new NotFoundException('Không tìm thấy yêu cầu dịch vụ');
    const [timeline, media, reviews] = await Promise.all([
      this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `SELECT id, fromStatus, toStatus, note, actorType, actorName, createdAt
         FROM ServiceRequestStatusEvent WHERE requestId = ? ORDER BY createdAt ASC, id ASC`,
        requestId.trim().toUpperCase(),
      ),
      this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `SELECT id, stage, url, mimeType, caption, createdAt
         FROM ServiceRequestMedia WHERE requestId = ? ORDER BY createdAt ASC, id ASC`,
        requestId.trim().toUpperCase(),
      ),
      this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `SELECT rating, comment, createdAt, updatedAt FROM ServiceRequestReview
         WHERE requestId = ? AND userId = ? LIMIT 1`,
        requestId.trim().toUpperCase(),
        userId,
      ),
    ]);
    return { ...rows[0], timeline, media, review: reviews[0] ?? null };
  }

  async reviewServiceRequest(userId: number, requestId: string, dto: ServiceRequestReviewDto) {
    const owned = await this.prisma.$queryRawUnsafe<Array<{ id: string; workflowStatus: string }>>(
      'SELECT id, workflowStatus FROM ServiceRequest WHERE id = ? AND customerUserId = ? LIMIT 1',
      requestId.trim().toUpperCase(),
      userId,
    );
    if (!owned[0]) throw new NotFoundException('Không tìm thấy yêu cầu dịch vụ');
    if (!['COMPLETED', 'WARRANTY', 'CLOSED'].includes(owned[0].workflowStatus)) {
      throw new BadRequestException('Chỉ có thể đánh giá yêu cầu đã hoàn thành');
    }
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO ServiceRequestReview (requestId, userId, rating, comment, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, NOW(3), NOW(3))
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), updatedAt = NOW(3)`,
      owned[0].id,
      userId,
      dto.rating,
      dto.comment?.trim() || null,
    );
    return { saved: true };
  }

  async listNotifications(userId: number) {
    await this.getAccountRow(userId);
    return this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT id, type, title, body, data, readAt, createdAt
       FROM CustomerNotification WHERE userId = ? ORDER BY createdAt DESC, id DESC LIMIT 100`,
      userId,
    );
  }

  async markNotificationRead(userId: number, id: bigint) {
    const affected = await this.prisma.$executeRawUnsafe(
      'UPDATE CustomerNotification SET readAt = COALESCE(readAt, NOW(3)) WHERE id = ? AND userId = ?',
      id,
      userId,
    );
    if (!Number(affected)) throw new NotFoundException('Không tìm thấy thông báo');
    return { read: true };
  }

  async markAllNotificationsRead(userId: number) {
    await this.prisma.$executeRawUnsafe(
      'UPDATE CustomerNotification SET readAt = COALESCE(readAt, NOW(3)) WHERE userId = ?',
      userId,
    );
    return { read: true };
  }

  async listSessions(userId: number, currentSessionId: string) {
    await this.getAccountRow(userId);
    const rows = await this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT id, userAgent, createdAt, lastUsedAt, rotatedAt, expiresAt
       FROM AuthSession WHERE userId = ? AND revokedAt IS NULL AND expiresAt > NOW(3)
       ORDER BY createdAt DESC`,
      userId,
    );
    return rows.map((row) => ({ ...row, current: row.id === currentSessionId }));
  }

  async revokeSession(userId: number, sessionId: string) {
    const affected = await this.prisma.$executeRawUnsafe(
      `UPDATE AuthSession SET revokedAt = COALESCE(revokedAt, NOW(3)), revokeReason = 'USER_REVOKED'
       WHERE id = ? AND userId = ?`,
      sessionId,
      userId,
    );
    if (!Number(affected)) throw new NotFoundException('Không tìm thấy phiên đăng nhập');
    return { revoked: true };
  }
}
