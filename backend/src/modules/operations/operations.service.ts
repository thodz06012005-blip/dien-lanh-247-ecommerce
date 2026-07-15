import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../core/database/prisma.service';
import {
  CompletionReportDto,
  CreateQuoteDto,
  CustomerDeviceDto,
  DispatchDto,
  InternalNoteDto,
  OperationsQueryDto,
  PaymentRecordDto,
  QuoteDecisionDto,
  RescheduleDto,
  SlaPolicyDto,
  TechnicianScheduleDto,
  WarrantyDto,
  WarrantyEventDto,
} from './dto/operations.dto';
import { calculateQuote } from './quote-calculator';

export interface OperationsActor {
  userId: number;
  email: string;
  role: string;
  name?: string;
}

interface CountRow { total: bigint | number | string; }
interface IdRow { id: bigint | number | string; }
interface RequestRow extends Record<string, unknown> {
  id: string;
  workflowStatus: string;
  priority: string;
  serviceCategoryId: string;
  district: string;
  assignedTechnicianId?: string | null;
  createdAt: Date;
}
interface TechnicianRow extends Record<string, unknown> {
  id: string;
  skills: unknown;
  workingAreas: unknown;
  status: string;
}

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return fallback; }
  }
  return value as T;
};

const numberValue = (value: unknown) => Number(value ?? 0);
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
const publicCode = (prefix: string) => `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomBytes(3).toString('hex').toUpperCase()}`;

@Injectable()
export class OperationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async audit(
    requestId: string,
    action: string,
    actor: OperationsActor,
    metadata?: Record<string, unknown>,
    tx: PrismaService = this.prisma,
  ) {
    await tx.$executeRawUnsafe(
      `INSERT INTO ServiceRequestAudit
       (requestId, action, actorType, actorId, actorName, metadata, createdAt)
       VALUES (?, ?, 'ADMIN', ?, ?, ?, NOW(3))`,
      requestId,
      action,
      String(actor.userId),
      actor.name || actor.email,
      metadata ? JSON.stringify(metadata) : null,
    );
  }

  private async requestOrThrow(requestId: string, tx: PrismaService = this.prisma) {
    const rows = await tx.$queryRawUnsafe<RequestRow[]>(
      `SELECT * FROM ServiceRequest WHERE id = ? LIMIT 1`,
      requestId,
    );
    if (!rows.length) throw new NotFoundException('Không tìm thấy yêu cầu dịch vụ');
    return rows[0];
  }

  private async technicianOrThrow(technicianId: string, tx: PrismaService = this.prisma) {
    const rows = await tx.$queryRawUnsafe<TechnicianRow[]>(
      `SELECT * FROM Technician WHERE id = ? LIMIT 1`,
      technicianId,
    );
    if (!rows.length) throw new NotFoundException('Không tìm thấy kỹ thuật viên');
    return rows[0];
  }

  private async assertNoTechnicianOverlap(
    technicianId: string,
    startAt: Date,
    endAt: Date,
    excludeScheduleId?: number | bigint,
    tx: PrismaService = this.prisma,
  ) {
    if (!(endAt > startAt)) throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu');
    const params: unknown[] = [technicianId, endAt, startAt];
    let exclude = '';
    if (excludeScheduleId !== undefined) {
      exclude = 'AND id <> ?';
      params.push(excludeScheduleId);
    }
    const rows = await tx.$queryRawUnsafe<CountRow[]>(
      `SELECT COUNT(*) AS total
       FROM TechnicianSchedule
       WHERE technicianId = ?
         AND status IN ('TENTATIVE','CONFIRMED')
         AND startAt < ? AND endAt > ?
         ${exclude}`,
      ...params,
    );
    if (numberValue(rows[0]?.total) > 0) {
      throw new ConflictException('Kỹ thuật viên đã có lịch trùng trong khoảng thời gian này');
    }
  }

  async overview() {
    const [customers, devices, technicians, activeRequests, breached, unpaid, warranties, revenue] = await Promise.all([
      this.prisma.$queryRawUnsafe<CountRow[]>(`SELECT COUNT(*) total FROM User WHERE role = 'CUSTOMER'`),
      this.prisma.$queryRawUnsafe<CountRow[]>(`SELECT COUNT(*) total FROM CustomerDevice WHERE isActive = TRUE`),
      this.prisma.$queryRawUnsafe<CountRow[]>(`SELECT COUNT(*) total FROM Technician WHERE status <> 'inactive'`),
      this.prisma.$queryRawUnsafe<CountRow[]>(`SELECT COUNT(*) total FROM ServiceRequest WHERE workflowStatus NOT IN ('COMPLETED','CLOSED','CANCELLED','REJECTED')`),
      this.prisma.$queryRawUnsafe<CountRow[]>(`SELECT COUNT(*) total FROM ServiceRequestSla WHERE breachStage IS NOT NULL AND status = 'ACTIVE'`),
      this.prisma.$queryRawUnsafe<CountRow[]>(`SELECT COUNT(*) total FROM ServiceQuote WHERE status = 'ACCEPTED' AND totalAmount > (SELECT COALESCE(SUM(p.amount),0) FROM ServicePaymentRecord p WHERE p.requestId = ServiceQuote.requestId AND p.status = 'COMPLETED')`),
      this.prisma.$queryRawUnsafe<CountRow[]>(`SELECT COUNT(*) total FROM WarrantyRecord WHERE status = 'ACTIVE' AND endsAt >= NOW(3)`),
      this.prisma.$queryRawUnsafe<Array<{ total: unknown }>>(`SELECT COALESCE(SUM(amount),0) total FROM ServicePaymentRecord WHERE status = 'COMPLETED' AND paidAt >= DATE_SUB(NOW(3), INTERVAL 30 DAY)`),
    ]);
    const attention = await this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT r.id, r.customerName, r.priority, r.workflowStatus,
              s.breachStage, s.resolutionDueAt,
              TIMESTAMPDIFF(MINUTE, NOW(3), s.resolutionDueAt) AS minutesRemaining
       FROM ServiceRequest r
       JOIN ServiceRequestSla s ON s.requestId = r.id
       WHERE s.status = 'ACTIVE'
         AND (s.breachStage IS NOT NULL OR s.resolutionDueAt <= DATE_ADD(NOW(3), INTERVAL 120 MINUTE))
       ORDER BY s.breachStage IS NOT NULL DESC, s.resolutionDueAt ASC
       LIMIT 12`,
    );
    return {
      metrics: {
        customers: numberValue(customers[0]?.total),
        devices: numberValue(devices[0]?.total),
        technicians: numberValue(technicians[0]?.total),
        activeRequests: numberValue(activeRequests[0]?.total),
        breachedSla: numberValue(breached[0]?.total),
        unpaidAcceptedQuotes: numberValue(unpaid[0]?.total),
        activeWarranties: numberValue(warranties[0]?.total),
        serviceRevenue30Days: numberValue(revenue[0]?.total),
      },
      attention,
    };
  }

  async listCustomers(query: OperationsQueryDto) {
    const where: string[] = [`u.role = 'CUSTOMER'`];
    const params: unknown[] = [];
    if (query.q) {
      where.push(`(u.email LIKE ? OR u.phone LIKE ? OR CONCAT(COALESCE(u.firstName,''),' ',COALESCE(u.lastName,'')) LIKE ?)`);
      const term = `%${query.q.trim()}%`;
      params.push(term, term, term);
    }
    const offset = (query.page - 1) * query.limit;
    const [items, counts] = await Promise.all([
      this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `SELECT u.id, u.email, u.phone, u.firstName, u.lastName, u.isActive, u.createdAt,
                COUNT(DISTINCT a.id) addressCount,
                COUNT(DISTINCT d.id) deviceCount,
                COUNT(DISTINCT r.id) serviceRequestCount,
                MAX(r.createdAt) lastServiceAt
         FROM User u
         LEFT JOIN Address a ON a.userId = u.id
         LEFT JOIN CustomerDevice d ON d.userId = u.id AND d.isActive = TRUE
         LEFT JOIN ServiceRequest r ON r.customerUserId = u.id
         WHERE ${where.join(' AND ')}
         GROUP BY u.id
         ORDER BY lastServiceAt DESC, u.createdAt DESC
         LIMIT ? OFFSET ?`,
        ...params,
        query.limit,
        offset,
      ),
      this.prisma.$queryRawUnsafe<CountRow[]>(
        `SELECT COUNT(*) total FROM User u WHERE ${where.join(' AND ')}`,
        ...params,
      ),
    ]);
    const total = numberValue(counts[0]?.total);
    return { items, meta: { page: query.page, limit: query.limit, total, totalPages: Math.max(1, Math.ceil(total / query.limit)) } };
  }

  async customerDetail(userId: number) {
    const users = await this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT id, email, phone, firstName, lastName, isActive, emailVerifiedAt, phoneVerifiedAt, createdAt, updatedAt
       FROM User WHERE id = ? AND role = 'CUSTOMER' LIMIT 1`,
      userId,
    );
    if (!users.length) throw new NotFoundException('Không tìm thấy khách hàng');
    const [addresses, devices, requests, orders] = await Promise.all([
      this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT * FROM Address WHERE userId = ? ORDER BY isDefault DESC, id DESC`, userId),
      this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT * FROM CustomerDevice WHERE userId = ? ORDER BY isActive DESC, updatedAt DESC`, userId),
      this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT id, serviceCategoryId, applianceType, issueDescription, workflowStatus, priority, preferredDate, preferredTimeSlot, assignedTechnicianId, finalPrice, paymentStatus, createdAt, updatedAt FROM ServiceRequest WHERE customerUserId = ? ORDER BY createdAt DESC LIMIT 100`, userId),
      this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT id, orderNumber, totalAmount, status, createdAt FROM \`Order\` WHERE userId = ? ORDER BY createdAt DESC LIMIT 100`, userId),
    ]);
    return { customer: users[0], addresses, devices, serviceRequests: requests, orders };
  }

  async createDevice(dto: CustomerDeviceDto, actor: OperationsActor) {
    const result = await this.prisma.$executeRawUnsafe(
      `INSERT INTO CustomerDevice
       (userId, serviceRequestId, customerName, customerPhone, customerEmail, label, applianceType, brand, model, serialNumber, installationAddress, district, installedAt, warrantyUntil, metadata, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      dto.userId ?? null,
      dto.serviceRequestId ?? null,
      dto.customerName,
      dto.customerPhone,
      dto.customerEmail ?? null,
      dto.label ?? null,
      dto.applianceType,
      dto.brand ?? null,
      dto.model ?? null,
      dto.serialNumber ?? null,
      dto.installationAddress ?? null,
      dto.district ?? null,
      dto.installedAt ? new Date(dto.installedAt) : null,
      dto.warrantyUntil ? new Date(dto.warrantyUntil) : null,
      dto.metadata ? JSON.stringify(dto.metadata) : null,
      dto.isActive ?? true,
    );
    const idRows = await this.prisma.$queryRawUnsafe<IdRow[]>(`SELECT LAST_INSERT_ID() id`);
    if (dto.serviceRequestId) await this.audit(dto.serviceRequestId, 'DEVICE_CREATED', actor, { deviceId: String(idRows[0]?.id) });
    return this.deviceDetail(numberValue(idRows[0]?.id));
  }

  async updateDevice(id: number, dto: CustomerDeviceDto, actor: OperationsActor) {
    const current = await this.deviceDetail(id);
    await this.prisma.$executeRawUnsafe(
      `UPDATE CustomerDevice SET userId=?, serviceRequestId=?, customerName=?, customerPhone=?, customerEmail=?, label=?, applianceType=?, brand=?, model=?, serialNumber=?, installationAddress=?, district=?, installedAt=?, warrantyUntil=?, metadata=?, isActive=? WHERE id=?`,
      dto.userId ?? null, dto.serviceRequestId ?? null, dto.customerName, dto.customerPhone,
      dto.customerEmail ?? null, dto.label ?? null, dto.applianceType, dto.brand ?? null, dto.model ?? null,
      dto.serialNumber ?? null, dto.installationAddress ?? null, dto.district ?? null,
      dto.installedAt ? new Date(dto.installedAt) : null,
      dto.warrantyUntil ? new Date(dto.warrantyUntil) : null,
      dto.metadata ? JSON.stringify(dto.metadata) : null,
      dto.isActive ?? true,
      id,
    );
    const requestId = String(dto.serviceRequestId || current.serviceRequestId || '');
    if (requestId) await this.audit(requestId, 'DEVICE_UPDATED', actor, { deviceId: id });
    return this.deviceDetail(id);
  }

  private async deviceDetail(id: number) {
    const rows = await this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT * FROM CustomerDevice WHERE id = ? LIMIT 1`, id);
    if (!rows.length) throw new NotFoundException('Không tìm thấy thiết bị');
    return rows[0];
  }

  async listTechnicians(query: OperationsQueryDto) {
    const where: string[] = ['1=1'];
    const params: unknown[] = [];
    if (query.q) {
      const term = `%${query.q.trim()}%`;
      where.push('(t.id LIKE ? OR t.name LIKE ? OR t.phone LIKE ? OR t.email LIKE ?)');
      params.push(term, term, term, term);
    }
    if (query.status) { where.push('t.status = ?'); params.push(query.status); }
    const offset = (query.page - 1) * query.limit;
    const items = await this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT t.*,
              COUNT(DISTINCT CASE WHEN a.status='ACTIVE' THEN a.id END) activeAssignments,
              MIN(CASE WHEN s.status IN ('TENTATIVE','CONFIRMED') AND s.endAt >= NOW(3) THEN s.startAt END) nextScheduleAt
       FROM Technician t
       LEFT JOIN DispatchAssignment a ON a.technicianId = t.id
       LEFT JOIN TechnicianSchedule s ON s.technicianId = t.id
       WHERE ${where.join(' AND ')}
       GROUP BY t.id
       ORDER BY t.status='available' DESC, t.rating DESC, t.name ASC
       LIMIT ? OFFSET ?`,
      ...params,
      query.limit,
      offset,
    );
    const totalRows = await this.prisma.$queryRawUnsafe<CountRow[]>(`SELECT COUNT(*) total FROM Technician t WHERE ${where.join(' AND ')}`, ...params);
    const total = numberValue(totalRows[0]?.total);
    return { items, meta: { page: query.page, limit: query.limit, total, totalPages: Math.max(1, Math.ceil(total / query.limit)) } };
  }

  async technicianDetail(id: string, from?: string, to?: string) {
    const technician = await this.technicianOrThrow(id);
    const start = from ? new Date(from) : new Date(Date.now() - 7 * 86400000);
    const end = to ? new Date(to) : new Date(Date.now() + 30 * 86400000);
    const [schedule, assignments] = await Promise.all([
      this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT * FROM TechnicianSchedule WHERE technicianId = ? AND startAt < ? AND endAt > ? ORDER BY startAt`, id, end, start),
      this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT a.*, r.customerName, r.customerPhone, r.customerAddress, r.applianceType, r.workflowStatus FROM DispatchAssignment a JOIN ServiceRequest r ON r.id=a.requestId WHERE a.technicianId=? ORDER BY a.scheduledStart DESC LIMIT 100`, id),
    ]);
    return { technician: { ...technician, skills: parseJson(technician.skills, []), workingAreas: parseJson(technician.workingAreas, []) }, schedule, assignments };
  }

  async createSchedule(dto: TechnicianScheduleDto, actor: OperationsActor) {
    const technician = await this.technicianOrThrow(dto.technicianId);
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (dto.status !== 'CANCELLED') await this.assertNoTechnicianOverlap(dto.technicianId, startAt, endAt);
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO TechnicianSchedule (technicianId, requestId, scheduleType, status, startAt, endAt, note, createdById)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      dto.technicianId, dto.requestId ?? null, dto.scheduleType, dto.status, startAt, endAt, dto.note ?? null, actor.userId,
    );
    const ids = await this.prisma.$queryRawUnsafe<IdRow[]>(`SELECT LAST_INSERT_ID() id`);
    if (dto.requestId) await this.audit(dto.requestId, 'TECHNICIAN_SCHEDULE_CREATED', actor, { scheduleId: String(ids[0]?.id), technicianId: technician.id });
    return { id: String(ids[0]?.id), technicianId: dto.technicianId, startAt, endAt, status: dto.status };
  }

  async dispatch(requestId: string, dto: DispatchDto, actor: OperationsActor) {
    const startAt = new Date(dto.scheduledStart);
    const endAt = new Date(dto.scheduledEnd);
    return this.prisma.$transaction(async (tx) => {
      const request = await this.requestOrThrow(requestId, tx as PrismaService);
      const technician = await this.technicianOrThrow(dto.technicianId, tx as PrismaService);
      if (technician.status === 'inactive' || technician.status === 'offline') throw new ConflictException('Kỹ thuật viên không ở trạng thái có thể phân công');
      const skills = parseJson<string[]>(technician.skills, []);
      const areas = parseJson<string[]>(technician.workingAreas, []);
      if (!dto.force && skills.length && !skills.includes(request.serviceCategoryId)) throw new ConflictException('Kỹ thuật viên không có chuyên môn phù hợp');
      if (!dto.force && areas.length && !areas.includes(request.district)) throw new ConflictException('Kỹ thuật viên không phụ trách khu vực này');
      await this.assertNoTechnicianOverlap(dto.technicianId, startAt, endAt, undefined, tx as PrismaService);

      const activeAssignments = await tx.$queryRawUnsafe<Array<{ id: bigint; technicianId: string }>>(
        `SELECT id, technicianId FROM DispatchAssignment WHERE requestId=? AND status='ACTIVE' FOR UPDATE`,
        requestId,
      );
      for (const active of activeAssignments) {
        await tx.$executeRawUnsafe(`UPDATE DispatchAssignment SET status='TRANSFERRED', endedAt=NOW(3) WHERE id=?`, active.id);
        await tx.$executeRawUnsafe(`UPDATE TechnicianSchedule SET status='CANCELLED', note=CONCAT(COALESCE(note,''),' | Chuyển kỹ thuật viên') WHERE requestId=? AND technicianId=? AND status IN ('TENTATIVE','CONFIRMED')`, requestId, active.technicianId);
      }
      await tx.$executeRawUnsafe(
        `INSERT INTO DispatchAssignment (requestId, technicianId, scheduledStart, scheduledEnd, reason, createdById)
         VALUES (?, ?, ?, ?, ?, ?)`,
        requestId, dto.technicianId, startAt, endAt, dto.reason ?? null, actor.userId,
      );
      await tx.$executeRawUnsafe(
        `INSERT INTO TechnicianSchedule (technicianId, requestId, scheduleType, status, startAt, endAt, note, createdById)
         VALUES (?, ?, 'WORK', 'CONFIRMED', ?, ?, ?, ?)`,
        dto.technicianId, requestId, startAt, endAt, dto.reason ?? null, actor.userId,
      );
      const statusChanged = !['ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'WARRANTY', 'CLOSED'].includes(request.workflowStatus);
      await tx.$executeRawUnsafe(
        `UPDATE ServiceRequest SET assignedTechnicianId=?, scheduledAt=?, assignedAt=COALESCE(assignedAt,NOW(3)), workflowStatus=CASE WHEN workflowStatus IN ('NEW','CONFIRMED','RESCHEDULED') THEN 'ASSIGNED' ELSE workflowStatus END, status=CASE WHEN status IN ('pending','confirmed') THEN 'assigned' ELSE status END, requestVersion=requestVersion+1 WHERE id=?`,
        dto.technicianId, startAt, requestId,
      );
      await tx.$executeRawUnsafe(`UPDATE Technician SET status='busy' WHERE id=?`, dto.technicianId);
      await tx.$executeRawUnsafe(`UPDATE ServiceRequestSla SET assignedWithinSlaAt=COALESCE(assignedWithinSlaAt,NOW(3)), arrivalDueAt=COALESCE(arrivalDueAt,?), lastEvaluatedAt=NOW(3) WHERE requestId=?`, startAt, requestId);
      if (statusChanged) {
        await tx.$executeRawUnsafe(
          `INSERT INTO ServiceRequestStatusEvent (requestId, fromStatus, toStatus, note, actorType, actorId, actorName, metadata)
           VALUES (?, ?, 'ASSIGNED', ?, 'ADMIN', ?, ?, ?)`,
          requestId, request.workflowStatus, dto.reason ?? 'Phân công kỹ thuật viên', String(actor.userId), actor.name || actor.email,
          JSON.stringify({ technicianId: dto.technicianId, scheduledStart: startAt, scheduledEnd: endAt }),
        );
      }
      await this.audit(requestId, activeAssignments.length ? 'TECHNICIAN_TRANSFERRED' : 'TECHNICIAN_ASSIGNED', actor, { technicianId: dto.technicianId, scheduledStart: startAt, scheduledEnd: endAt, forced: Boolean(dto.force) }, tx as PrismaService);
      return this.workspace(requestId, tx as PrismaService);
    });
  }

  async reschedule(requestId: string, dto: RescheduleDto, actor: OperationsActor) {
    const startAt = new Date(dto.scheduledStart);
    const endAt = new Date(dto.scheduledEnd);
    return this.prisma.$transaction(async (tx) => {
      await this.requestOrThrow(requestId, tx as PrismaService);
      const assignments = await tx.$queryRawUnsafe<Array<{ id: bigint; technicianId: string }>>(`SELECT id, technicianId FROM DispatchAssignment WHERE requestId=? AND status='ACTIVE' LIMIT 1 FOR UPDATE`, requestId);
      if (!assignments.length) throw new ConflictException('Yêu cầu chưa có kỹ thuật viên đang phụ trách');
      const schedules = await tx.$queryRawUnsafe<Array<{ id: bigint }>>(`SELECT id FROM TechnicianSchedule WHERE requestId=? AND technicianId=? AND status IN ('TENTATIVE','CONFIRMED') LIMIT 1 FOR UPDATE`, requestId, assignments[0].technicianId);
      await this.assertNoTechnicianOverlap(assignments[0].technicianId, startAt, endAt, schedules[0]?.id, tx as PrismaService);
      await tx.$executeRawUnsafe(`UPDATE DispatchAssignment SET scheduledStart=?, scheduledEnd=?, reason=? WHERE id=?`, startAt, endAt, dto.reason, assignments[0].id);
      if (schedules.length) await tx.$executeRawUnsafe(`UPDATE TechnicianSchedule SET startAt=?, endAt=?, note=? WHERE id=?`, startAt, endAt, dto.reason, schedules[0].id);
      await tx.$executeRawUnsafe(`UPDATE ServiceRequest SET scheduledAt=?, preferredDate=?, preferredTimeSlot=?, workflowStatus=CASE WHEN workflowStatus IN ('NEW','CONFIRMED','ASSIGNED') THEN 'RESCHEDULED' ELSE workflowStatus END, requestVersion=requestVersion+1 WHERE id=?`, startAt, startAt.toISOString().slice(0, 10), `${startAt.toTimeString().slice(0,5)} - ${endAt.toTimeString().slice(0,5)}`, requestId);
      await tx.$executeRawUnsafe(`INSERT INTO ServiceRequestStatusEvent (requestId, fromStatus, toStatus, note, actorType, actorId, actorName, metadata) SELECT id, workflowStatus, 'RESCHEDULED', ?, 'ADMIN', ?, ?, ? FROM ServiceRequest WHERE id=?`, dto.reason, String(actor.userId), actor.name || actor.email, JSON.stringify({ scheduledStart: startAt, scheduledEnd: endAt }), requestId);
      await this.audit(requestId, 'REQUEST_RESCHEDULED', actor, { scheduledStart: startAt, scheduledEnd: endAt, reason: dto.reason }, tx as PrismaService);
      return this.workspace(requestId, tx as PrismaService);
    });
  }

  async addNote(requestId: string, dto: InternalNoteDto, actor: OperationsActor) {
    await this.requestOrThrow(requestId);
    await this.prisma.$executeRawUnsafe(`INSERT INTO ServiceRequestInternalNote (requestId, body, visibility, authorId, authorName) VALUES (?, ?, ?, ?, ?)`, requestId, dto.body, dto.visibility, actor.userId, actor.name || actor.email);
    await this.audit(requestId, 'INTERNAL_NOTE_ADDED', actor, { visibility: dto.visibility });
    return { success: true };
  }

  async listSlaPolicies() {
    return this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT p.*, c.name serviceCategoryName FROM SlaPolicy p LEFT JOIN ServiceCategory c ON c.id=p.serviceCategoryId ORDER BY p.serviceCategoryId IS NULL DESC, p.serviceCategoryId, FIELD(p.priority,'urgent','high','medium','low')`);
  }

  async saveSlaPolicy(dto: SlaPolicyDto, actor: OperationsActor, id?: number) {
    if (id) {
      await this.prisma.$executeRawUnsafe(`UPDATE SlaPolicy SET serviceCategoryId=?, priority=?, responseMinutes=?, assignMinutes=?, arrivalMinutes=?, resolutionMinutes=?, warrantyResponseMinutes=?, businessHoursOnly=?, isActive=? WHERE id=?`, dto.serviceCategoryId ?? null, dto.priority, dto.responseMinutes, dto.assignMinutes, dto.arrivalMinutes, dto.resolutionMinutes, dto.warrantyResponseMinutes, dto.businessHoursOnly ?? false, dto.isActive ?? true, id);
    } else {
      await this.prisma.$executeRawUnsafe(`INSERT INTO SlaPolicy (serviceCategoryId, priority, responseMinutes, assignMinutes, arrivalMinutes, resolutionMinutes, warrantyResponseMinutes, businessHoursOnly, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, dto.serviceCategoryId ?? null, dto.priority, dto.responseMinutes, dto.assignMinutes, dto.arrivalMinutes, dto.resolutionMinutes, dto.warrantyResponseMinutes, dto.businessHoursOnly ?? false, dto.isActive ?? true);
      const rows = await this.prisma.$queryRawUnsafe<IdRow[]>(`SELECT LAST_INSERT_ID() id`);
      id = numberValue(rows[0]?.id);
    }
    return { id, updatedBy: actor.email };
  }

  async evaluateSla() {
    await this.prisma.$executeRawUnsafe(
      `UPDATE ServiceRequestSla s
       JOIN ServiceRequest r ON r.id=s.requestId
       SET s.breachStage = CASE
         WHEN s.responseDueAt < NOW(3) AND s.firstRespondedAt IS NULL THEN 'RESPONSE'
         WHEN s.assignDueAt < NOW(3) AND s.assignedWithinSlaAt IS NULL THEN 'ASSIGNMENT'
         WHEN s.arrivalDueAt < NOW(3) AND s.arrivedAt IS NULL THEN 'ARRIVAL'
         WHEN s.resolutionDueAt < NOW(3) AND s.resolvedAt IS NULL THEN 'RESOLUTION'
         ELSE NULL END,
         s.breachedAt = CASE WHEN s.breachedAt IS NULL AND (
           (s.responseDueAt < NOW(3) AND s.firstRespondedAt IS NULL) OR
           (s.assignDueAt < NOW(3) AND s.assignedWithinSlaAt IS NULL) OR
           (s.arrivalDueAt < NOW(3) AND s.arrivedAt IS NULL) OR
           (s.resolutionDueAt < NOW(3) AND s.resolvedAt IS NULL)
         ) THEN NOW(3) ELSE s.breachedAt END,
         s.lastEvaluatedAt=NOW(3)
       WHERE s.status='ACTIVE' AND r.workflowStatus NOT IN ('COMPLETED','CLOSED','CANCELLED','REJECTED')`,
    );
    return this.slaAlerts(new OperationsQueryDto());
  }

  async slaAlerts(query: OperationsQueryDto) {
    const where = [`s.status='ACTIVE'`, `r.workflowStatus NOT IN ('COMPLETED','CLOSED','CANCELLED','REJECTED')`];
    const params: unknown[] = [];
    if (query.breached) where.push('s.breachStage IS NOT NULL');
    if (query.priority) { where.push('r.priority=?'); params.push(query.priority); }
    return this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT r.id, r.customerName, r.customerPhone, r.priority, r.workflowStatus, r.assignedTechnicianId,
              s.responseDueAt, s.assignDueAt, s.arrivalDueAt, s.resolutionDueAt, s.breachStage, s.breachedAt,
              TIMESTAMPDIFF(MINUTE, NOW(3), s.resolutionDueAt) minutesToResolution,
              t.name technicianName
       FROM ServiceRequestSla s
       JOIN ServiceRequest r ON r.id=s.requestId
       LEFT JOIN Technician t ON t.id=r.assignedTechnicianId
       WHERE ${where.join(' AND ')}
       ORDER BY s.breachStage IS NOT NULL DESC, s.resolutionDueAt ASC
       LIMIT 200`,
      ...params,
    );
  }

  async createQuote(requestId: string, dto: CreateQuoteDto, actor: OperationsActor) {
    await this.requestOrThrow(requestId);
    const calculated = calculateQuote(dto);
    const confirmationToken = randomBytes(32).toString('base64url');
    const quoteNumber = publicCode('QT');
    const quote = await this.prisma.$transaction(async (tx) => {
      const versionRows = await tx.$queryRawUnsafe<Array<{ nextVersion: unknown }>>(`SELECT COALESCE(MAX(version),0)+1 nextVersion FROM ServiceQuote WHERE requestId=? FOR UPDATE`, requestId);
      const version = numberValue(versionRows[0]?.nextVersion) || 1;
      await tx.$executeRawUnsafe(
        `INSERT INTO ServiceQuote
         (quoteNumber, requestId, version, status, laborSubtotal, materialSubtotal, discountType, discountValue, discountAmount, taxRate, taxAmount, subtotal, totalAmount, notes, validUntil, confirmationTokenHash, sentAt, createdById, updatedById)
         VALUES (?, ?, ?, 'SENT', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), ?, ?)`,
        quoteNumber, requestId, version, calculated.laborSubtotal, calculated.materialSubtotal, dto.discountType,
        dto.discountValue, calculated.discountAmount, dto.taxRate, calculated.taxAmount, calculated.subtotal,
        calculated.totalAmount, dto.notes ?? null, dto.validUntil ? new Date(dto.validUntil) : null,
        tokenHash(confirmationToken), actor.userId, actor.userId,
      );
      const idRows = await tx.$queryRawUnsafe<IdRow[]>(`SELECT LAST_INSERT_ID() id`);
      const quoteId = numberValue(idRows[0]?.id);
      for (const line of calculated.lines) {
        await tx.$executeRawUnsafe(`INSERT INTO ServiceQuoteLine (quoteId, lineType, description, sku, quantity, unit, unitPrice, lineTotal, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, quoteId, line.lineType, line.description, line.sku ?? null, line.quantity, line.unit, line.unitPrice, line.lineTotal, line.sortOrder);
      }
      await this.audit(requestId, 'QUOTE_SENT', actor, { quoteId, quoteNumber, totalAmount: calculated.totalAmount, version }, tx as PrismaService);
      return { id: quoteId, quoteNumber, version, ...calculated };
    });
    return { ...quote, status: 'SENT', confirmationToken, confirmationUrl: `/quote-confirmation?token=${encodeURIComponent(confirmationToken)}` };
  }

  async quoteDecision(dto: QuoteDecisionDto) {
    const hash = tokenHash(dto.token);
    const rows = await this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT * FROM ServiceQuote WHERE confirmationTokenHash=? AND status='SENT' LIMIT 1`, hash);
    if (!rows.length) throw new NotFoundException('Báo giá không tồn tại hoặc đã được xử lý');
    const quote = rows[0];
    if (quote.validUntil && new Date(String(quote.validUntil)) < new Date()) throw new ConflictException('Báo giá đã hết hiệu lực');
    const accepted = dto.decision === 'ACCEPT';
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`UPDATE ServiceQuote SET status=?, customerConfirmedAt=?, customerRejectedAt=?, confirmationTokenHash=NULL, notes=CONCAT(COALESCE(notes,''), ?) WHERE id=?`, accepted ? 'ACCEPTED' : 'REJECTED', accepted ? new Date() : null, accepted ? null : new Date(), dto.note ? `\nKhách hàng: ${dto.note}` : '', quote.id);
      await tx.$executeRawUnsafe(`INSERT INTO ServiceRequestAudit (requestId, action, actorType, actorName, metadata) VALUES (?, ?, 'CUSTOMER', 'Khách hàng', ?)`, quote.requestId, accepted ? 'QUOTE_ACCEPTED' : 'QUOTE_REJECTED', JSON.stringify({ quoteId: quote.id, note: dto.note ?? null }));
    });
    return { success: true, decision: dto.decision, quoteNumber: quote.quoteNumber };
  }

  async quoteDetail(id: number) {
    const quotes = await this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT * FROM ServiceQuote WHERE id=? LIMIT 1`, id);
    if (!quotes.length) throw new NotFoundException('Không tìm thấy báo giá');
    const lines = await this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT * FROM ServiceQuoteLine WHERE quoteId=? ORDER BY sortOrder,id`, id);
    return { quote: quotes[0], lines };
  }

  async recordPayment(requestId: string, dto: PaymentRecordDto, actor: OperationsActor) {
    await this.requestOrThrow(requestId);
    const paymentNumber = publicCode('PAY');
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`INSERT INTO ServicePaymentRecord (paymentNumber, requestId, quoteId, method, status, amount, transactionReference, note, receivedById, paidAt) VALUES (?, ?, ?, ?, 'COMPLETED', ?, ?, ?, ?, ?)`, paymentNumber, requestId, dto.quoteId ?? null, dto.method, dto.amount, dto.transactionReference ?? null, dto.note ?? null, actor.userId, dto.paidAt ? new Date(dto.paidAt) : new Date());
      const totals = await tx.$queryRawUnsafe<Array<{ paid: unknown; due: unknown }>>(`SELECT (SELECT COALESCE(SUM(amount),0) FROM ServicePaymentRecord WHERE requestId=? AND status='COMPLETED') paid, (SELECT COALESCE(MAX(totalAmount),0) FROM ServiceQuote WHERE requestId=? AND status='ACCEPTED') due`, requestId, requestId);
      const paid = numberValue(totals[0]?.paid);
      const due = numberValue(totals[0]?.due);
      await tx.$executeRawUnsafe(`UPDATE ServiceRequest SET paymentStatus=?, finalPrice=GREATEST(finalPrice, ?) WHERE id=?`, due > 0 && paid >= due ? 'paid' : 'partial', due || paid, requestId);
      await this.audit(requestId, 'PAYMENT_RECORDED', actor, { paymentNumber, method: dto.method, amount: dto.amount, paid, due }, tx as PrismaService);
    });
    return { paymentNumber, requestId, amount: dto.amount, status: 'COMPLETED' };
  }

  async createCompletion(requestId: string, dto: CompletionReportDto, actor: OperationsActor) {
    const request = await this.requestOrThrow(requestId);
    const reportNumber = publicCode('CR');
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `INSERT INTO CompletionReport (reportNumber, requestId, technicianId, diagnosis, workPerformed, materialsUsed, recommendations, customerName, customerConfirmedAt, customerSignatureUrl, technicianSignatureUrl, completedAt, createdById)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        reportNumber, requestId, request.assignedTechnicianId ?? null, dto.diagnosis, dto.workPerformed,
        dto.materialsUsed ? JSON.stringify(dto.materialsUsed) : null, dto.recommendations ?? null, dto.customerName ?? null,
        dto.customerSignatureUrl ? new Date() : null, dto.customerSignatureUrl ?? null, dto.technicianSignatureUrl ?? null,
        new Date(dto.completedAt), actor.userId,
      );
      await tx.$executeRawUnsafe(`UPDATE ServiceRequest SET workflowStatus='COMPLETED', status='completed', completedAt=?, lastStatusChangedAt=NOW(3), requestVersion=requestVersion+1 WHERE id=?`, new Date(dto.completedAt), requestId);
      await tx.$executeRawUnsafe(`UPDATE ServiceRequestSla SET resolvedAt=?, status='STOPPED', lastEvaluatedAt=NOW(3) WHERE requestId=?`, new Date(dto.completedAt), requestId);
      await tx.$executeRawUnsafe(`INSERT INTO ServiceRequestStatusEvent (requestId, fromStatus, toStatus, note, actorType, actorId, actorName, metadata) VALUES (?, ?, 'COMPLETED', 'Lập biên bản hoàn thành', 'ADMIN', ?, ?, ?)`, requestId, request.workflowStatus, String(actor.userId), actor.name || actor.email, JSON.stringify({ reportNumber }));
      await this.audit(requestId, 'COMPLETION_REPORT_CREATED', actor, { reportNumber }, tx as PrismaService);
    });
    return { reportNumber, requestId, status: 'COMPLETED' };
  }

  async createWarranty(requestId: string, dto: WarrantyDto, actor: OperationsActor) {
    await this.requestOrThrow(requestId);
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (!(endsAt > startsAt)) throw new BadRequestException('Ngày kết thúc bảo hành phải sau ngày bắt đầu');
    const warrantyNumber = publicCode('WR');
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`INSERT INTO WarrantyRecord (warrantyNumber, requestId, completionReportId, deviceId, coverage, exclusions, startsAt, endsAt, createdById) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, warrantyNumber, requestId, dto.completionReportId ?? null, dto.deviceId ?? null, dto.coverage, dto.exclusions ?? null, startsAt, endsAt, actor.userId);
      await tx.$executeRawUnsafe(`UPDATE ServiceRequest SET warrantyStartedAt=?, requestVersion=requestVersion+1 WHERE id=?`, startsAt, requestId);
      await this.audit(requestId, 'WARRANTY_CREATED', actor, { warrantyNumber, startsAt, endsAt }, tx as PrismaService);
    });
    return { warrantyNumber, requestId, status: 'ACTIVE', startsAt, endsAt };
  }

  async addWarrantyEvent(warrantyId: number, dto: WarrantyEventDto, actor: OperationsActor) {
    const warranties = await this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT * FROM WarrantyRecord WHERE id=? LIMIT 1`, warrantyId);
    if (!warranties.length) throw new NotFoundException('Không tìm thấy hồ sơ bảo hành');
    const warranty = warranties[0];
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`INSERT INTO WarrantyEvent (warrantyId, requestId, eventType, status, description, resolution, handledById, occurredAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, warrantyId, dto.requestId ?? warranty.requestId, dto.eventType, dto.status, dto.description, dto.resolution ?? null, actor.userId, dto.occurredAt ? new Date(dto.occurredAt) : new Date());
      if (['RESOLVED','CLOSED'].includes(dto.eventType)) await tx.$executeRawUnsafe(`UPDATE WarrantyRecord SET status=?, closedAt=CASE WHEN ?='CLOSED' THEN NOW(3) ELSE closedAt END WHERE id=?`, dto.eventType === 'CLOSED' ? 'CLOSED' : 'ACTIVE', dto.eventType, warrantyId);
      await this.audit(String(warranty.requestId), 'WARRANTY_EVENT_ADDED', actor, { warrantyId, eventType: dto.eventType, status: dto.status }, tx as PrismaService);
    });
    return { success: true };
  }

  async workspace(requestId: string, tx: PrismaService = this.prisma) {
    const request = await this.requestOrThrow(requestId, tx);
    const [customer, device, assignments, notes, sla, quotes, payments, completion, warranties, timeline, audit] = await Promise.all([
      request.customerUserId ? tx.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT id,email,phone,firstName,lastName,isActive FROM User WHERE id=? LIMIT 1`, request.customerUserId) : Promise.resolve([]),
      tx.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT * FROM CustomerDevice WHERE serviceRequestId=? ORDER BY updatedAt DESC LIMIT 1`, requestId),
      tx.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT a.*, t.name technicianName, t.phone technicianPhone, t.rating technicianRating FROM DispatchAssignment a JOIN Technician t ON t.id=a.technicianId WHERE a.requestId=? ORDER BY a.assignedAt DESC`, requestId),
      tx.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT * FROM ServiceRequestInternalNote WHERE requestId=? ORDER BY createdAt DESC`, requestId),
      tx.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT s.*, p.responseMinutes,p.assignMinutes,p.arrivalMinutes,p.resolutionMinutes FROM ServiceRequestSla s LEFT JOIN SlaPolicy p ON p.id=s.policyId WHERE s.requestId=? LIMIT 1`, requestId),
      tx.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT * FROM ServiceQuote WHERE requestId=? ORDER BY version DESC`, requestId),
      tx.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT * FROM ServicePaymentRecord WHERE requestId=? ORDER BY paidAt DESC`, requestId),
      tx.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT * FROM CompletionReport WHERE requestId=? LIMIT 1`, requestId),
      tx.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT w.*, (SELECT COUNT(*) FROM WarrantyEvent e WHERE e.warrantyId=w.id) eventCount FROM WarrantyRecord w WHERE requestId=? ORDER BY createdAt DESC`, requestId),
      tx.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT * FROM ServiceRequestStatusEvent WHERE requestId=? ORDER BY createdAt DESC`, requestId),
      tx.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT * FROM ServiceRequestAudit WHERE requestId=? ORDER BY createdAt DESC LIMIT 200`, requestId),
    ]);
    const quoteDetails = await Promise.all(quotes.map(async (quote) => ({ ...quote, lines: await tx.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT * FROM ServiceQuoteLine WHERE quoteId=? ORDER BY sortOrder,id`, quote.id) })));
    return { request, customer: customer[0] ?? null, device: device[0] ?? null, assignments, notes, sla: sla[0] ?? null, quotes: quoteDetails, payments, completion: completion[0] ?? null, warranties, timeline, audit };
  }
}
