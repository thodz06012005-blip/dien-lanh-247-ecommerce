export type ServiceIconName = 'wind' | 'snowflake' | 'washer' | 'refrigerator' | 'building' | 'tools';

export interface StaticService {
  slug: string;
  title: string;
  description: string;
  features: string[];
  responseTime: string;
  warranty: string;
  priceLabel: string;
  icon: ServiceIconName;
  image: string;
}

export interface StaticProject {
  slug: string;
  title: string;
  category: 'Nhà ở' | 'Văn phòng' | 'Nhà hàng' | 'Bán lẻ';
  location: string;
  completedAt: string;
  summary: string;
  challenge: string;
  solution: string;
  result: string;
  image: string;
  gallery: string[];
  metrics: Array<{ label: string; value: string }>;
}

export interface StaticArticle {
  slug: string;
  title: string;
  category: 'Kinh nghiệm' | 'Bảo dưỡng' | 'Tiết kiệm điện' | 'Tin doanh nghiệp';
  excerpt: string;
  publishedAt: string;
  readTime: string;
  image: string;
  content: Array<{ heading: string; paragraphs: string[] }>;
}

export const services: StaticService[] = [
  {
    slug: 'sua-dieu-hoa-tai-nha',
    title: 'Sửa điều hòa tại nhà',
    description: 'Chẩn đoán và xử lý điều hòa không lạnh, chảy nước, mất nguồn, báo lỗi hoặc hoạt động kém ổn định.',
    features: ['Kiểm tra tại chỗ', 'Báo giá trước khi sửa', 'Linh kiện có nguồn gốc'],
    responseTime: 'Có mặt dự kiến 30–60 phút',
    warranty: 'Bảo hành 3–12 tháng',
    priceLabel: 'Từ 250.000đ',
    icon: 'wind',
    image: 'https://images.unsplash.com/photo-1621905252472-e4b5d9fbe0c5',
  },
  {
    slug: 've-sinh-dieu-hoa',
    title: 'Vệ sinh điều hòa chuyên sâu',
    description: 'Làm sạch dàn lạnh, dàn nóng, máng nước và đường thoát để cải thiện chất lượng không khí và hiệu suất làm mát.',
    features: ['Che chắn khu vực thi công', 'Xịt rửa áp lực phù hợp', 'Kiểm tra gas và dòng điện'],
    responseTime: 'Đặt lịch theo khung giờ',
    warranty: 'Bảo hành vệ sinh 30 ngày',
    priceLabel: 'Từ 150.000đ',
    icon: 'snowflake',
    image: 'https://images.unsplash.com/photo-1631545806609-17d7cf3ea5fa',
  },
  {
    slug: 'sua-may-giat',
    title: 'Sửa máy giặt',
    description: 'Xử lý máy không cấp nước, không vắt, rung mạnh, kêu lớn, lỗi bo mạch hoặc lỗi khóa cửa.',
    features: ['Kiểm tra cơ khí và điện', 'Tư vấn phương án tối ưu', 'Vệ sinh sau thi công'],
    responseTime: 'Trong ngày',
    warranty: 'Bảo hành 3–6 tháng',
    priceLabel: 'Từ 300.000đ',
    icon: 'washer',
    image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1',
  },
  {
    slug: 'sua-tu-lanh',
    title: 'Sửa tủ lạnh và tủ đông',
    description: 'Khắc phục tủ không lạnh, đóng tuyết bất thường, kêu to, xì gas, hỏng quạt hoặc hỏng hệ thống điều khiển.',
    features: ['Đo kiểm hệ thống lạnh', 'Kiểm tra rò rỉ', 'Tư vấn bảo quản thực phẩm'],
    responseTime: 'Trong ngày',
    warranty: 'Bảo hành 3–12 tháng',
    priceLabel: 'Từ 350.000đ',
    icon: 'refrigerator',
    image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5',
  },
  {
    slug: 'bao-tri-doanh-nghiep',
    title: 'Bảo trì điện lạnh doanh nghiệp',
    description: 'Bảo trì định kỳ cho văn phòng, chuỗi cửa hàng, nhà hàng và hệ thống điều hòa cục bộ hoặc trung tâm.',
    features: ['Lịch bảo trì định kỳ', 'Biên bản nghiệm thu', 'Báo cáo tình trạng thiết bị'],
    responseTime: 'Khảo sát trong 24 giờ',
    warranty: 'Theo hợp đồng dịch vụ',
    priceLabel: 'Báo giá theo hệ thống',
    icon: 'building',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72',
  },
  {
    slug: 'lap-dat-di-doi-thiet-bi',
    title: 'Lắp đặt và di dời thiết bị',
    description: 'Khảo sát vị trí, tháo lắp, đi ống đồng, dây điện và bàn giao vận hành đúng tiêu chuẩn kỹ thuật.',
    features: ['Khảo sát vị trí', 'Vật tư công khai', 'Kiểm tra vận hành'],
    responseTime: 'Theo lịch hẹn',
    warranty: 'Bảo hành lắp đặt 12 tháng',
    priceLabel: 'Báo giá sau khảo sát',
    icon: 'tools',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758',
  },
];

export const projects: StaticProject[] = [
  {
    slug: 'can-ho-riverside-cau-giay',
    title: 'Nâng cấp hệ thống điều hòa căn hộ Riverside',
    category: 'Nhà ở',
    location: 'Cầu Giấy, Hà Nội',
    completedAt: 'Tháng 05/2026',
    summary: 'Thay thế hệ thống cũ bằng giải pháp inverter đồng bộ, giảm tiếng ồn và tối ưu không gian ban công.',
    challenge: 'Căn hộ đã hoàn thiện nội thất, đường ống cũ xuống cấp và khu vực đặt dàn nóng hạn chế thông gió.',
    solution: 'Khảo sát tải lạnh từng phòng, thay ống đồng bảo ôn, bố trí lại dàn nóng và kiểm tra kín khí trước khi bàn giao.',
    result: 'Hệ thống vận hành ổn định, giảm tiếng ồn rõ rệt và thời gian làm lạnh nhanh hơn.',
    image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d',
    gallery: [
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3',
      'https://images.unsplash.com/photo-1600607688969-a5bfcd646154',
    ],
    metrics: [
      { label: 'Thiết bị', value: '04 máy inverter' },
      { label: 'Thời gian', value: '02 ngày' },
      { label: 'Bảo hành', value: '12 tháng lắp đặt' },
    ],
  },
  {
    slug: 'van-phong-sunrise-tower',
    title: 'Bảo trì hệ thống văn phòng Sunrise Tower',
    category: 'Văn phòng',
    location: 'Nam Từ Liêm, Hà Nội',
    completedAt: 'Tháng 04/2026',
    summary: 'Bảo trì 36 thiết bị, chuẩn hóa lịch vận hành và lập hồ sơ theo dõi cho bộ phận quản lý tòa nhà.',
    challenge: 'Thiết bị hoạt động liên tục, lịch sử bảo trì không đồng nhất và nhiều khu vực có nhiệt độ chênh lệch.',
    solution: 'Phân vùng kiểm tra, đo dòng vận hành, làm sạch trao đổi nhiệt và lập checklist định kỳ theo từng mã máy.',
    result: 'Giảm sự cố đột xuất, nhiệt độ giữa các khu vực ổn định hơn và có dữ liệu theo dõi rõ ràng.',
    image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2',
    gallery: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c',
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72',
      'https://images.unsplash.com/photo-1497366412874-3415097a27e7',
    ],
    metrics: [
      { label: 'Thiết bị', value: '36 máy' },
      { label: 'Khu vực', value: '08 phân khu' },
      { label: 'Chu kỳ', value: '03 tháng/lần' },
    ],
  },
  {
    slug: 'chuoi-nha-hang-pepper-house',
    title: 'Giải pháp làm mát chuỗi Pepper House',
    category: 'Nhà hàng',
    location: 'Đống Đa, Hà Nội',
    completedAt: 'Tháng 03/2026',
    summary: 'Tối ưu luồng gió và bảo trì thiết bị trong khung giờ đóng cửa để không ảnh hưởng vận hành nhà hàng.',
    challenge: 'Nhiệt lượng bếp lớn, mật độ khách thay đổi nhanh và thời gian thi công rất hạn chế.',
    solution: 'Cân chỉnh hướng gió, vệ sinh chuyên sâu, kiểm tra thoát nước và xây dựng kế hoạch bảo trì ngoài giờ.',
    result: 'Không gian khách ổn định nhiệt độ tốt hơn và nhà hàng không phải tạm dừng hoạt động.',
    image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f',
    gallery: [
      'https://images.unsplash.com/photo-1552566626-52f8b828add9',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
    ],
    metrics: [
      { label: 'Chi nhánh', value: '03 địa điểm' },
      { label: 'Thiết bị', value: '18 máy' },
      { label: 'Thi công', value: 'Ngoài giờ' },
    ],
  },
  {
    slug: 'showroom-north-star',
    title: 'Lắp đặt điều hòa showroom North Star',
    category: 'Bán lẻ',
    location: 'Hai Bà Trưng, Hà Nội',
    completedAt: 'Tháng 02/2026',
    summary: 'Thiết kế hệ thống làm mát thẩm mỹ, hạn chế lộ đường ống và phù hợp lưu lượng khách theo giờ.',
    challenge: 'Không gian trưng bày yêu cầu thẩm mỹ cao, trần kỹ thuật thấp và mặt kính nhận nhiều bức xạ nhiệt.',
    solution: 'Tính tải lạnh, bố trí luồng gió tránh thổi trực tiếp vào khách và thi công đường ống theo trục nội thất.',
    result: 'Showroom đạt nhiệt độ mục tiêu, giữ được thiết kế nội thất và vận hành êm trong giờ đông khách.',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
    gallery: [
      'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04',
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a',
      'https://images.unsplash.com/photo-1604719312566-8912e9227c6a',
    ],
    metrics: [
      { label: 'Diện tích', value: '420 m²' },
      { label: 'Thiết bị', value: '08 máy' },
      { label: 'Bàn giao', value: 'Đúng tiến độ' },
    ],
  },
];

export const articles: StaticArticle[] = [
  {
    slug: '5-dau-hieu-dieu-hoa-can-bao-duong',
    title: '5 dấu hiệu điều hòa cần được bảo dưỡng sớm',
    category: 'Bảo dưỡng',
    excerpt: 'Nhận biết sớm các dấu hiệu giảm hiệu suất giúp hạn chế hỏng nặng và tránh chi phí sửa chữa lớn.',
    publishedAt: '10/07/2026',
    readTime: '6 phút đọc',
    image: 'https://images.unsplash.com/photo-1631545806609-17d7cf3ea5fa',
    content: [
      {
        heading: 'Luồng gió yếu hoặc làm lạnh chậm',
        paragraphs: ['Khi luồng gió yếu hơn bình thường, nguyên nhân có thể đến từ lưới lọc bẩn, dàn trao đổi nhiệt bám bụi hoặc quạt hoạt động không ổn định.', 'Nên vệ sinh lưới lọc định kỳ và gọi kỹ thuật viên kiểm tra nếu tình trạng không cải thiện.'],
      },
      {
        heading: 'Xuất hiện tiếng ồn, mùi lạ hoặc nước rò rỉ',
        paragraphs: ['Âm thanh bất thường và mùi lạ là tín hiệu không nên bỏ qua. Nước rò rỉ thường liên quan đến máng nước hoặc đường thoát bị tắc.', 'Tắt thiết bị khi có mùi khét và liên hệ đơn vị kỹ thuật để bảo đảm an toàn điện.'],
      },
    ],
  },
  {
    slug: 'cach-dung-dieu-hoa-tiet-kiem-dien',
    title: 'Cách sử dụng điều hòa tiết kiệm điện trong ngày nắng nóng',
    category: 'Tiết kiệm điện',
    excerpt: 'Một số thay đổi nhỏ về nhiệt độ, chế độ quạt và cách đóng mở phòng có thể cải thiện đáng kể hiệu quả sử dụng.',
    publishedAt: '05/07/2026',
    readTime: '7 phút đọc',
    image: 'https://images.unsplash.com/photo-1581275288282-7b3b29d2dc1f',
    content: [
      {
        heading: 'Đặt nhiệt độ phù hợp',
        paragraphs: ['Mức nhiệt quá thấp không giúp phòng mát ngay lập tức nhưng khiến máy nén phải hoạt động lâu hơn.', 'Nên duy trì chênh lệch hợp lý với nhiệt độ ngoài trời và kết hợp quạt để phân phối không khí.'],
      },
      {
        heading: 'Giảm thất thoát nhiệt',
        paragraphs: ['Đóng kín cửa, hạn chế ánh nắng trực tiếp và vệ sinh lưới lọc giúp hệ thống đạt nhiệt độ mục tiêu nhanh hơn.', 'Không che kín dàn nóng và cần giữ khoảng thoáng để giải nhiệt.'],
      },
    ],
  },
  {
    slug: 'chon-cong-suat-dieu-hoa-theo-dien-tich',
    title: 'Chọn công suất điều hòa theo diện tích và mục đích sử dụng',
    category: 'Kinh nghiệm',
    excerpt: 'Diện tích chỉ là một phần của bài toán; hướng nắng, số người và thiết bị tỏa nhiệt cũng cần được tính đến.',
    publishedAt: '28/06/2026',
    readTime: '8 phút đọc',
    image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea',
    content: [
      {
        heading: 'Không chỉ dựa vào diện tích',
        paragraphs: ['Phòng nhiều kính, tầng mái hoặc có nhiều người sử dụng cần hệ số dự phòng cao hơn phòng ngủ thông thường.', 'Khảo sát thực tế giúp tránh tình trạng máy quá yếu hoặc dư công suất.'],
      },
      {
        heading: 'Ưu tiên khả năng bảo trì và vận hành',
        paragraphs: ['Vị trí dàn nóng, chiều dài đường ống và khả năng thoát nước ảnh hưởng trực tiếp đến độ bền và hiệu suất.', 'Nên bố trí thiết bị sao cho dễ kiểm tra, vệ sinh và sửa chữa về sau.'],
      },
    ],
  },
  {
    slug: 'quy-trinh-dao-tao-ky-thuat-vien-2026',
    title: 'Điện Lạnh 247 chuẩn hóa quy trình đào tạo kỹ thuật viên năm 2026',
    category: 'Tin doanh nghiệp',
    excerpt: 'Chương trình tập trung vào an toàn, chẩn đoán có dữ liệu, giao tiếp minh bạch và vệ sinh khu vực thi công.',
    publishedAt: '20/06/2026',
    readTime: '5 phút đọc',
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837',
    content: [
      {
        heading: 'Chuẩn hóa từ kỹ thuật đến trải nghiệm khách hàng',
        paragraphs: ['Mỗi kỹ thuật viên được đánh giá theo checklist an toàn, khả năng chẩn đoán và cách giải thích phương án cho khách hàng.', 'Quy trình yêu cầu báo giá trước khi sửa và ghi nhận đầy đủ kết quả bàn giao.'],
      },
      {
        heading: 'Đào tạo liên tục',
        paragraphs: ['Nội dung được cập nhật theo thiết bị mới, công nghệ inverter và các lỗi thường gặp trong thực tế.', 'Kết quả đào tạo được theo dõi để phân công đúng kỹ năng và khu vực phục vụ.'],
      },
    ],
  },
];

export const testimonials = [
  {
    name: 'Chị Minh Anh',
    role: 'Khách hàng căn hộ tại Cầu Giấy',
    quote: 'Kỹ thuật viên đến đúng giờ, giải thích nguyên nhân rõ ràng và chỉ sửa sau khi tôi đồng ý báo giá.',
    rating: 5,
  },
  {
    name: 'Anh Đức Long',
    role: 'Quản lý văn phòng',
    quote: 'Báo cáo bảo trì dễ theo dõi, đội thi công gọn gàng và không làm ảnh hưởng thời gian làm việc của công ty.',
    rating: 5,
  },
  {
    name: 'Chị Thu Hà',
    role: 'Chủ nhà hàng',
    quote: 'Đội ngũ chủ động làm ngoài giờ, xử lý dứt điểm vấn đề thoát nước và giữ khu vực bếp sạch sau thi công.',
    rating: 5,
  },
];

export const reasons = [
  { title: 'Báo giá minh bạch', description: 'Kiểm tra, giải thích và xác nhận chi phí trước khi thực hiện.' },
  { title: 'Đúng người, đúng kỹ năng', description: 'Điều phối kỹ thuật viên theo thiết bị, khu vực và mức độ ưu tiên.' },
  { title: 'Bảo hành có theo dõi', description: 'Ghi nhận lịch sử dịch vụ và thời hạn bảo hành rõ ràng.' },
  { title: 'Tôn trọng không gian sống', description: 'Che chắn, thu dọn và kiểm tra an toàn trước khi bàn giao.' },
];

export const processSteps = [
  { step: '01', title: 'Tiếp nhận', description: 'Ghi nhận thiết bị, tình trạng, địa chỉ và khung giờ mong muốn.' },
  { step: '02', title: 'Tư vấn & xác nhận', description: 'Tư vấn sơ bộ, xác nhận lịch và điều phối kỹ thuật viên phù hợp.' },
  { step: '03', title: 'Kiểm tra & báo giá', description: 'Đánh giá tại chỗ, giải thích nguyên nhân và gửi phương án chi phí.' },
  { step: '04', title: 'Thực hiện', description: 'Thi công sau khi khách hàng đồng ý, tuân thủ an toàn và vệ sinh.' },
  { step: '05', title: 'Nghiệm thu', description: 'Chạy thử, hướng dẫn sử dụng và ghi nhận thông tin bảo hành.' },
  { step: '06', title: 'Chăm sóc sau dịch vụ', description: 'Tiếp nhận bảo hành, nhắc lịch bảo trì và hỗ trợ khi cần.' },
];
