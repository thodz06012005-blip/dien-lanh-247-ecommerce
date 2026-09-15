import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      include: { children: true },
      orderBy: { id: 'asc' },
    });

    return {
      success: true,
      data: categories,
    };
  }
}
