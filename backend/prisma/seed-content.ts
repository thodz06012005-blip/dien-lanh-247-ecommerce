import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface IdRow {
  id: number | string;
}

async function execute(sql: string, ...params: unknown[]) {
  return prisma.$executeRawUnsafe(sql, ...params);
}

async function findId(sql: string, ...params: unknown[]) {
  const rows = await prisma.$queryRawUnsafe<IdRow[]>(sql, ...params);
  return rows[0]?.id;
}

async function seedPostCategories() {
  const rows = [
    ['Kiến thức điều hòa', 'kien-thuc-dieu-hoa', 'Hướng dẫn sử dụng, bảo trì và tiết kiệm điện cho điều hòa.', 10],
    ['Kinh nghiệm sửa chữa', 'kinh-nghiem-sua-chua', 'Nội dung chẩn đoán và phòng tránh lỗi thiết bị điện lạnh.', 20],
    ['Tin dự án', 'tin-du-an', 'Câu chuyện triển khai và tiêu chuẩn kỹ thuật tại công trình.', 30],
  ];

  for (const [name, slug, description, sortOrder] of rows) {
    await execute(
      `INSERT INTO Category
        (name, slug, description, categoryType, isActive, sortOrder, createdAt, updatedAt)
       VALUES (?, ?, ?, 'POST', TRUE, ?, NOW(3), NOW(3))
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), description = VALUES(description), categoryType = 'POST',
         isActive = TRUE, sortOrder = VALUES(sortOrder), updatedAt = NOW(3)`,
      name,
      slug,
      description,
      sortOrder,
    );
  }
}

async function seedTags() {
  const rows = [
    ['Điều hòa', 'dieu-hoa', 'Nội dung liên quan điều hòa.'],
    ['Tiết kiệm điện', 'tiet-kiem-dien', 'Giải pháp vận hành tiết kiệm năng lượng.'],
    ['Bảo trì', 'bao-tri', 'Kiến thức bảo trì định kỳ.'],
  ];

  for (const [name, slug, description] of rows) {
    await execute(
      `INSERT INTO Tag (name, slug, description, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, TRUE, NOW(3), NOW(3))
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), description = VALUES(description), isActive = TRUE, updatedAt = NOW(3)`,
      name,
      slug,
      description,
    );
  }
}

async function seedMedia() {
  const rows = [
    [5001, 'Kỹ thuật viên kiểm tra điều hòa', 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=1200&q=80', 'Kỹ thuật viên kiểm tra hệ thống điều hòa', 1200, 800, 'phase5-service-aircon'],
    [5002, 'Vệ sinh dàn lạnh', 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=80', 'Kỹ thuật viên vệ sinh thiết bị điện lạnh', 1200, 800, 'phase5-service-cleaning'],
    [5003, 'Dự án văn phòng', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80', 'Hệ thống điều hòa tại văn phòng hiện đại', 1400, 900, 'phase5-project-office'],
    [5004, 'Bài viết tiết kiệm điện', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=1200&q=80', 'Giải pháp tiết kiệm năng lượng', 1200, 800, 'phase5-post-energy'],
  ];

  for (const [id, name, url, altText, width, height, publicId] of rows) {
    await execute(
      `INSERT INTO Media
        (id, name, url, altText, mimeType, width, height, provider, publicId, folder, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 'image/jpeg', ?, ?, 'unsplash', ?, 'phase5', TRUE, NOW(3), NOW(3))
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), url = VALUES(url), altText = VALUES(altText),
         width = VALUES(width), height = VALUES(height), provider = VALUES(provider),
         publicId = VALUES(publicId), folder = VALUES(folder), isActive = TRUE, updatedAt = NOW(3)`,
      id,
      name,
      url,
      altText,
      width,
      height,
      publicId,
    );
  }
}

async function seedServices() {
  const repairCategoryId = await findId('SELECT id FROM ServiceCategory WHERE slug = ? LIMIT 1', 'sua-dieu-hoa');
  const cleaningCategoryId = await findId('SELECT id FROM ServiceCategory WHERE slug = ? LIMIT 1', 've-sinh-dieu-hoa');

  if (!repairCategoryId || !cleaningCategoryId) {
    throw new Error('Core seed must create sua-dieu-hoa and ve-sinh-dieu-hoa service categories before content seed.');
  }

  const services = [
    {
      title: 'Sửa chữa điều hòa tại nhà',
      slug: 'sua-chua-dieu-hoa-tai-nha',
      excerpt: 'Chẩn đoán và khắc phục điều hòa không lạnh, rò nước, mất nguồn hoặc báo lỗi.',
      content: '<p>Kỹ thuật viên kiểm tra nguồn điện, gas, cảm biến, bo mạch và hệ thống thoát nước trước khi báo giá.</p><p>Khách hàng chỉ xác nhận sửa chữa sau khi đã hiểu nguyên nhân và chi phí dự kiến.</p>',
      pricing: [
        { label: 'Kiểm tra và vệ sinh cơ bản', price: 'Từ 250.000đ' },
        { label: 'Xử lý rò nước', price: 'Từ 300.000đ' },
        { label: 'Sửa bo mạch', price: 'Báo giá sau kiểm tra' },
      ],
      process: ['Tiếp nhận thông tin', 'Xác nhận lịch hẹn', 'Chẩn đoán và báo giá', 'Sửa chữa và chạy thử', 'Bàn giao bảo hành'],
      warranty: 'Bảo hành 3-12 tháng theo hạng mục và linh kiện thay thế.',
      faq: [
        { question: 'Bao lâu kỹ thuật viên có mặt?', answer: 'Thông thường 30-60 phút tại khu vực nội thành, tùy thời điểm và khoảng cách.' },
        { question: 'Có báo giá trước không?', answer: 'Có. Kỹ thuật viên chỉ thực hiện sau khi khách hàng xác nhận chi phí.' },
      ],
      related: ['ve-sinh-dieu-hoa-chuyen-sau'],
      categoryId: repairCategoryId,
      mediaId: 5001,
      sortOrder: 10,
      seoTitle: 'Sửa điều hòa tại nhà - Điện Lạnh 247',
      seoDescription: 'Sửa điều hòa minh bạch, báo giá trước và bảo hành rõ ràng.',
    },
    {
      title: 'Vệ sinh điều hòa chuyên sâu',
      slug: 've-sinh-dieu-hoa-chuyen-sau',
      excerpt: 'Vệ sinh dàn nóng, dàn lạnh, máng nước và kiểm tra thông số vận hành.',
      content: '<p>Quy trình sử dụng bơm áp lực phù hợp, che chắn khu vực thi công và đo lại nhiệt độ sau vệ sinh.</p>',
      pricing: [
        { label: 'Máy treo tường', price: 'Từ 150.000đ' },
        { label: 'Máy âm trần', price: 'Từ 450.000đ' },
      ],
      process: ['Khảo sát thiết bị', 'Che chắn khu vực', 'Vệ sinh chuyên sâu', 'Kiểm tra dòng và nhiệt độ', 'Bàn giao'],
      warranty: 'Bảo hành vệ sinh và thoát nước 30 ngày.',
      faq: [{ question: 'Bao lâu nên vệ sinh một lần?', answer: 'Gia đình nên vệ sinh 4-6 tháng/lần; môi trường kinh doanh nên kiểm tra 2-3 tháng/lần.' }],
      related: ['sua-chua-dieu-hoa-tai-nha'],
      categoryId: cleaningCategoryId,
      mediaId: 5002,
      sortOrder: 20,
      seoTitle: 'Vệ sinh điều hòa chuyên sâu',
      seoDescription: 'Vệ sinh điều hòa sạch sâu, kiểm tra vận hành và đường thoát nước.',
    },
  ];

  for (const service of services) {
    await execute(
      `INSERT INTO Service
        (title, slug, excerpt, content, pricing, process, warranty, faq, relatedServiceSlugs,
         status, isFeatured, sortOrder, publishedAt, seoTitle, seoDescription,
         serviceCategoryId, coverMediaId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', TRUE, ?, NOW(3), ?, ?, ?, ?, NOW(3), NOW(3))
       ON DUPLICATE KEY UPDATE
         title = VALUES(title), excerpt = VALUES(excerpt), content = VALUES(content),
         pricing = VALUES(pricing), process = VALUES(process), warranty = VALUES(warranty),
         faq = VALUES(faq), relatedServiceSlugs = VALUES(relatedServiceSlugs),
         status = 'PUBLISHED', isFeatured = TRUE, sortOrder = VALUES(sortOrder),
         seoTitle = VALUES(seoTitle), seoDescription = VALUES(seoDescription),
         serviceCategoryId = VALUES(serviceCategoryId), coverMediaId = VALUES(coverMediaId),
         updatedAt = NOW(3)`,
      service.title,
      service.slug,
      service.excerpt,
      service.content,
      JSON.stringify(service.pricing),
      JSON.stringify(service.process),
      service.warranty,
      JSON.stringify(service.faq),
      JSON.stringify(service.related),
      service.sortOrder,
      service.seoTitle,
      service.seoDescription,
      service.categoryId,
      service.mediaId,
    );
  }
}

async function seedProject() {
  const slug = 'bao-tri-he-thong-dieu-hoa-van-phong-1200m2';
  await execute(
    `INSERT INTO Project
      (title, slug, excerpt, clientName, location, startedAt, completedAt, tasks, content, result,
       status, isFeatured, sortOrder, publishedAt, seoTitle, seoDescription, coverMediaId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, DATE_SUB(NOW(3), INTERVAL 14 DAY), DATE_SUB(NOW(3), INTERVAL 10 DAY), ?, ?, ?,
       'PUBLISHED', TRUE, 10, NOW(3), ?, ?, 5003, NOW(3), NOW(3))
     ON DUPLICATE KEY UPDATE
       title = VALUES(title), excerpt = VALUES(excerpt), clientName = VALUES(clientName),
       location = VALUES(location), tasks = VALUES(tasks), content = VALUES(content), result = VALUES(result),
       status = 'PUBLISHED', isFeatured = TRUE, coverMediaId = 5003, updatedAt = NOW(3)`,
    'Bảo trì hệ thống điều hòa văn phòng 1.200m²',
    slug,
    'Kiểm tra, vệ sinh và cân chỉnh hệ thống điều hòa cho văn phòng vận hành liên tục.',
    'Khách hàng doanh nghiệp mẫu',
    'Cầu Giấy, Hà Nội',
    JSON.stringify(['Khảo sát tải lạnh', 'Vệ sinh 28 dàn lạnh', 'Kiểm tra tủ điện và đường gas', 'Đo nhiệt độ từng khu vực']),
    '<p>Đội dự án chia thành ba nhóm để thi công ngoài giờ, hạn chế ảnh hưởng hoạt động văn phòng.</p><p>Mỗi thiết bị được gắn mã kiểm tra và ghi nhận thông số trước/sau bảo trì.</p>',
    'Nhiệt độ ổn định hơn, giảm tiếng ồn và phát hiện sớm hai vị trí rò nước cần xử lý.',
    'Dự án bảo trì điều hòa văn phòng',
    'Quy trình bảo trì hệ thống điều hòa văn phòng 1.200m².',
  );

  const projectId = await findId('SELECT id FROM Project WHERE slug = ? LIMIT 1', slug);
  if (!projectId) throw new Error('Unable to resolve seeded project.');

  await execute(
    `INSERT INTO ProjectMedia (projectId, mediaId, sortOrder, caption)
     VALUES (?, 5003, 10, ?)
     ON DUPLICATE KEY UPDATE sortOrder = 10, caption = VALUES(caption)`,
    projectId,
    'Không gian văn phòng sau khi hoàn tất bảo trì',
  );
}

async function seedPost() {
  const authorId = await findId("SELECT id FROM User WHERE role IN ('ADMIN','SUPERADMIN') ORDER BY id ASC LIMIT 1");
  const categoryId = await findId("SELECT id FROM Category WHERE slug = 'kien-thuc-dieu-hoa' LIMIT 1");
  if (!authorId || !categoryId) throw new Error('Admin user and post category are required before seeding posts.');

  const slug = '5-cach-su-dung-dieu-hoa-tiet-kiem-dien';
  await execute(
    `INSERT INTO Post
      (title, slug, excerpt, content, status, isFeatured, publishedAt, seoTitle, seoDescription,
       canonicalUrl, categoryId, authorId, coverMediaId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, 'PUBLISHED', TRUE, NOW(3), ?, ?, NULL, ?, ?, 5004, NOW(3), NOW(3))
     ON DUPLICATE KEY UPDATE
       title = VALUES(title), excerpt = VALUES(excerpt), content = VALUES(content),
       status = 'PUBLISHED', isFeatured = TRUE, seoTitle = VALUES(seoTitle),
       seoDescription = VALUES(seoDescription), categoryId = VALUES(categoryId),
       authorId = VALUES(authorId), coverMediaId = 5004, updatedAt = NOW(3)`,
    '5 cách sử dụng điều hòa tiết kiệm điện nhưng vẫn thoải mái',
    slug,
    'Các nguyên tắc cài nhiệt độ, vệ sinh và bố trí phòng giúp giảm điện năng tiêu thụ.',
    '<p>Nên đặt nhiệt độ chênh lệch vừa phải so với môi trường bên ngoài, đóng kín cửa và vệ sinh lưới lọc định kỳ.</p><h2>Ưu tiên vận hành ổn định</h2><p>Không bật tắt liên tục trong thời gian ngắn. Kết hợp quạt giúp luồng khí phân bố đều hơn.</p><h2>Kiểm tra định kỳ</h2><p>Dàn nóng bẩn, thiếu gas hoặc cảm biến sai có thể làm máy chạy lâu và tốn điện.</p>',
    '5 cách dùng điều hòa tiết kiệm điện',
    'Hướng dẫn sử dụng điều hòa tiết kiệm điện và duy trì sự thoải mái.',
    categoryId,
    authorId,
  );

  const postId = await findId('SELECT id FROM Post WHERE slug = ? LIMIT 1', slug);
  if (!postId) throw new Error('Unable to resolve seeded post.');

  const tagRows = await prisma.$queryRawUnsafe<IdRow[]>(
    "SELECT id FROM Tag WHERE slug IN ('dieu-hoa','tiet-kiem-dien') ORDER BY id ASC",
  );
  for (const tag of tagRows) {
    await execute(
      `INSERT INTO PostTag (postId, tagId) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE postId = VALUES(postId)`,
      postId,
      tag.id,
    );
  }
}

async function main() {
  console.log('Seeding Phase 5 managed content...');
  await seedPostCategories();
  await seedTags();
  await seedMedia();
  await seedServices();
  await seedProject();
  await seedPost();
  console.log('Phase 5 managed content seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
