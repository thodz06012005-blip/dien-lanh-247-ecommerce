import { BadRequestException, ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma, ServiceRequest, ServiceRequestStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { EMPTY_BUSINESS_CONFIG, validateBusinessConfig } from '../../domain/business-config';
import { businessDate, buildReport, calculateTechnicianPay, createFinanceSnapshot, exportFinanceXml, FinanceSnapshot } from '../../domain/finance';
import { CompleteDto, FinanceUpdateDto, InspectionDto, SettlementDto } from './operations.dto';
import { jobInclude, jobView, jsonValue, technicianSelect } from './job-view';

type Actor = { id: string; name: string; technicianId?: string };
const nowMonth = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).slice(0, 7);
const history = (value: Prisma.JsonValue | null) => Array.isArray(value) ? value : [];

@Injectable()
export class OperationsService {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try { return await this.prisma.$transaction(work, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); }
      catch (error) {
        if (attempt < 2 && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') continue;
        throw error;
      }
    }
  }
  private async config(tx: Prisma.TransactionClient) {
    const settings = await tx.systemSetting.findUnique({ where: { id: 'default' } });
    if (!settings?.businessConfig) {
      if (await tx.serviceRequest.count({ where: { status: 'completed' } })) throw new ServiceUnavailableException('Cần xác nhận cấu hình tài chính cho dữ liệu cũ');
      return structuredClone(EMPTY_BUSINESS_CONFIG);
    }
    try { return validateBusinessConfig(settings.businessConfig); }
    catch { throw new ServiceUnavailableException('Cấu hình nghiệp vụ không hợp lệ'); }
  }
  private async job(tx: Prisma.TransactionClient, id: string, actor?: Actor) {
    // Row lock serializes actions from admin and technician; ownership is checked after acquiring it.
    await tx.$queryRaw`SELECT id FROM ServiceRequest WHERE id = ${id} FOR UPDATE`;
    const job = await tx.serviceRequest.findUnique({ where: { id } });
    if (!job || (actor?.technicianId && job.assignedTechnicianId !== actor.technicianId)) throw new NotFoundException('Không tìm thấy công việc');
    if (actor?.technicianId) {
      const tech = await tx.technician.findUnique({ where: { id: actor.technicianId } });
      if (!tech || tech.status === 'inactive') throw new NotFoundException('Tài khoản thợ không hoạt động');
    }
    return job;
  }
  private assertOpen(job: ServiceRequest) {
    if (['completed', 'cancelled'].includes(job.status)) throw new ConflictException('Công việc đã đóng');
  }
  private async availability(tx: Prisma.TransactionClient, id: string) {
    const tech = await tx.technician.findUnique({ where: { id } });
    if (!tech || ['inactive', 'offline'].includes(tech.status)) return;
    const count = await tx.serviceRequest.count({ where: { assignedTechnicianId: id, status: { in: ['assigned', 'in_progress'] } } });
    await tx.technician.update({ where: { id }, data: { status: count ? 'busy' : 'available' } });
  }
  private async save(tx: Prisma.TransactionClient, job: ServiceRequest, data: Prisma.ServiceRequestUpdateInput, actor: Actor, note: string) {
    const at = new Date().toISOString();
    const status = typeof data.status === 'string' ? data.status : job.status;
    return jobView(await tx.serviceRequest.update({ where: { id: job.id }, data: {
      ...data,
      activityLog: jsonValue([{ action: 'SERVICE_UPDATE', actor: actor.name, label: note, createdAt: at }, ...history(job.activityLog)]),
      ...(status !== job.status ? { statusHistory: jsonValue([...history(job.statusHistory), { status, note, updatedBy: actor.name, createdAt: at }]) } : {}),
    }, include: jobInclude }));
  }
  async assign(id: string, technicianId: string, actor: Actor) {
    return this.transaction(async tx => {
      const job = await this.job(tx, id); this.assertOpen(job);
      if (job.status === 'in_progress') throw new ConflictException('Không đổi thợ khi công việc đang thực hiện');
      await tx.$queryRaw`SELECT id FROM Technician WHERE id = ${technicianId} FOR UPDATE`;
      const tech = await tx.technician.findUnique({ where: { id: technicianId } });
      if (!tech) throw new NotFoundException('Không tìm thấy kỹ thuật viên');
      if (tech.status !== 'available' && !(tech.status === 'busy' && job.assignedTechnicianId === technicianId)) throw new ConflictException('Kỹ thuật viên không sẵn sàng');
      if (!Array.isArray(tech.skills) || !tech.skills.includes(job.serviceCategoryId) || !Array.isArray(tech.workingAreas) || !tech.workingAreas.includes(job.district)) throw new BadRequestException('Kỹ thuật viên không phù hợp chuyên môn hoặc khu vực');
      if (job.assignedTechnicianId === technicianId && job.status === 'assigned') return jobView(await tx.serviceRequest.findUniqueOrThrow({ where: { id }, include: jobInclude }));
      const result = await this.save(tx, job, { assignedTechnician: { connect: { id: technicianId } }, status: 'assigned', technicianDecision: null, acceptedAt: null, customerApprovalStatus: 'not_requested', customerApprovedAt: null, inspectionNote: null, estimatedPrice: 0 }, actor, `Phân công ${tech.name}`);
      await this.availability(tx, technicianId);
      if (job.assignedTechnicianId && job.assignedTechnicianId !== technicianId) await this.availability(tx, job.assignedTechnicianId);
      return result;
    });
  }
  async decision(id: string, decision: string, reason: string | undefined, actor: Actor) {
    return this.transaction(async tx => {
      const job = await this.job(tx, id, actor);
      if (job.status !== 'assigned') throw new ConflictException('Công việc không còn chờ nhận');
      if (decision === 'rejected' && (!reason || reason.trim().length < 3)) throw new BadRequestException('Vui lòng nhập lý do từ chối');
      const result = await this.save(tx, job, decision === 'accepted' ? { technicianDecision: 'accepted', acceptedAt: new Date() } : { technicianDecision: 'rejected', status: 'confirmed', assignedTechnician: { disconnect: true } }, actor, decision === 'accepted' ? 'Đã nhận công việc' : `Từ chối: ${reason}`);
      await this.availability(tx, actor.technicianId!); return result;
    });
  }
  async progress(id: string, actor: Actor) {
    return this.transaction(async tx => {
      const job = await this.job(tx, id, actor);
      if (job.status !== 'assigned' || job.technicianDecision !== 'accepted') throw new ConflictException('Cần nhận công việc trước khi bắt đầu');
      return this.save(tx, job, { status: 'in_progress' }, actor, 'Bắt đầu kiểm tra');
    });
  }
  async inspect(id: string, dto: InspectionDto, actor: Actor) {
    return this.transaction(async tx => {
      const job = await this.job(tx, id, actor); this.assertOpen(job);
      if (!['assigned', 'in_progress'].includes(job.status) || (actor.technicianId && job.status !== 'in_progress')) throw new ConflictException('Công việc chưa đến bước kiểm tra');
      return this.save(tx, job, { estimatedPrice: dto.estimatedPrice, inspectionNote: dto.diagnosis, customerApprovalStatus: dto.customerApprovalStatus, customerApprovedAt: dto.customerApprovalStatus === 'approved' ? new Date() : null }, actor, `Báo giá ${dto.estimatedPrice}đ — ${dto.customerApprovalStatus}`);
    });
  }
  async complete(id: string, dto: CompleteDto, actor: Actor) {
    return this.transaction(async tx => {
      const job = await this.job(tx, id, actor); this.assertOpen(job);
      if (!job.assignedTechnicianId || !['assigned', 'in_progress'].includes(job.status) || (actor.technicianId && job.status !== 'in_progress')) throw new ConflictException('Công việc chưa đến bước hoàn thành');
      if (job.customerApprovalStatus !== 'approved' || dto.finalPrice !== Number(job.estimatedPrice)) throw new ConflictException('Giá cuối cùng phải khớp báo giá được khách đồng ý');
      const photos = dto.photos || [];
      if (photos.some(p => !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p)) || photos.reduce((sum, p) => sum + p.length, 0) > 800000) throw new BadRequestException('Ảnh hoàn thành không hợp lệ hoặc quá lớn');
      const config = await this.config(tx); const now = new Date();
      const snapshot = createFinanceSnapshot({ ...job, finalPrice: dto.finalPrice }, config.finance, now.toISOString());
      const result = await this.save(tx, job, { status: 'completed', completedAt: now, finalPrice: dto.finalPrice, completionNote: dto.completionNote, completionPhotos: photos, paymentStatus: dto.paymentStatus, amountCollected: dto.paymentStatus === 'paid' ? dto.finalPrice : 0, paidAt: dto.paymentStatus === 'paid' ? now : null, financeSnapshot: jsonValue(snapshot) }, actor, dto.completionNote);
      await tx.technician.update({ where: { id: job.assignedTechnicianId }, data: { completedCount: { increment: 1 } } });
      await this.availability(tx, job.assignedTechnicianId);
      await tx.financeAuditLog.create({ data: { requestId: id, action: 'COMPLETE_SERVICE', actorId: actor.id, actorName: actor.name, after: jsonValue(snapshot) } });
      return result;
    });
  }
  async adminStatus(id: string, status: ServiceRequestStatus, finalPrice: number | undefined, note: string | undefined, actor: Actor) {
    if (status === 'completed') {
      if (finalPrice === undefined) throw new BadRequestException('Thiếu giá cuối cùng');
      return this.complete(id, { finalPrice, completionNote: note || 'Hoàn thành công việc', paymentStatus: 'unpaid' }, actor);
    }
    return this.transaction(async tx => {
      const job = await this.job(tx, id); this.assertOpen(job);
      if (job.status === status) return jobView(await tx.serviceRequest.findUniqueOrThrow({ where: { id }, include: jobInclude }));
      const allowed: Record<string, string[]> = { pending: ['confirmed', 'cancelled'], confirmed: ['cancelled'], assigned: ['in_progress', 'cancelled'], in_progress: ['cancelled'] };
      if (!allowed[job.status]?.includes(status)) throw new ConflictException('Chuyển trạng thái không hợp lệ; dùng chức năng phân công để gán thợ');
      const result = await this.save(tx, job, { status }, actor, note || `Cập nhật ${status}`);
      if (job.assignedTechnicianId) await this.availability(tx, job.assignedTechnicianId); return result;
    });
  }
  private async freezeLegacy(tx: Prisma.TransactionClient) {
    const config = await this.config(tx);
    const jobs = await tx.serviceRequest.findMany({ where: { status: 'completed', financeSnapshot: { equals: Prisma.DbNull } } });
    for (const job of jobs) {
      const snapshot = createFinanceSnapshot(job, config.finance, new Date().toISOString(), 'legacy-baseline');
      await tx.serviceRequest.update({ where: { id: job.id }, data: { financeSnapshot: jsonValue(snapshot) } });
      await tx.financeAuditLog.create({ data: { requestId: job.id, action: 'FREEZE_LEGACY_POLICY', actorId: 'system', actorName: 'System', after: jsonValue(snapshot) } });
    }
    return config;
  }
  async earnings(technicianId: string) {
    return this.transaction(async tx => {
      const config = await this.freezeLegacy(tx);
      const rows = await tx.serviceRequest.findMany({ where: { status: 'completed', assignedTechnicianId: technicianId } });
      const jobs = rows.map(job => ({ id: job.id, completedAt: (job.completedAt || job.updatedAt).toISOString(), revenue: Number(job.finalPrice), earning: calculateTechnicianPay({ ...job, financeSnapshot: job.financeSnapshot as unknown as FinanceSnapshot }, config.finance) }));
      return { total: jobs.reduce((s, j) => s + j.earning, 0), thisMonth: jobs.filter(j => businessDate(j.completedAt).startsWith(nowMonth())).reduce((s, j) => s + j.earning, 0), jobs };
    });
  }
  month(value?: string) {
    const month = value || nowMonth();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new BadRequestException('Tháng báo cáo không hợp lệ'); return month;
  }
  async report(value?: string) {
    const month = this.month(value);
    return this.transaction(async tx => {
      const config = await this.freezeLegacy(tx);
      const jobs = await tx.serviceRequest.findMany({ where: { status: 'completed' } });
      const technicians = await tx.technician.findMany({ select: technicianSelect });
      return buildReport({ settings: { businessConfig: config }, technicians, serviceRequests: jobs.map(job => ({ ...job, completedAt: (job.completedAt || job.updatedAt).toISOString(), paidAt: job.paidAt?.toISOString() })) }, month);
    });
  }
  async export(value?: string) { const month = this.month(value); return exportFinanceXml(await this.report(month), month); }
  async audit(value?: string) {
    const month = this.month(value);
    const [year, monthNumber] = month.split('-').map(Number);
    const start = new Date(`${month}-01T00:00:00+07:00`);
    const end = new Date(Date.UTC(year, monthNumber, 1) - 7 * 60 * 60 * 1000);
    return this.prisma.financeAuditLog.findMany({ where: { createdAt: { gte: start, lt: end } }, orderBy: { createdAt: 'desc' }, take: 200 });
  }
  async updateFinance(id: string, dto: FinanceUpdateDto, actor: Actor) {
    return this.transaction(async tx => {
      const config = await this.freezeLegacy(tx); const job = await this.job(tx, id);
      if (job.status !== 'completed') throw new NotFoundException('Không tìm thấy công việc đã hoàn thành');
      if (job.technicianSettlementStatus === 'settled') throw new ConflictException('Mở lại đối soát trước khi sửa tài chính');
      const revenue = Number(job.finalPrice);
      if (dto.amountCollected > revenue || (dto.paymentStatus === 'paid' && dto.amountCollected !== revenue) || (dto.paymentStatus === 'unpaid' && dto.amountCollected !== 0) || (dto.paymentStatus === 'partial' && (dto.amountCollected <= 0 || dto.amountCollected >= revenue))) throw new BadRequestException('Số tiền đã thu không khớp trạng thái thanh toán');
      const previous = job.financeSnapshot as unknown as FinanceSnapshot;
      const snapshot = createFinanceSnapshot({ ...job, partsCost: dto.partsCost }, previous?.policy || config.finance, new Date().toISOString(), 'finance-correction');
      const data = { partsCost: dto.partsCost, amountCollected: dto.amountCollected, paymentStatus: dto.paymentStatus, financeNote: dto.note, paidAt: dto.paymentStatus === 'paid' ? (job.paidAt || new Date()) : null, financeSnapshot: jsonValue(snapshot) };
      const result = await this.save(tx, job, data, actor, dto.note || 'Cập nhật tài chính');
      await tx.financeAuditLog.create({ data: { requestId: id, action: 'UPDATE_FINANCIALS', actorId: actor.id, actorName: actor.name, note: dto.note, before: jsonValue({ partsCost: job.partsCost, amountCollected: job.amountCollected, paymentStatus: job.paymentStatus, financeSnapshot: previous }), after: jsonValue(data) } });
      return result;
    });
  }
  async settlement(id: string, dto: SettlementDto, actor: Actor) {
    return this.transaction(async tx => {
      await this.freezeLegacy(tx); const job = await this.job(tx, id);
      if (job.status !== 'completed') throw new NotFoundException('Không tìm thấy công việc đã hoàn thành');
      const result = await this.save(tx, job, { technicianSettlementStatus: dto.status, technicianSettledAt: dto.status === 'settled' ? new Date() : null }, actor, dto.note || 'Cập nhật đối soát');
      await tx.financeAuditLog.create({ data: { requestId: id, action: 'UPDATE_SETTLEMENT', actorId: actor.id, actorName: actor.name, note: dto.note, before: { status: job.technicianSettlementStatus }, after: { status: dto.status } } }); return result;
    });
  }
}
