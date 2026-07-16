import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const product = {
    id: 7,
    name: 'Điều hòa Inverter',
    slug: 'dieu-hoa-inverter',
    description: 'Tiết kiệm điện',
    basePrice: 12_000_000,
    isActive: true,
    categoryId: 1,
    brandId: 1,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-01T00:00:00.000Z'),
    category: { id: 1, name: 'Điều hòa', slug: 'dieu-hoa' },
    brand: { id: 1, name: 'Daikin', slug: 'daikin' },
    variants: [{ id: 1, sku: 'AC-01', price: 11_500_000, stock: 3 }],
    images: [{ url: 'https://example.test/ac.webp', isPrimary: true }],
    reviews: [],
  };

  const createPrisma = () => ({
    product: {
      findMany: jest.fn().mockResolvedValue([product]),
      count: jest.fn().mockResolvedValue(1),
      findFirst: jest.fn().mockResolvedValue(product),
      update: jest.fn().mockResolvedValue({ ...product, isActive: false }),
      create: jest.fn(),
    },
    category: { findUnique: jest.fn() },
    brand: { findUnique: jest.fn() },
    variant: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    productImage: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  });

  it('lists only active products for the public catalog and maps stock', async () => {
    const prisma = createPrisma();
    const service = new ProductsService(prisma as unknown as PrismaService);

    const result = await service.findAll({ page: 1, limit: 10 } as never);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
        skip: 0,
        take: 10,
      }),
    );
    expect(result.meta).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 });
    expect(result.data[0]).toMatchObject({
      id: 7,
      sku: 'AC-01',
      inStock: true,
      stock: 3,
    });
  });

  it('returns an empty page for an unknown category slug without querying products', async () => {
    const prisma = createPrisma();
    prisma.category.findUnique.mockResolvedValue(null);
    const service = new ProductsService(prisma as unknown as PrismaService);

    const result = await service.findAll({ categoryId: 'khong-ton-tai' } as never);

    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it('soft deletes products instead of removing rows', async () => {
    const prisma = createPrisma();
    const service = new ProductsService(prisma as unknown as PrismaService);

    await expect(service.remove(7)).resolves.toMatchObject({ success: true });
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { isActive: false },
    });
  });

  it('rejects operations on a missing product', async () => {
    const prisma = createPrisma();
    prisma.product.findFirst.mockResolvedValue(null);
    const service = new ProductsService(prisma as unknown as PrismaService);

    await expect(service.remove(999)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.product.update).not.toHaveBeenCalled();
  });
});
