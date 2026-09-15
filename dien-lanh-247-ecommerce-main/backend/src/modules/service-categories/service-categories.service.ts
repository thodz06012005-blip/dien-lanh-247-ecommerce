import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class ServiceCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.serviceCategory.findMany({
      orderBy: { id: 'asc' },
    });
    return {
      success: true,
      data: categories,
    };
  }
}
