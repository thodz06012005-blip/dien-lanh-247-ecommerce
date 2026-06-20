import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: dto,
    });
  }

  async findAll(query: ProductQueryDto) {
    const { page = 1, limit = 10, q, categoryId, brandId, minPrice, maxPrice, sortBy } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(q && {
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(brandId && { brandId }),
      ...(minPrice || maxPrice
        ? {
            basePrice: {
              ...(minPrice && { gte: minPrice }),
              ...(maxPrice && { lte: maxPrice }),
            },
          }
        : {}),
    };

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (sortBy === 'price_asc') orderBy = { basePrice: 'asc' };
    else if (sortBy === 'price_desc') orderBy = { basePrice: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          images: true,
          variants: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        images: true,
        variants: true,
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    return product;
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id); // Ensure exists
    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Ensure exists
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
