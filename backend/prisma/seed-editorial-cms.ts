import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function one<T>(sql: string, ...params: unknown[]) {
  const rows = await prisma.$queryRawUnsafe<T[]>(sql, ...params);
  return rows[0] ?? null;
}

async function ensureSiteSection(
  sectionKey: string,
  name: string,
  title: string,
  content: string,
  config: Record<string, unknown>,
  adminId: number,
) {
  const existing = await one<{ id: number }>('SELECT id FROM SiteSection WHERE sectionKey = ? LIMIT 1', sectionKey);
  if (existing) {
    await prisma.$executeRawUnsafe(
      `UPDATE SiteSection SET deletedAt = NULL, isActive = TRUE WHERE id = ?`,
      existing.id,
    );
    return existing.id;
  }
  await prisma.$executeRawUnsafe(
    `INSERT INTO SiteSection
      (sectionKey, name, eyebrow, title, content, config, status, isActive, sortOrder,
       publishedAt, updatedById, publishedById, version, createdAt, updatedAt)
     VALUES (?, ?, 'Điện Lạnh 247', ?, ?, CAST(? AS JSON), 'PUBLISHED', TRUE, 0,
             NOW(3), ?, ?, 1, NOW(3), NOW(3))`,
    sectionKey,
    name,
    title,
    content,
    JSON.stringify(config),
    adminId,
    adminId,
  );
  return Number((await one<{ id: bigint | number }>('SELECT LAST_INSERT_ID() AS id'))?.id ?? 0);
}

async function ensureBanner(adminId: number) {
  const existing = await one<{ id: number }>("SELECT id FROM Banner WHERE name = 'Chiến dịch bảo trì mùa nóng' LIMIT 1");
  if (existing) return existing.id;
  await prisma.$executeRawUnsafe(
    `INSERT INTO Banner
      (name, eyebrow, title, subtitle, ctaLabel, ctaUrl, secondaryCtaLabel, secondaryCtaUrl,
       placement, theme, status, isActive, sortOrder, publishedAt, updatedById, publishedById,
       version, createdAt, updatedAt)
     VALUES ('Chiến dịch bảo trì mùa nóng', 'Đặt lịch chủ động',
             'Bảo trì thiết bị trước cao điểm nắng nóng',
             'Kiểm tra, vệ sinh và tư vấn vận hành để thiết bị ổn định hơn trong mùa cao điểm.',
             'Đặt lịch bảo trì', '/service-booking', 'Xem dịch vụ', '/services',
             'HOME_MIDDLE', 'DARK', 'PUBLISHED', TRUE, 10, NOW(3), ?, ?, 1, NOW(3), NOW(3))`,
    adminId,
    adminId,
  );
  return Number((await one<{ id: bigint | number }>('SELECT LAST_INSERT_ID() AS id'))?.id ?? 0);
}

async function ensurePartners(adminId: number) {
  for (const [name, websiteUrl, sortOrder] of [
    ['Daikin', 'https://www.daikin.com.vn', 10],
    ['Panasonic', 'https://www.panasonic.com/vn', 20],
    ['LG', 'https://www.lg.com/vn', 30],
  ] as const) {
    const existing = await one<{ id: number }>('SELECT id FROM Partner WHERE name = ? LIMIT 1', name);
    if (!existing) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO Partner
          (name, description, websiteUrl, status, isFeatured, isActive, sortOrder,
           publishedAt, updatedById, publishedById, version, createdAt, updatedAt)
         VALUES (?, 'Thương hiệu thiết bị điện lạnh được nhiều khách hàng lựa chọn.', ?,
                 'PUBLISHED', TRUE, TRUE, ?, NOW(3), ?, ?, 1, NOW(3), NOW(3))`,
        name,
        websiteUrl,
        sortOrder,
        adminId,
        adminId,
      );
    }
  }
}

async function ensureTestimonial(adminId: number) {
  const existing = await one<{ id: number }>("SELECT id FROM Testimonial WHERE customerName = 'Nguyễn Minh Anh' LIMIT 1");
  if (existing) return existing.id;
  await prisma.$executeRawUnsafe(
    `INSERT INTO Testimonial
      (customerName, customerTitle, company, quote, rating, status, isFeatured,
       isActive, sortOrder, publishedAt, updatedById, publishedById, version, createdAt, updatedAt)
     VALUES ('Nguyễn Minh Anh', 'Quản lý vận hành', 'Doanh nghiệp dịch vụ',
             'Đội ngũ xác nhận lịch rõ ràng, báo giá trước và cập nhật tiến độ đầy đủ.',
             5, 'PUBLISHED', TRUE, TRUE, 10, NOW(3), ?, ?, 1, NOW(3), NOW(3))`,
    adminId,
    adminId,
  );
  return Number((await one<{ id: bigint | number }>('SELECT LAST_INSERT_ID() AS id'))?.id ?? 0);
}

async function ensureAuthor(adminId: number) {
  const existing = await one<{ id: number }>('SELECT id FROM AuthorProfile WHERE userId = ? LIMIT 1', adminId);
  if (existing) return existing.id;
  const admin = await one<{ firstName: string | null; lastName: string | null; email: string }>(
    'SELECT firstName, lastName, email FROM User WHERE id = ? LIMIT 1',
    adminId,
  );
  const displayName = `${admin?.firstName || ''} ${admin?.lastName || ''}`.trim() || admin?.email || 'Ban biên tập Điện Lạnh 247';
  await prisma.$executeRawUnsafe(
    `INSERT INTO AuthorProfile
      (userId, displayName, title, bio, socialLinks, isActive, updatedById, version, createdAt, updatedAt)
     VALUES (?, ?, 'Ban biên tập',
             'Phụ trách kiểm duyệt nội dung kỹ thuật và thông tin dịch vụ trên hệ thống.',
             CAST('{}' AS JSON), TRUE, ?, 1, NOW(3), NOW(3))`,
    adminId,
    displayName,
    adminId,
  );
  return Number((await one<{ id: bigint | number }>('SELECT LAST_INSERT_ID() AS id'))?.id ?? 0);
}

async function ensureRevision(entityType: string, entityId: number, actorId: number) {
  const exists = await one<{ id: bigint }>(
    `SELECT id FROM ContentRevision WHERE entityType = ? AND entityId = ? AND action = 'SEED' LIMIT 1`,
    entityType,
    String(entityId),
  );
  if (exists) return;
  await prisma.$executeRawUnsafe(
    `INSERT INTO ContentRevision
      (entityType, entityId, action, version, summary, snapshot, actorId, actorName, actorEmail, createdAt)
     SELECT ?, ?, 'SEED', 1, 'Dữ liệu khởi tạo Giai đoạn 9', CAST('{}' AS JSON),
            u.id, CONCAT(COALESCE(u.firstName,''), ' ', COALESCE(u.lastName,'')), u.email, NOW(3)
     FROM User u WHERE u.id = ?`,
    entityType,
    String(entityId),
    actorId,
  );
}

async function main() {
  const seedEmail = process.env.ADMIN_SEED_EMAIL || 'admin@dienlanh247.vn';
  const admin = await one<{ id: number }>('SELECT id FROM User WHERE email = ? LIMIT 1', seedEmail);
  if (!admin) throw new Error(`Phase 9 seed requires admin user: ${seedEmail}`);

  const bannerId = await ensureBanner(admin.id);
  const testimonialId = await ensureTestimonial(admin.id);
  await ensurePartners(admin.id);
  await ensureAuthor(admin.id);

  const homeId = await ensureSiteSection(
    'HOME_EDITORIAL',
    'Giới thiệu quy trình nội dung',
    'Nội dung được kiểm duyệt trước khi hiển thị',
    '<p>Mọi thông tin dịch vụ, dự án và bài viết đều đi qua quy trình bản nháp, preview và xuất bản có lịch sử người cập nhật.</p>',
    { tone: 'light', maxWidth: '4xl' },
    admin.id,
  );
  const contactId = await ensureSiteSection(
    'CONTACT',
    'Thông tin liên hệ dùng chung',
    'Liên hệ Điện Lạnh 247',
    '<p>Tiếp nhận yêu cầu dịch vụ và tư vấn kỹ thuật mỗi ngày.</p>',
    { hotline: '1900 1234', zalo: '19001234', email: 'support@dienlanh247.vn', address: 'Cầu Giấy, Hà Nội' },
    admin.id,
  );
  const footerId = await ensureSiteSection(
    'FOOTER',
    'Footer website',
    'Điện Lạnh 247',
    '<p>Nền tảng dịch vụ điện lạnh có quy trình điều phối, báo giá và theo dõi bảo hành rõ ràng.</p>',
    {
      copyright: `© ${new Date().getFullYear()} Điện Lạnh 247. Mọi quyền được bảo lưu.`,
      serviceLinks: [{ label: 'Tất cả dịch vụ', to: '/services' }, { label: 'Đặt lịch kỹ thuật', to: '/service-booking' }],
      companyLinks: [{ label: 'Giới thiệu', to: '/about' }, { label: 'Dự án', to: '/projects' }, { label: 'Bài viết', to: '/articles' }],
      policyLinks: [{ label: 'Bảo hành', to: '/policy/warranty' }, { label: 'Bảo mật', to: '/policy/privacy' }, { label: 'Điều khoản', to: '/policy/terms' }],
    },
    admin.id,
  );

  await Promise.all([
    ensureRevision('banners', bannerId, admin.id),
    ensureRevision('testimonials', testimonialId, admin.id),
    ensureRevision('site-sections', homeId, admin.id),
    ensureRevision('site-sections', contactId, admin.id),
    ensureRevision('site-sections', footerId, admin.id),
  ]);

  console.log('Phase 9 editorial CMS seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
