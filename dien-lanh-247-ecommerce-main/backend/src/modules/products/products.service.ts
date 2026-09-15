import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Prisma } from '@prisma/client';

type ProductFindAllOptions = {
  includeInactive?: boolean;
};

type PaginationInfo = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

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

  private buildListResponse(items: any[], total: number, page: number, limit: number) {
    const pagination: PaginationInfo = {
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

  private normalizeBoolean(value?: string): boolean | undefined {
    if (value === undefined || value === null || value === '') return undefined;

    const normalized = String(value).trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n'].includes(normalized)) return false;

    return undefined;
  }

  private normalizeSort(sort?: string) {
    const normalized = (sort || 'newest').trim();

    const aliases: Record<string, string> = {
      newest: 'newest',
      oldest: 'oldest',
      price_asc: 'priceAsc',
      priceAsc: 'priceAsc',
      price_ascending: 'priceAsc',
      price_desc: 'priceDesc',
      priceDesc: 'priceDesc',
      price_descending: 'priceDesc',
      name_asc: 'nameAsc',
      nameAsc: 'nameAsc',
      name_desc: 'nameDesc',
      nameDesc: 'nameDesc',
      bestSeller: 'bestSeller',
      best_seller: 'bestSeller',
      promoHot: 'promoHot',
      promo_hot: 'promoHot',
    };

    return aliases[normalized] || 'newest';
  }

  private resolveOrderBy(sort: string): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case 'oldest':
        return { createdAt: 'asc' };
      case 'priceAsc':
        return { basePrice: 'asc' };
      case 'priceDesc':
        return { basePrice: 'desc' };
      case 'nameAsc':
        return { name: 'asc' };
      case 'nameDesc':
        return { name: 'desc' };
      default:
        return { createdAt: 'desc' };
    }
  }

  private isNumericId(value?: string) {
    return !!value && /^\d+$/.test(String(value));
  }

  private async resolveCategoryId(categoryId?: string) {
    if (!categoryId) return { value: undefined, isInvalid: false };
    if (this.isNumericId(categoryId)) return { value: Number(categoryId), isInvalid: false };

    const category = await this.prisma.category.findUnique({ where: { slug: String(categoryId) } });
    return category ? { value: category.id, isInvalid: false } : { value: undefined, isInvalid: true };
  }

  private async resolveBrandId(brandId?: string) {
    if (!brandId) return { value: undefined, isInvalid: false };
    if (this.isNumericId(brandId)) return { value: Number(brandId), isInvalid: false };

    const brand = await this.prisma.brand.findUnique({ where: { slug: String(brandId) } });
    return brand ? { value: brand.id, isInvalid: false } : { value: undefined, isInvalid: true };
  }

  private getProductText(product: any) {
    return [
      product.name,
      product.slug,
      product.description,
      product.category?.name,
      product.category?.slug,
      product.brand?.name,
      product.brand?.slug,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  private hasPromotionalVariant(product: any) {
    const basePrice = Number(product.basePrice || 0);
    if (!basePrice) return false;

    return product.variants?.some((variant: any) => Number(variant.price) < basePrice) ?? false;
  }

  private getBestDiscountRatio(product: any) {
    const basePrice = Number(product.basePrice || 0);
    if (!basePrice) return 0;

    const variantPrices = product.variants?.map((variant: any) => Number(variant.price)).filter((price: number) => price > 0) || [];
    if (!variantPrices.length) return 0;

    const bestPrice = Math.min(...variantPrices);
    return Math.max(0, (basePrice - bestPrice) / basePrice);
  }

  private requiresInMemoryProcessing(query: ProductQueryDto, sort: string) {
    return Boolean(
      query.hasPromo !== undefined ||
      query.inverter !== undefined ||
      query.capacity ||
      sort === 'promoHot'
    );
  }

  private applyInMemoryFilters(products: any[], query: ProductQueryDto) {
    const hasPromo = this.normalizeBoolean(query.hasPromo);
    const inverter = this.normalizeBoolean(query.inverter);
    const normalizedCapacity = query.capacity?.trim().toLowerCase();

    return products.filter((product) => {
      if (hasPromo !== undefined && this.hasPromotionalVariant(product) !== hasPromo) {
        return false;
      }

      if (inverter !== undefined) {
        const hasInverter = this.getProductText(product).includes('inverter');
        if (hasInverter !== inverter) return false;
      }

      if (normalizedCapacity) {
        const text = this.getProductText(product);
        const compactText = text.replace(/\s+/g, ' ');
        const compactCapacity = normalizedCapacity.replace(/\s+/g, ' ');
        if (!compactText.includes(compactCapacity)) return false;
      }

      return true;
    });
  }

  private applyInMemorySort(products: any[], sort: string) {
    if (sort !== 'promoHot') return products;

    return [...products].sort((a, b) => this.getBestDiscountRatio(b) - this.getBestDiscountRatio(a));
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

  async findAll(query: ProductQueryDto, options: ProductFindAllOptions = {}) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 10)));
    const skip = (page - 1) * limit;
    const sort = this.normalizeSort(query.sortBy || query.sort);
    const activeMinPrice = query.minPrice ?? query.priceMin;
    const activeMaxPrice = query.maxPrice ?? query.priceMax;
    const inStock = this.normalizeBoolean(query.inStock);

    const [categoryResult, brandResult] = await Promise.all([
      this.resolveCategoryId(query.categoryId),
      this.resolveBrandId(query.brandId),
    ]);

    if (categoryResult.isInvalid || brandResult.isInvalid) {
      return this.buildListResponse([], 0, page, limit);
    }

    const where: Prisma.ProductWhereInput = {
      ...(!options.includeInactive && { isActive: true }),
      ...(query.q && {
        OR: [
          { name: { contains: query.q } },
          { description: { contains: query.q } },
        ],
      }),
      ...(categoryResult.value && { categoryId: categoryResult.value }),
      ...(brandResult.value && { brandId: brandResult.value }),
      ...(activeMinPrice !== undefined || activeMaxPrice !== undefined
        ? {
            basePrice: {
              ...(activeMinPrice !== undefined && { gte: activeMinPrice }),
              ...(activeMaxPrice !== undefined && { lte: activeMaxPrice }),
            },
          }
        : {}),
      ...(inStock === true && {
        variants: {
          some: {
            stock: {
              gt: 0,
            },
          },
        },
      }),
      ...(inStock === false && {
        variants: {
          every: {
            stock: {
              lte: 0,
            },
          },
        },
      }),
    };

    const include = {
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true } },
      images: true,
      variants: true,
    };

    const orderBy = this.resolveOrderBy(sort);
    const useInMemoryProcessing = this.requiresInMemoryProcessing(query, sort);

    if (useInMemoryProcessing) {
      const products = await this.prisma.product.findMany({
        where,
        orderBy,
        include,
      });

      const filteredProducts = this.applyInMemorySort(
        this.applyInMemoryFilters(products, query),
        sort,
      );

      return this.buildListResponse(
        filteredProducts.slice(skip, skip + limit),
        filteredProducts.length,
        page,
        limit,
      );
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include,
      }),
      this.prisma.product.count({ where }),
    ]);

    return this.buildListResponse(items, total, page, limit);
  }

  async findOne(identifier: string, options: ProductFindAllOptions = {}) {
    const isId = /^\d+$/.test(identifier);

    const product = await this.prisma.product.findFirst({
      where: {
        ...(isId ? { id: Number(identifier) } : { slug: identifier }),
        ...(!options.includeInactive && { isActive: true }),
      },
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
    await this.findOne(String(id), { includeInactive: true }); // Ensure exists
    
    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.slug) updateData.slug = dto.slug;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.basePrice !== undefined) updateData.basePrice = Number(dto.basePrice);
    if (dto.status) updateData.isActive = dto.status === 'active';

    if (dto.categoryId) {
      const isId = /^\d+$/.test(String(dto.categoryId));
      if (isId) {
        updateData.categoryId = Number(dto.categoryId);
      } else {
        const cat = await this.prisma.category.findUnique({ where: { slug: dto.categoryId } });
        if (cat) updateData.categoryId = cat.id;
      }
    }

    if (dto.brandId) {
      const isId = /^\d+$/.test(String(dto.brandId));
      if (isId) {
        updateData.brandId = Number(dto.brandId);
      } else {
        const br = await this.prisma.brand.findUnique({ where: { slug: dto.brandId } });
        if (br) updateData.brandId = br.id;
      }
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
    await this.findOne(String(id), { includeInactive: true }); // Ensure exists
    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
    return {
      success: true,
      message: 'Đã ngừng kinh doanh sản phẩm',
    };
  }
}
