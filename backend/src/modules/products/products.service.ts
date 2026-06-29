import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private mapProduct(product: any) {
    if (!product) return null;

    // Smart simulation of specifications & features based on category slug
    let specifications = {};
    let features: string[] = [];

    const categorySlug = product.category?.slug || '';
    if (categorySlug === 'dieu-hoa') {
      specifications = {
        'Công suất lạnh': '1.0 HP - 9.200 BTU',
        'Phạm vi sử dụng': 'Dưới 15m²',
        'Công nghệ Inverter': 'Có (Tiết kiệm điện)',
        'Loại Gas': 'R-32',
        'Xuất xứ': 'Thái Lan/Việt Nam'
      };
      features = [
        'Công nghệ Inverter tiết kiệm điện tối ưu, vận hành cực kỳ êm ái',
        'Luồng gió Coanda độc quyền tránh thổi trực tiếp vào cơ thể',
        'Phin lọc Enzyme Blue kết hợp lọc bụi mịn PM2.5 khử mùi diệt khuẩn',
        'Chức năng chống ẩm mốc giúp dàn lạnh luôn sạch sẽ khô ráo'
      ];
    } else if (categorySlug === 'tu-lanh') {
      specifications = {
        'Dung tích sử dụng': '519 Lít',
        'Kiểu tủ': 'Side By Side - Ngăn đá bên trái',
        'Công nghệ tiết kiệm điện': 'Smart Inverter',
        'Công nghệ làm lạnh': 'Làm lạnh đa chiều',
        'Xuất xứ': 'Trung Quốc'
      };
      features = [
        'Hệ thống làm lạnh đa chiều tỏa nhiệt đều đến mọi ngăn tủ',
        'Hệ thống khay kính chịu lực bền bỉ và ngăn rau củ giữ ẩm chuyên biệt',
        'Đèn LED chiếu sáng tiết kiệm điện và chống lóa mắt',
        'Thiết kế phẳng tinh tế, tôn lên vẻ sang trọng của căn bếp hiện đại'
      ];
    } else {
      specifications = {
        'Thương hiệu': product.brand?.name || 'Điện Lạnh 247',
        'Bảo hành': '12 tháng',
        'Tình trạng': 'Mới 100% nguyên hộp'
      };
      features = [
        'Sản phẩm chính hãng chất lượng cao từ Điện Lạnh 247',
        'Hỗ trợ lắp đặt tận nơi nhanh chóng bởi thợ chuyên nghiệp',
        'Bảo hành kép uy tín từ hãng sản xuất và hệ thống cửa hàng'
      ];
    }

    const stock = product.variants?.reduce((acc: number, v: any) => acc + (v.stock || 0), 0) ?? 15;
    const primaryImg = product.images?.find((img: any) => img.isPrimary)?.url || product.images?.[0]?.url || 'https://placehold.co/600x400';

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.variants?.[0]?.sku || 'SP-UNKNOWN',
      description: product.description || '',
      basePrice: Number(product.basePrice),
      salePrice: product.variants?.[0]?.price ? Number(product.variants[0].price) : Math.round(Number(product.basePrice) * 0.9),
      isActive: product.isActive,
      categoryId: product.category?.slug || String(product.categoryId),
      brandId: product.brand?.slug || String(product.brandId),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      category: product.category,
      brand: product.brand,
      variants: product.variants,
      images: product.images?.map((img: any) => img.url) || [],
      thumbnail: primaryImg,
      inStock: stock > 0,
      quantity: stock,
      stock: stock,
      rating: 4.8,
      reviewCount: 15,
      specifications,
      features,
    };
  }

  async create(dto: CreateProductDto) {
    // 1. Resolve categoryId and brandId from slug
    let categoryId = 1;
    let brandId = 1;

    const cat = await this.prisma.category.findUnique({ where: { slug: dto.categoryId } });
    if (cat) categoryId = cat.id;

    const br = await this.prisma.brand.findUnique({ where: { slug: dto.brandId } });
    if (br) brandId = br.id;

    // 2. Create Product
    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description || '',
        basePrice: Number(dto.basePrice),
        isActive: dto.status === 'active' || dto.isActive !== false,
        categoryId,
        brandId,
      },
    });

    // 3. Create Variant
    if (dto.sku) {
      await this.prisma.variant.create({
        data: {
          sku: dto.sku,
          name: 'Tiêu chuẩn',
          price: Number(dto.salePrice || dto.basePrice),
          stock: Number(dto.stock || 0),
          productId: product.id,
        },
      });
    }

    // 4. Create Images
    if (dto.images && dto.images.length > 0) {
      for (const imgUrl of dto.images) {
        await this.prisma.productImage.create({
          data: {
            url: imgUrl,
            publicId: 'placeholder',
            isPrimary: imgUrl === dto.thumbnail,
            productId: product.id,
          },
        });
      }
    }

    return {
      success: true,
      data: product,
    };
  }

  async findAll(query: ProductQueryDto) {
    const { page = 1, limit = 10, q, categoryId, brandId, minPrice, maxPrice, sortBy } = query;
    const skip = (page - 1) * limit;

    let resolvedCategoryId: number | undefined;
    let resolvedBrandId: number | undefined;

    if (categoryId) {
      const isId = /^\d+$/.test(String(categoryId));
      if (isId) {
        resolvedCategoryId = Number(categoryId);
      } else {
        const cat = await this.prisma.category.findUnique({ where: { slug: String(categoryId) } });
        if (cat) resolvedCategoryId = cat.id;
      }
    }

    if (brandId) {
      const isId = /^\d+$/.test(String(brandId));
      if (isId) {
        resolvedBrandId = Number(brandId);
      } else {
        const br = await this.prisma.brand.findUnique({ where: { slug: String(brandId) } });
        if (br) resolvedBrandId = br.id;
      }
    }

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(q && {
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
        ],
      }),
      ...(resolvedCategoryId && { categoryId: resolvedCategoryId }),
      ...(resolvedBrandId && { brandId: resolvedBrandId }),
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

    const pagination = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return {
      success: true,
      data: items.map((p) => this.mapProduct(p)),
      meta: pagination,
      pagination,
    };
  }

  async findOne(identifier: string) {
    const isId = /^\d+$/.test(identifier);
    const where = isId ? { id: Number(identifier) } : { slug: identifier };

    const product = await this.prisma.product.findUnique({
      where,
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
    return {
      success: true,
      data: this.mapProduct(product),
    };
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(String(id)); // Ensure exists
    
    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.slug) updateData.slug = dto.slug;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.basePrice !== undefined) updateData.basePrice = Number(dto.basePrice);
    if (dto.status) updateData.isActive = dto.status === 'active';

    if (dto.categoryId) {
      const cat = await this.prisma.category.findUnique({ where: { slug: dto.categoryId } });
      if (cat) updateData.categoryId = cat.id;
    }

    if (dto.brandId) {
      const br = await this.prisma.brand.findUnique({ where: { slug: dto.brandId } });
      if (br) updateData.brandId = br.id;
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: updateData,
    });

    // Update variant
    if (dto.sku || dto.stock !== undefined || dto.salePrice !== undefined) {
      const firstVariant = await this.prisma.variant.findFirst({
        where: { productId: id },
      });

      if (firstVariant) {
        await this.prisma.variant.update({
          where: { id: firstVariant.id },
          data: {
            ...(dto.sku && { sku: dto.sku }),
            ...(dto.stock !== undefined && { stock: Number(dto.stock) }),
            ...(dto.salePrice !== undefined && { price: Number(dto.salePrice) }),
          },
        });
      } else if (dto.sku) {
        await this.prisma.variant.create({
          data: {
            sku: dto.sku,
            name: 'Tiêu chuẩn',
            price: Number(dto.salePrice || dto.basePrice || product.basePrice),
            stock: Number(dto.stock || 0),
            productId: id,
          },
        });
      }
    }

    // Update images
    if (dto.images) {
      await this.prisma.productImage.deleteMany({ where: { productId: id } });
      for (const imgUrl of dto.images) {
        await this.prisma.productImage.create({
          data: {
            url: imgUrl,
            publicId: 'placeholder',
            isPrimary: imgUrl === dto.thumbnail,
            productId: id,
          },
        });
      }
    }

    return {
      success: true,
      data: product,
    };
  }

  async remove(id: number) {
    await this.findOne(String(id)); // Ensure exists
    await this.prisma.product.delete({
      where: { id },
    });
    return {
      success: true,
      message: 'Xóa sản phẩm thành công',
    };
  }
}
