import { PrismaClient, UserRole, DiscountType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  // 1. Tạo Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ecommerce.com' },
    update: {},
    create: {
      email: 'admin@ecommerce.com',
      password: adminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPERADMIN,
    },
  });
  console.log('Created Admin:', admin.email);

  // 2. Tạo Categories
  const catElectronics = await prisma.category.upsert({
    where: { slug: 'dien-lanh' },
    update: {},
    create: { name: 'Điện lạnh', slug: 'dien-lanh', description: 'Các thiết bị điện lạnh gia đình' },
  });

  const catList = [
    { name: 'Điều hoà', slug: 'dieu-hoa' },
    { name: 'Tủ lạnh', slug: 'tu-lanh' },
    { name: 'Máy giặt', slug: 'may-giat' },
    { name: 'Bình nóng lạnh', slug: 'binh-nong-lanh' },
    { name: 'Máy lọc không khí', slug: 'may-loc-khong-khi' },
    { name: 'Tủ đông', slug: 'tu-dong' }
  ];

  const categoryMap = new Map();
  for (const cat of catList) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug, parentId: catElectronics.id },
    });
    categoryMap.set(cat.slug, created.id);
  }

  // 3. Tạo Brands
  const brandList = ['Daikin', 'Panasonic', 'Samsung', 'LG', 'Electrolux', 'Ariston', 'Sharp', 'Sanaky'];
  const brandMap = new Map();
  for (const brand of brandList) {
    const slug = brand.toLowerCase();
    const created = await prisma.brand.upsert({
      where: { slug },
      update: {},
      create: { name: brand, slug },
    });
    brandMap.set(slug, created.id);
  }

  // 4. Tạo Product & Variant mẫu
  const products = [
    {
      name: 'Điều hòa Daikin Inverter 1 HP FTKB25WMVMV',
      slug: 'dieu-hoa-daikin-inverter-1hp',
      description: 'Điều hòa Daikin Inverter tiết kiệm điện, làm lạnh nhanh. Trang bị phin lọc Enzyme Blue kết hợp PM2.5 khử mùi, diệt khuẩn 99.9%. Công nghệ luồng gió Coanda làm mát đồng đều.',
      basePrice: 9500000,
      catSlug: 'dieu-hoa',
      brandSlug: 'daikin',
      variants: [{ sku: 'DK-1HP-WHT', name: 'Trắng', price: 9500000, stock: 100 }],
      images: ['https://placehold.co/600x600/f8fafc/475569.png?text=Daikin+1HP', 'https://placehold.co/600x600/f8fafc/475569.png?text=Daikin+Inside']
    },
    {
      name: 'Điều hòa Panasonic Inverter 1.5 HP CU/CS-XU12XKH-8',
      slug: 'dieu-hoa-panasonic-inverter-1.5hp',
      description: 'Điều hòa Panasonic cao cấp với công nghệ nanoe™ X diệt khuẩn, lọc khí 24/7. Tích hợp Wi-Fi kết nối smartphone.',
      basePrice: 14200000,
      catSlug: 'dieu-hoa',
      brandSlug: 'panasonic',
      variants: [{ sku: 'PN-1.5HP-WHT', name: 'Trắng Ngọc Trai', price: 14200000, stock: 45 }],
      images: ['https://placehold.co/600x600/f8fafc/475569.png?text=Panasonic+1.5HP']
    },
    {
      name: 'Tủ lạnh Samsung Inverter 236 lít RT22M4032BY/SV',
      slug: 'tu-lanh-samsung-inverter-236l',
      description: 'Ngăn cấp đông mềm Optimal Fresh Zone -1 độ C giữ thịt cá tươi ngon không cần rã đông. Bộ lọc than hoạt tính Deodorizer khử mùi hiệu quả.',
      basePrice: 6500000,
      catSlug: 'tu-lanh',
      brandSlug: 'samsung',
      variants: [{ sku: 'SS-236L-BLK', name: 'Đen nhám', price: 6500000, stock: 60 }],
      images: ['https://placehold.co/600x600/f8fafc/475569.png?text=Samsung+Fridge']
    },
    {
      name: 'Máy giặt LG Inverter 9 kg FV1409S4W',
      slug: 'may-giat-lg-inverter-9kg',
      description: 'Máy giặt lồng ngang AI DD tối ưu chuyển động giặt, bảo vệ sợi vải. Công nghệ Steam giặt hơi nước diệt tác nhân dị ứng.',
      basePrice: 8900000,
      catSlug: 'may-giat',
      brandSlug: 'lg',
      variants: [{ sku: 'LG-9KG-WHT', name: 'Trắng', price: 8900000, stock: 35 }, { sku: 'LG-9KG-GRY', name: 'Xám', price: 9200000, stock: 20 }],
      images: ['https://placehold.co/600x600/f8fafc/475569.png?text=LG+Washer']
    },
    {
      name: 'Bình nóng lạnh gián tiếp Ariston 20 lít SL2 20 RS 2.5 FE',
      slug: 'binh-nong-lanh-ariston-20l',
      description: 'Thiết kế chữ nhật nhỏ gọn. Thanh đốt đồng siêu bền, bình chứa tráng men Titan. Cầu dao chống rò điện ELCB.',
      basePrice: 2800000,
      catSlug: 'binh-nong-lanh',
      brandSlug: 'ariston',
      variants: [{ sku: 'AR-20L-WHT', name: 'Trắng Đen', price: 2800000, stock: 150 }],
      images: ['https://placehold.co/600x600/f8fafc/475569.png?text=Ariston+Heater']
    },
    {
      name: 'Máy lọc không khí Sharp FP-J40E-W',
      slug: 'may-loc-khong-khi-sharp',
      description: 'Công nghệ Plasmacluster ion mật độ cao. Màng lọc HEPA tiêu chuẩn diệt bụi mịn PM2.5. Phù hợp phòng 30m2.',
      basePrice: 3200000,
      catSlug: 'may-loc-khong-khi',
      brandSlug: 'sharp',
      variants: [{ sku: 'SH-FPJ40', name: 'Trắng', price: 3200000, stock: 80 }],
      images: ['https://placehold.co/600x600/f8fafc/475569.png?text=Sharp+AirPurifier']
    },
    {
      name: 'Tủ đông Sanaky 280 lít VH-2899W1',
      slug: 'tu-dong-sanaky-280l',
      description: 'Thiết kế 2 ngăn (1 đông, 1 mát), 2 cánh mở kiểu vali. Dàn lạnh bằng đồng nguyên chất làm lạnh cực nhanh.',
      basePrice: 5400000,
      catSlug: 'tu-dong',
      brandSlug: 'sanaky',
      variants: [{ sku: 'SNK-280L', name: 'Trắng', price: 5400000, stock: 25 }],
      images: ['https://placehold.co/600x600/f8fafc/475569.png?text=Sanaky+Freezer']
    },
    {
      name: 'Tủ lạnh LG Inverter 315 lít GN-M312PS',
      slug: 'tu-lanh-lg-inverter-315l',
      description: 'Làm lạnh từ cửa tủ DoorCooling+ giúp thực phẩm tươi lâu. Ngăn đông mềm 0 độ C.',
      basePrice: 7900000,
      catSlug: 'tu-lanh',
      brandSlug: 'lg',
      variants: [{ sku: 'LG-315L-SLV', name: 'Bạc', price: 7900000, stock: 40 }],
      images: ['https://placehold.co/600x600/f8fafc/475569.png?text=LG+Fridge']
    },
    {
      name: 'Máy giặt lồng ngang Electrolux UltimateCare 500 10kg',
      slug: 'may-giat-electrolux-10kg',
      description: 'Công nghệ UltraMix hòa tan bột giặt hiệu quả. Chu trình giặt diệt khuẩn VapourCare.',
      basePrice: 11500000,
      catSlug: 'may-giat',
      brandSlug: 'electrolux',
      variants: [{ sku: 'ELX-10KG-WHT', name: 'Trắng', price: 11500000, stock: 30 }],
      images: ['https://placehold.co/600x600/f8fafc/475569.png?text=Electrolux+Washer']
    },
    {
      name: 'Điều hòa Samsung Wind-Free Inverter 1 HP AR09TYHQASINSV',
      slug: 'dieu-hoa-samsung-windfree-1hp',
      description: 'Làm lạnh không gió buốt Wind-Free™. Tiết kiệm điện năng tới 73% với Digital Inverter Boost.',
      basePrice: 8200000,
      catSlug: 'dieu-hoa',
      brandSlug: 'samsung',
      variants: [{ sku: 'SS-1HP-WHT', name: 'Trắng', price: 8200000, stock: 55 }],
      images: ['https://placehold.co/600x600/f8fafc/475569.png?text=Samsung+WindFree']
    }
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        basePrice: p.basePrice,
        categoryId: categoryMap.get(p.catSlug),
        brandId: brandMap.get(p.brandSlug),
        variants: {
          create: p.variants,
        },
        images: {
          create: p.images.map((url, i) => ({
            url,
            publicId: `seed-${p.slug}-${i}`,
            isPrimary: i === 0,
          }))
        }
      },
    });
    console.log('Created Product:', product.name);
  }

  // 5. Tạo Coupon mẫu
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      description: 'Giảm 10% cho đơn hàng đầu tiên',
      type: DiscountType.PERCENTAGE,
      value: 10,
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Hết hạn sau 1 năm
      isActive: true,
    },
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
