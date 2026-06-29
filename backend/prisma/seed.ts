import { PrismaClient, UserRole, DiscountType, ServiceRequestStatus, ServiceRequestPriority, TechnicianStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Admins & Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dienlanh247.vn' },
    update: {
      password: adminPassword,
      role: UserRole.ADMIN,
    },
    create: {
      email: 'admin@dienlanh247.vn',
      password: adminPassword,
      firstName: 'Trưởng Kênh',
      lastName: 'Kỹ Thuật',
      role: UserRole.ADMIN,
    },
  });
  console.log('Created Admin:', admin.email);

  // 2. Create Categories (Products)
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
  console.log('Seeded product categories.');

  // 3. Create Brands
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
  console.log('Seeded brands.');

  // 4. Create Products & Variants
  const products = [
    {
      name: 'Điều hòa Daikin Inverter 1 HP FTKF25XVMV',
      slug: 'dieu-hoa-daikin-inverter-1-hp-ftkf25xvmv',
      description: 'Điều hòa Daikin FTKF25XVMV sở hữu thiết kế hiện đại, công nghệ luồng gió Coanda độc quyền giúp bảo vệ sức khỏe, cùng công nghệ tiết kiệm điện Inverter tiên tiến mang lại cảm giác dễ chịu và hóa đơn tiền điện thấp hơn.',
      basePrice: 11990000,
      catSlug: 'dieu-hoa',
      brandSlug: 'daikin',
      variants: [{ sku: 'FTKF25XVMV', name: 'Trắng', price: 10490000, stock: 18 }],
      images: ['https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=600&auto=format&fit=crop']
    },
    {
      name: 'Điều hòa Panasonic Inverter 1 HP CU/CS-XU9ZKH-8',
      slug: 'dieu-hoa-panasonic-inverter-1-hp-cucs-xu9zkh-8',
      description: 'Dòng điều hòa cao cấp Panasonic XU9ZKH-8 tích hợp công nghệ Nanoe™ X thế hệ II lọc không khí sạch vượt trội suốt 24 giờ, kết hợp Inverter và Eco thông minh AI giúp tối đa hóa khả năng tiết kiệm điện năng.',
      basePrice: 16290000,
      catSlug: 'dieu-hoa',
      brandSlug: 'panasonic',
      variants: [{ sku: 'CU/CS-XU9ZKH-8', name: 'Trắng', price: 14790000, stock: 12 }],
      images: ['https://images.unsplash.com/photo-1621905252507-b354bc25edac?q=80&w=600&auto=format&fit=crop']
    },
    {
      name: 'Tủ lạnh LG Inverter 519 Lít Side By Side GR-B256BL',
      slug: 'tu-lanh-lg-inverter-519-lit-side-by-side-gr-b256bl',
      description: 'Tủ lạnh Side By Side LG GR-B256BL có thiết kế sang trọng bằng chất liệu thép không gỉ màu đen, dung tích lớn phù hợp cho gia đình từ 4-6 người. Tích hợp công nghệ Linear Inverter bền bỉ và làm lạnh đa chiều.',
      basePrice: 21990000,
      catSlug: 'tu-lanh',
      brandSlug: 'lg',
      variants: [{ sku: 'GR-B256BL', name: 'Đen', price: 17490000, stock: 10 }],
      images: ['https://images.unsplash.com/photo-1571175432290-ef713134d131?q=80&w=600&auto=format&fit=crop']
    },
    {
      name: 'Máy giặt LG AI DD Inverter 10 Kg FV1410S4W',
      slug: 'may-giat-lg-ai-dd-inverter-10-kg-fv1410s4w',
      description: 'Máy giặt cửa trước LG FV1410S4W sở hữu công nghệ cảm biến AI DD giúp bảo vệ sợi vải tốt hơn 18%. Chế độ giặt nhanh TurboWash™39 phút và công nghệ giặt hơi nước Steam diệt khuẩn tối ưu.',
      basePrice: 14990000,
      catSlug: 'may-giat',
      brandSlug: 'lg',
      variants: [{ sku: 'FV1410S4W', name: 'Trắng', price: 10990000, stock: 15 }],
      images: ['https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?q=80&w=600&auto=format&fit=crop']
    },
    {
      name: 'Bình nóng lạnh Ariston Vitaly 20 Slim 20 Lít',
      slug: 'binh-nong-lanh-ariston-vitaly-20-slim-20-lit',
      description: 'Bình nóng lạnh Ariston Vitaly 20 Slim sở hữu thiết kế thanh mảnh hiện đại, công nghệ bình chứa tráng men Titan siêu bền, hệ thống an toàn đồng bộ TSS bảo vệ an toàn tối đa cho người dùng.',
      basePrice: 3200000,
      catSlug: 'binh-nong-lanh',
      brandSlug: 'ariston',
      variants: [{ sku: 'VITALY20SLIM', name: 'Trắng', price: 2490000, stock: 25 }],
      images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop']
    },
    {
      name: 'Điều khiển điều hòa Daikin Inverter 2 chiều đa năng',
      slug: 'dieu-khien-dieu-hoa-daikin-inverter-2-chieu',
      description: 'Điều khiển điều hòa Daikin dùng cho các dòng máy lạnh Inverter 1 chiều và 2 chiều chính hãng hoặc tương đương, chất liệu nhựa ABS cao cấp, phím bấm nhạy nảy, màn hình hiển thị sắc nét.',
      basePrice: 250000,
      catSlug: 'dieu-hoa',
      brandSlug: 'daikin',
      variants: [{ sku: 'REMOTE-DK-INV', name: 'Đen', price: 180000, stock: 120 }],
      images: ['https://images.unsplash.com/photo-1595787143151-e601da948ea8?q=80&w=600&auto=format&fit=crop']
    }
  ];

  for (const p of products) {
    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { slug: p.slug },
    });

    if (!existing) {
      await prisma.product.create({
        data: {
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
            })),
          },
        },
      });
      console.log('Created Product:', p.name);
    }
  }

  // 5. Create Coupons
  const coupons = [
    {
      code: 'DIENLANH247',
      description: 'Giảm 10% cho đơn hàng, tối đa 1 triệu, tối thiểu 2 triệu',
      type: DiscountType.PERCENTAGE,
      value: 10,
      minOrderAmount: 2000000,
      maxDiscount: 1000000,
    },
    {
      code: 'GIAM50K',
      description: 'Giảm trực tiếp 50K cho đơn hàng từ 200K',
      type: DiscountType.FIXED_AMOUNT,
      value: 50000,
      minOrderAmount: 200000,
      maxDiscount: 50000,
    },
    {
      code: 'MIENPHIYENTAM',
      description: 'Giảm 100% giá trị, tối đa 200K cho đơn hàng từ 5 triệu',
      type: DiscountType.PERCENTAGE,
      value: 100,
      minOrderAmount: 5000000,
      maxDiscount: 200000,
    }
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: c,
      create: {
        ...c,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        isActive: true,
      },
    });
  }
  console.log('Seeded coupons.');

  // 6. Create Service Categories
  const serviceCats = [
    { id: 'sua-dieu-hoa', name: 'Sửa điều hòa', slug: 'sua-dieu-hoa', icon: 'Wind', description: 'Sửa chữa các loại điều hòa treo tường, âm trần, tủ đứng' },
    { id: 've-sinh-dieu-hoa', name: 'Vệ sinh điều hòa', slug: 've-sinh-dieu-hoa', icon: 'Droplets', description: 'Vệ sinh bảo dưỡng điều hòa định kỳ, xịt rửa chuyên sâu' },
    { id: 'lap-dat-dieu-hoa', name: 'Lắp đặt điều hòa', slug: 'lap-dat-dieu-hoa', icon: 'Drill', description: 'Lắp đặt điều hòa mới, di dời máy, thay đổi vị trí' },
    { id: 'sua-tu-lanh', name: 'Sửa tủ lạnh', slug: 'sua-tu-lanh', icon: 'Snowflake', description: 'Sửa chữa tủ lạnh, tủ đông các hãng' },
    { id: 'sua-may-giat', name: 'Sửa máy giặt', slug: 'sua-may-giat', icon: 'WashingMachine', description: 'Sửa chữa máy giặt cửa trước, cửa trên các hãng' },
    { id: 'bao-tri-dinh-ky', name: 'Bảo trì định kỳ', slug: 'bao-tri-dinh-ky', icon: 'Wrench', description: 'Gói bảo trì định kỳ cho các thiết bị điện lạnh' }
  ];

  for (const sc of serviceCats) {
    await prisma.serviceCategory.upsert({
      where: { id: sc.id },
      update: sc,
      create: sc,
    });
  }
  console.log('Seeded service categories.');

  // 7. Create Technicians
  const techs = [
    {
      id: 'TECH-001',
      name: 'Nguyễn Văn Hùng',
      phone: '0981112222',
      email: 'hung.nv@dienlanh247.vn',
      avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?q=80&w=200&auto=format&fit=crop',
      rating: 4.8,
      skills: ['sua-dieu-hoa', 've-sinh-dieu-hoa'],
      workingAreas: ['Quận Cầu Giấy', 'Quận Nam Từ Liêm'],
      status: TechnicianStatus.available,
      completedCount: 24,
    },
    {
      id: 'TECH-002',
      name: 'Trần Minh Hải',
      phone: '0982223333',
      email: 'hai.tm@dienlanh247.vn',
      avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200&auto=format&fit=crop',
      rating: 4.7,
      skills: ['sua-tu-lanh', 'sua-may-giat', 'sua-dieu-hoa'],
      workingAreas: ['Quận Đống Đa', 'Quận Thanh Xuân'],
      status: TechnicianStatus.available,
      completedCount: 18,
    },
    {
      id: 'TECH-003',
      name: 'Lê Hoàng Nam',
      phone: '0983334444',
      email: 'nam.lh@dienlanh247.vn',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
      rating: 4.9,
      skills: ['sua-dieu-hoa', 'lap-dat-dieu-hoa'],
      workingAreas: ['Quận Ba Đình', 'Quận Tây Hồ'],
      status: TechnicianStatus.busy,
      completedCount: 35,
    },
    {
      id: 'TECH-004',
      name: 'Phạm Quốc Huy',
      phone: '0984445555',
      email: 'huy.pq@dienlanh247.vn',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      rating: 4.5,
      skills: ['bao-tri-dinh-ky', 've-sinh-dieu-hoa'],
      workingAreas: ['Quận Hai Bà Trưng', 'Quận Hoàng Mai'],
      status: TechnicianStatus.available,
      completedCount: 12,
    }
  ];

  for (const t of techs) {
    await prisma.technician.upsert({
      where: { id: t.id },
      update: t,
      create: t,
    });
  }
  console.log('Seeded technicians.');

  // 8. Create System Setting
  await prisma.systemSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storeName: 'Điện Lạnh 247',
      hotline: '1900 1234',
      zalo: '0987654321',
      email: 'support@dienlanh247.vn',
      address: '123 Đường Cầu Giấy, Hà Nội',
      shippingFee: 30000,
      freeShippingThreshold: 10000000,
    },
  });
  console.log('Seeded system settings.');

  // 9. Create Service Requests (Optional/Sample)
  const serviceRequests = [
    {
      id: 'SR-240601',
      customerName: 'Nguyễn Văn Nam',
      customerPhone: '0987654321',
      customerAddress: 'Số 12 Ngõ 34 Trần Thái Tông',
      district: 'Quận Cầu Giấy',
      priority: ServiceRequestPriority.medium,
      serviceCategoryId: 've-sinh-dieu-hoa',
      applianceType: 'Điều hòa treo tường',
      issueDescription: 'Điều hòa chạy yếu, không mát, có mùi hôi khi bật máy. Cần vệ sinh tổng thể dàn lạnh và dàn nóng.',
      preferredDate: '2026-07-05',
      preferredTimeSlot: '08:00 - 10:00',
      note: 'Gọi trước khi đến 30 phút',
      status: ServiceRequestStatus.confirmed,
      estimatedPrice: 250000,
      finalPrice: 0,
      paymentStatus: 'unpaid',
      statusHistory: [
        { status: 'pending', note: 'Khách hàng vừa gửi yêu cầu dịch vụ', updatedBy: 'customer', createdAt: '2026-06-20T08:00:00.000Z' },
        { status: 'confirmed', note: 'Đã xác nhận lịch hẹn với khách hàng', updatedBy: 'admin', createdAt: '2026-06-20T09:30:00.000Z' }
      ],
    },
    {
      id: 'SR-240602',
      customerName: 'Trần Thị Hoa',
      customerPhone: '0912345678',
      customerAddress: '45 Láng Hạ',
      district: 'Quận Đống Đa',
      priority: ServiceRequestPriority.medium,
      serviceCategoryId: 'sua-dieu-hoa',
      applianceType: 'Điều hòa Inverter',
      issueDescription: 'Điều hòa bật không lên, đèn báo nhấp nháy liên tục. Đã thử reset nhưng không được.',
      preferredDate: '2026-07-06',
      preferredTimeSlot: '14:00 - 16:00',
      note: '',
      status: ServiceRequestStatus.pending,
      estimatedPrice: 0,
      finalPrice: 0,
      paymentStatus: 'unpaid',
      statusHistory: [
        { status: 'pending', note: 'Khách hàng vừa gửi yêu cầu dịch vụ', updatedBy: 'customer', createdAt: '2026-06-21T10:15:00.000Z' }
      ],
    }
  ];

  for (const sr of serviceRequests) {
    await prisma.serviceRequest.upsert({
      where: { id: sr.id },
      update: sr,
      create: sr,
    });
  }
  console.log('Seeded service requests.');

  console.log('All seeding tasks completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
