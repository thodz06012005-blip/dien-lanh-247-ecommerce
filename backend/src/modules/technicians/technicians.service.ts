import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { UpdateTechnicianStatusDto } from './dto/update-technician-status.dto';
import { TechnicianQueryDto } from './dto/technician-query.dto';
import { TechnicianStatus, Prisma } from '@prisma/client';

@Injectable()
export class TechniciansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTechnicianDto) {
    // Check duplicate phone
    const existingPhone = await this.prisma.technician.findUnique({
      where: { phone: dto.phone },
    });
    if (existingPhone) {
      throw new BadRequestException('Số điện thoại này đã được sử dụng bởi kỹ thuật viên khác');
    }

    // Check duplicate email
    const existingEmail = await this.prisma.technician.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new BadRequestException('Email này đã được sử dụng bởi kỹ thuật viên khác');
    }

    // Generate random String ID (TECH-xxx)
    let newId = '';
    let isUnique = false;
    while (!isUnique) {
      newId = `TECH-${Math.floor(100 + Math.random() * 900)}`;
      const existingTech = await this.prisma.technician.findUnique({
        where: { id: newId },
      });
      if (!existingTech) {
        isUnique = true;
      }
    }

    const tech = await this.prisma.technician.create({
      data: {
        id: newId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        avatar: dto.avatar,
        rating: dto.rating !== undefined ? dto.rating : 5.0,
        skills: dto.skills,
        workingAreas: dto.workingAreas,
        status: dto.status || TechnicianStatus.available,
        completedCount: 0,
      },
    });

    return {
      success: true,
      message: 'Tạo kỹ thuật viên thành công',
      data: tech,
    };
  }

  async findAll(query?: TechnicianQueryDto) {
    const page = Math.max(1, query?.page || 1);
    const limit = Math.min(100, Math.max(1, query?.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.TechnicianWhereInput = {};

    if (query?.status) {
      const statusUpper = query.status.toUpperCase();
      const validStatuses = Object.keys(TechnicianStatus);
      if (validStatuses.includes(statusUpper)) {
        where.status = statusUpper as TechnicianStatus;
      }
    }

    if (query?.skill) {
      where.skills = { array_contains: query.skill };
    }

    if (query?.workingArea) {
      where.workingAreas = { array_contains: query.workingArea };
    }

    if (query?.q) {
      const q = query.q.trim();
      if (q.length > 0) {
        where.OR = [
          { name: { contains: q } },
          { phone: { contains: q } },
          { email: { contains: q } },
        ];
      }
    }

    const sortOrder = (query?.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const sortBy = query?.sortBy || 'createdAt';
    let orderBy: Prisma.TechnicianOrderByWithRelationInput = { createdAt: sortOrder };

    const allowedSortFields = ['name', 'phone', 'status', 'rating', 'createdAt', 'updatedAt'];
    if (allowedSortFields.includes(sortBy)) {
      if (sortBy === 'name') orderBy = { name: sortOrder };
      else if (sortBy === 'phone') orderBy = { phone: sortOrder };
      else if (sortBy === 'status') orderBy = { status: sortOrder };
      else if (sortBy === 'rating') orderBy = { rating: sortOrder };
      else if (sortBy === 'createdAt') orderBy = { createdAt: sortOrder };
      else if (sortBy === 'updatedAt') orderBy = { updatedAt: sortOrder };
    }

    const list = await this.prisma.technician.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    });

    return {
      success: true,
      data: list,
    };
  }

  async findOne(id: string) {
    const tech = await this.prisma.technician.findUnique({
      where: { id },
    });
    if (!tech) {
      throw new NotFoundException('Không tìm thấy kỹ thuật viên');
    }
    return {
      success: true,
      data: tech,
    };
  }

  async update(id: string, dto: UpdateTechnicianDto) {
    const tech = await this.prisma.technician.findUnique({
      where: { id },
    });
    if (!tech) {
      throw new NotFoundException('Không tìm thấy kỹ thuật viên');
    }

    // Validate phone duplicate
    if (dto.phone && dto.phone !== tech.phone) {
      const existingPhone = await this.prisma.technician.findUnique({
        where: { phone: dto.phone },
      });
      if (existingPhone) {
        throw new BadRequestException('Số điện thoại này đã được sử dụng bởi kỹ thuật viên khác');
      }
    }

    // Validate email duplicate
    if (dto.email && dto.email !== tech.email) {
      const existingEmail = await this.prisma.technician.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new BadRequestException('Email này đã được sử dụng bởi kỹ thuật viên khác');
      }
    }

    // Check active job lock when changing status
    if (dto.status && dto.status !== tech.status) {
      const activeJob = await this.prisma.serviceRequest.findFirst({
        where: {
          assignedTechnicianId: id,
          status: {
            notIn: ['completed', 'cancelled'],
          },
        },
      });
      if (activeJob) {
        throw new BadRequestException('Không thể thay đổi trạng thái của kỹ thuật viên khi đang có lịch sửa chữa chưa hoàn thành!');
      }
    }

    // Update technician
    const updated = await this.prisma.technician.update({
      where: { id },
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        avatar: dto.avatar,
        rating: dto.rating,
        skills: dto.skills,
        workingAreas: dto.workingAreas,
        status: dto.status,
      },
    });

    return {
      success: true,
      message: 'Cập nhật thông tin kỹ thuật viên thành công',
      data: updated,
    };
  }

  async updateStatus(id: string, dto: UpdateTechnicianStatusDto) {
    const tech = await this.prisma.technician.findUnique({
      where: { id },
    });
    if (!tech) {
      throw new NotFoundException('Không tìm thấy kỹ thuật viên');
    }

    if (dto.status !== tech.status) {
      const activeJob = await this.prisma.serviceRequest.findFirst({
        where: {
          assignedTechnicianId: id,
          status: {
            notIn: ['completed', 'cancelled'],
          },
        },
      });
      if (activeJob) {
        throw new BadRequestException('Không thể thay đổi trạng thái của kỹ thuật viên khi đang có lịch sửa chữa chưa hoàn thành!');
      }
    }

    const updated = await this.prisma.technician.update({
      where: { id },
      data: {
        status: dto.status,
      },
    });

    return {
      success: true,
      message: 'Cập nhật trạng thái kỹ thuật viên thành công',
      data: updated,
    };
  }

  async remove(id: string) {
    const tech = await this.prisma.technician.findUnique({
      where: { id },
    });
    if (!tech) {
      throw new NotFoundException('Không tìm thấy kỹ thuật viên');
    }

    // Check active job before deletion
    const activeJob = await this.prisma.serviceRequest.findFirst({
      where: {
        assignedTechnicianId: id,
        status: {
          notIn: ['completed', 'cancelled'],
        },
      },
    });
    if (activeJob) {
      throw new BadRequestException('Không thể xóa kỹ thuật viên đang có lịch sửa chữa đang hoạt động!');
    }

    await this.prisma.technician.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Xóa kỹ thuật viên thành công',
    };
  }
}
