import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Phase 5 managed content...');

  await prisma.$executeRawUnsafe(`
    INSERT IGNORE INTO Category
      (name, slug, description, categoryType, isActive, sortOrder, createdAt, updatedAt)
    VALUES
      ('Kiến thức điều hòa', 'kien-thuc-dieu-hoa', 'Hướng dẫn sử dụng, bảo trì và tiết kiệm điện cho điều hòa.', 'POST', TRUE, 10, NOW(3), NOW(3)),
      ('Kinh nghiệm sửa chữa', 'kinh-nghiem-sua-chua', 'Nội dung chẩn đoán và phòng tránh lỗi thiết bị điện lạnh.', 'POST', TRUE, 20, NOW(3), NOW(3)),
      ('Tin dự án', 'tin-du-an', 'Câu chuyện triển khai và tiêu chuẩn kỹ thuật tại công trình.', 'POST', TRUE, 30, NOW(3), NOW(3))
  `);

  await prisma.$executeRawUnsafe(`
    INSERT IGNORE INTO Tag (name, slug, description, isActive, createdAt, updatedAt)
    VALUES
      ('Điều hòa', 'dieu-hoa', 'Nội dung liên quan điều hòa.', TRUE, NOW(3), NOW(3)),
      ('Tiết kiệm điện', 'tiet-kiem-dien', 'Giải pháp vận hành tiết kiệm năng lượng.', TRUE, NOW(3), NOW(3)),
      ('Bảo trì', 'bao-tri', 'Kiến thức bảo trì định kỳ.', TRUE, NOW(3), NOW(3))
  `);

  await prisma.$executeRawUnsafe(`
    INSERT IGNORE INTO Media
      (id, name, url, altText, mimeType, width, height, provider, publicId, folder, isActive, createdAt, updatedAt)
    VALUES
      (5001, 'Kỹ thuật viên kiểm tra điều hòa', 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=1200&q=80', 'Kỹ thuật viên kiểm tra hệ thống điều hòa', 'image/jpeg', 1200, 800, 'unsplash', 'phase5-service-aircon', 'phase5', TRUE, NOW(3), NOW(3)),
      (5002, 'Vệ sinh dàn lạnh', 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=80', 'Kỹ thuật viên vệ sinh thiết bị điện lạnh', 'image/jpeg', 1200, 800, 'unsplash', 'phase5-service-cleaning', 'phase5', TRUE, NOW(3), NOW(3)),
      (5003, 'Dự án văn phòng', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80', 'Hệ thống điều hòa tại văn phòng hiện đại', 'image/jpeg', 1400, 900, 'unsplash', 'phase5-project-office', 'phase5', TRUE, NOW(3), NOW(3)),
      (5004, 'Bài viết tiết kiệm điện', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=1200&q=80', 'Giải pháp tiết kiệm năng lượng', 'image/jpeg', 1200, 800, 'unsplash', 'phase5-post-energy', 'phase5', TRUE, NOW(3), NOW(3))
  `);

  await prisma.$executeRawUnsafe(`
    INSERT IGNORE INTO Service
      (title, slug, excerpt, content, pricing, process, warranty, faq, relatedServiceSlugs,
       status, isFeatured, sortOrder, publishedAt, seoTitle, seoDescription,
       serviceCategoryId, coverMediaId, createdAt, updatedAt)
    VALUES
      ('Sửa chữa điều hòa tại nhà', 'sua-chua-dieu-hoa-tai-nha', 'Chẩn đoán và khắc phục điều hòa không lạnh, rò nước, mất nguồn hoặc báo lỗi.', '<p>Kỹ thuật viên kiểm tra nguồn điện, gas, cảm biến, bo mạch và hệ thống thoát nước trước khi báo giá.</p><p>Khách hàng chỉ xác nhận sửa chữa sau khi đã hiểu nguyên nhân và chi phí dự kiến.</p>', JSON_ARRAY(JSON_OBJECT('label','Kiểm tra và vệ sinh cơ bản','price','Từ 250.000đ'), JSON_OBJECT('label','Xử lý rò nước','price','Từ 300.000đ'), JSON_OBJECT('label','Sửa bo mạch','price','Báo giá sau kiểm tra')), JSON_ARRAY('Tiếp nhận thông tin','Xác nhận lịch hẹn','Chẩn đoán và báo giá','Sửa chữa và chạy thử','Bàn giao bảo hành'), 'Bảo hành 3-12 tháng theo hạng mục và linh kiện thay thế.', JSON_ARRAY(JSON_OBJECT('question','Bao lâu kỹ thuật viên có mặt?','answer','Thông thường 30-60 phút tại khu vực nội thành, tùy thời điểm và khoảng cách.'), JSON_OBJECT('question','Có báo giá trước không?','answer','Có. Kỹ thuật viên chỉ thực hiện sau khi khách hàng xác nhận chi phí.')), JSON_ARRAY('ve-sinh-dieu-hoa-chuyen-sau'), 'PUBLISHED', TRUE, 10, NOW(3), 'Sửa điều hòa tại nhà - Điện Lạnh 247', 'Sửa điều hòa minh bạch, báo giá trước và bảo hành rõ ràng.', 'sua-dieu-hoa', 5001, NOW(3), NOW(3)),
      ('Vệ sinh điều hòa chuyên sâu', 've-sinh-dieu-hoa-chuyen-sau', 'Vệ sinh dàn nóng, dàn lạnh, máng nước và kiểm tra thông số vận hành.', '<p>Quy trình sử dụng bơm áp lực phù hợp, che chắn khu vực thi công và đo lại nhiệt độ sau vệ sinh.</p>', JSON_ARRAY(JSON_OBJECT('label','Máy treo tường','price','Từ 150.000đ'), JSON_OBJECT('label','Máy âm trần','price','Từ 450.000đ')), JSON_ARRAY('Khảo sát thiết bị','Che chắn khu vực','Vệ sinh chuyên sâu','Kiểm tra dòng và nhiệt độ','Bàn giao'), 'Bảo hành vệ sinh và thoát nước 30 ngày.', JSON_ARRAY(JSON_OBJECT('question','Bao lâu nên vệ sinh một lần?','answer','Gia đình nên vệ sinh 4-6 tháng/lần; môi trường kinh doanh nên kiểm tra 2-3 tháng/lần.')), JSON_ARRAY('sua-chua-dieu-hoa-tai-nha'), 'PUBLISHED', TRUE, 20, NOW(3), 'Vệ sinh điều hòa chuyên sâu', 'Vệ sinh điều hòa sạch sâu, kiểm tra vận hành và đường thoát nước.', 've-sinh-dieu-hoa', 5002, NOW(3), NOW(3))
  `);

  await prisma.$executeRawUnsafe(`
    INSERT IGNORE INTO Project
      (title, slug, excerpt, clientName, location, startedAt, completedAt, tasks, content, result,
       status, isFeatured, sortOrder, publishedAt, seoTitle, seoDescription, coverMediaId, createdAt, updatedAt)
    VALUES
      ('Bảo trì hệ thống điều hòa văn phòng 1.200m²', 'bao-tri-he-thong-dieu-hoa-van-phong-1200m2', 'Kiểm tra, vệ sinh và cân chỉnh hệ thống điều hòa cho văn phòng vận hành liên tục.', 'Khách hàng doanh nghiệp mẫu', 'Cầu Giấy, Hà Nội', DATE_SUB(NOW(3), INTERVAL 14 DAY), DATE_SUB(NOW(3), INTERVAL 10 DAY), JSON_ARRAY('Khảo sát tải lạnh','Vệ sinh 28 dàn lạnh','Kiểm tra tủ điện và đường gas','Đo nhiệt độ từng khu vực'), '<p>Đội dự án chia thành ba nhóm để thi công ngoài giờ, hạn chế ảnh hưởng hoạt động văn phòng.</p><p>Mỗi thiết bị được gắn mã kiểm tra và ghi nhận thông số trước/sau bảo trì.</p>', 'Nhiệt độ ổn định hơn, giảm tiếng ồn và phát hiện sớm hai vị trí rò nước cần xử lý.', 'PUBLISHED', TRUE, 10, NOW(3), 'Dự án bảo trì điều hòa văn phòng', 'Quy trình bảo trì hệ thống điều hòa văn phòng 1.200m².', 5003, NOW(3), NOW(3))
  `);

  await prisma.$executeRawUnsafe(`
    INSERT IGNORE INTO ProjectMedia (projectId, mediaId, sortOrder, caption)
    SELECT p.id, 5003, 10, 'Không gian văn phòng sau khi hoàn tất bảo trì'
    FROM Project p WHERE p.slug = 'bao-tri-he-thong-dieu-hoa-van-phong-1200m2'
  `);

  const admins = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
    "SELECT id FROM User WHERE role IN ('ADMIN','SUPERADMIN') ORDER BY id ASC LIMIT 1",
  );
  const categories = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
    "SELECT id FROM Category WHERE slug = 'kien-thuc-dieu-hoa' LIMIT 1",
  );

  if (admins[0] && categories[0]) {
    await prisma.$executeRawUnsafe(
      `INSERT IGNORE INTO Post
        (title, slug, excerpt, content, status, isFeatured, publishedAt, seoTitle, seoDescription,
         canonicalUrl, categoryId, authorId, coverMediaId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 'PUBLISHED', TRUE, NOW(3), ?, ?, NULL, ?, ?, 5004, NOW(3), NOW(3))`,
      '5 cách sử dụng điều hòa tiết kiệm điện nhưng vẫn thoải mái',
      '5-cach-su-dung-dieu-hoa-tiet-kiem-dien',
      'Các nguyên tắc cài nhiệt độ, vệ sinh và bố trí phòng giúp giảm điện năng tiêu thụ.',
      '<p>Nên đặt nhiệt độ chênh lệch vừa phải so với môi trường bên ngoài, đóng kín cửa và vệ sinh lưới lọc định kỳ.</p><h2>Ưu tiên vận hành ổn định</h2><p>Không bật tắt liên tục trong thời gian ngắn. Kết hợp quạt giúp luồng khí phân bố đều hơn.</p><h2>Kiểm tra định kỳ</h2><p>Dàn nóng bẩn, thiếu gas hoặc cảm biến sai có thể làm máy chạy lâu và tốn điện.</p>',
      '5 cách dùng điều hòa tiết kiệm điện',
      'Hướng dẫn sử dụng điều hòa tiết kiệm điện và duy trì sự thoải mái.',
      categories[0].id,
      admins[0].id,
    );

    await prisma.$executeRawUnsafe(`
      INSERT IGNORE INTO PostTag (postId, tagId)
      SELECT p.id, t.id FROM Post p
      JOIN Tag t ON t.slug IN ('dieu-hoa','tiet-kiem-dien')
      WHERE p.slug = '5-cach-su-dung-dieu-hoa-tiet-kiem-dien'
    `);
  }

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
