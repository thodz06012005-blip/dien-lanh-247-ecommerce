import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { UpdateTechnicianStatusDto } from './dto/update-technician-status.dto';
import { TechnicianQueryDto } from './dto/technician-query.dto';

const activeJobStatuses = ['assigned', 'in_progress', 'waiting_customer_approval'];

@Injectable()
export class TechniciansService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateReferences(skills?: string[], workingAreaIds?: string[]) {
    if (skills) {
      const count = await this.prisma.serviceCategory.count({ where: { id: { in: skills } } });
      if (count !== new Set(skills).size) throw new BadRequestException('Có serviceCategoryId không tồn tại');
    }
    if (workingAreaIds) {
      const count = await (this.prisma as any).serviceArea.count({ where: { id: { in: workingAreaIds }, isActive: true } });
      if (count !== new Set(workingAreaIds).size) throw new BadRequestException('Có ServiceArea ID không tồn tại hoặc đã ngừng');
    }
  }

  private view(tech: any, activeJobs = 0) {
    const accountStatus = tech.accountStatus || (tech.status === 'inactive' ? 'inactive' : 'active');
    const presence = tech.presence || (tech.status === 'offline' ? 'offline' : 'on_shift');
    return { ...tech, accountStatus, presence, busy: activeJobs > 0, operationalStatus: accountStatus === 'inactive' ? 'inactive' : presence === 'offline' ? 'offline' : activeJobs > 0 ? 'busy' : 'available' };
  }

  async create(dto: CreateTechnicianDto) {
    await this.validateReferences(dto.skills, dto.workingAreaIds);
    if (await this.prisma.technician.findUnique({ where: { phone: dto.phone } })) throw new BadRequestException('Số điện thoại này đã được sử dụng bởi kỹ thuật viên khác');
    if (await this.prisma.technician.findUnique({ where: { email: dto.email } })) throw new BadRequestException('Email này đã được sử dụng bởi kỹ thuật viên khác');
    let id = '';
    do id = `TECH-${Math.floor(100 + Math.random() * 900)}`; while (await this.prisma.technician.findUnique({ where: { id } }));
    const tech = await (this.prisma as any).technician.create({ data: { id, name: dto.name, phone: dto.phone, email: dto.email, avatar: dto.avatar, rating: dto.rating ?? 5, skills: dto.skills, workingAreaIds: dto.workingAreaIds, workingAreas: [], accountStatus: dto.accountStatus || 'active', presence: dto.presence || 'on_shift', completedCount: 0 } });
    return { success: true, message: 'Tạo kỹ thuật viên thành công', data: this.view(tech) };
  }

  async findAll(query?: TechnicianQueryDto) {
    const all = await (this.prisma as any).technician.findMany({ orderBy: { createdAt: query?.sortOrder === 'asc' ? 'asc' : 'desc' } });
    const counts = await this.prisma.serviceRequest.groupBy({ by: ['assignedTechnicianId'], where: { assignedTechnicianId: { not: null }, status: { in: activeJobStatuses as any } }, _count: true });
    const countMap = new Map(counts.map(item => [item.assignedTechnicianId, item._count]));
    let list = all.map((tech: any) => this.view(tech, countMap.get(tech.id) || 0));
    if (query?.q) { const q=query.q.toLowerCase(); list=list.filter((tech:any)=>[tech.name,tech.phone,tech.email].some(value=>String(value||'').toLowerCase().includes(q))); }
    if (query?.skill) list=list.filter((tech:any)=>(tech.skills||[]).includes(query.skill));
    if (query?.workingArea) list=list.filter((tech:any)=>(tech.workingAreaIds||[]).includes(query.workingArea));
    if (query?.status) list=list.filter((tech:any)=>tech.operationalStatus===query.status.toLowerCase());
    const total=list.length,page=Math.max(1,query?.page||1),limit=Math.min(100,Math.max(1,query?.limit||10));
    return { success: true, data: list.slice((page-1)*limit,page*limit), meta: { page, limit, total, totalPages: Math.ceil(total/limit) } };
  }

  async findOne(id: string) {
    const tech = await (this.prisma as any).technician.findUnique({ where: { id } });
    if (!tech) throw new NotFoundException('Không tìm thấy kỹ thuật viên');
    const activeJobs = await this.prisma.serviceRequest.count({ where: { assignedTechnicianId: id, status: { in: activeJobStatuses as any } } });
    return { success: true, data: this.view(tech, activeJobs) };
  }

  async update(id: string, dto: UpdateTechnicianDto) {
    const tech = await this.prisma.technician.findUnique({ where: { id } });
    if (!tech) throw new NotFoundException('Không tìm thấy kỹ thuật viên');
    await this.validateReferences(dto.skills, dto.workingAreaIds);
    if (dto.phone && dto.phone !== tech.phone && await this.prisma.technician.findUnique({ where: { phone: dto.phone } })) throw new BadRequestException('Số điện thoại này đã được sử dụng');
    if (dto.email && dto.email !== tech.email && await this.prisma.technician.findUnique({ where: { email: dto.email } })) throw new BadRequestException('Email này đã được sử dụng');
    const { status: forbiddenStatus, workingAreas: legacyAreas, ...data } = dto as any;
    if (forbiddenStatus !== undefined || legacyAreas !== undefined) throw new BadRequestException('Không được cập nhật busy/status hoặc workingAreas legacy');
    const updated = await (this.prisma as any).technician.update({ where: { id }, data });
    return { success: true, message: 'Cập nhật thông tin kỹ thuật viên thành công', data: this.view(updated) };
  }

  async updateStatus(id: string, dto: UpdateTechnicianStatusDto) {
    if ((dto as any).status !== undefined) throw new BadRequestException('busy là trạng thái dẫn xuất, không thể cập nhật trực tiếp');
    if (!dto.accountStatus && !dto.presence) throw new BadRequestException('Cần accountStatus hoặc presence');
    if (!await this.prisma.technician.findUnique({ where: { id } })) throw new NotFoundException('Không tìm thấy kỹ thuật viên');
    const updated = await (this.prisma as any).technician.update({ where: { id }, data: { accountStatus: dto.accountStatus, presence: dto.presence } });
    return { success: true, message: 'Cập nhật trạng thái kỹ thuật viên thành công', data: this.view(updated) };
  }

  async remove(id: string) {
    if (!await this.prisma.technician.findUnique({ where: { id } })) throw new NotFoundException('Không tìm thấy kỹ thuật viên');
    const activeJob = await this.prisma.serviceRequest.findFirst({ where: { assignedTechnicianId: id, status: { in: activeJobStatuses as any } } });
    if (activeJob) throw new BadRequestException('Không thể vô hiệu hóa kỹ thuật viên đang có lịch hoạt động');
    await (this.prisma as any).technician.update({ where: { id }, data: { accountStatus: 'inactive', presence: 'offline' } });
    return { success: true, message: 'Đã vô hiệu hóa kỹ thuật viên' };
  }
}
