import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class TaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  async listPostCategories() {
    const data = await this.prisma.$queryRawUnsafe(
      `SELECT id, name, slug, description, seoTitle, seoDescription
       FROM Category
       WHERE categoryType = 'POST' AND isActive = TRUE
       ORDER BY sortOrder ASC, name ASC`,
    );
    return { success: true, data };
  }

  async listTags() {
    const data = await this.prisma.$queryRawUnsafe(
      `SELECT id, name, slug, description
       FROM Tag
       WHERE isActive = TRUE
       ORDER BY name ASC`,
    );
    return { success: true, data };
  }
}
