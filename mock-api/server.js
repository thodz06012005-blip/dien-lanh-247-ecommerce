const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'mock-db.json');

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:5174"
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json());

// Helper to response standard formats
const respondSuccess = (res, data = {}, message = 'Thành công', pagination = null) => {
  const payload = {
    success: true,
    message,
    data,
  };
  if (pagination) {
    payload.pagination = pagination;
  }
  return res.status(200).json(payload);
};

const respondCreated = (res, data = {}, message = 'Tạo thành công') => {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
};

const respondError = (res, status, message, errorCode = 'ERROR') => {
  return res.status(status).json({
    success: false,
    message,
    error: errorCode,
  });
};

// Initial Mock Data Generator (Synchronized with frontend-user mock/data.ts)
const getInitialData = () => {
  const categories = [
    { id: 'dieu-hoa', name: 'Điều hòa', slug: 'dieu-hoa', icon: 'Wind', productCount: 15 },
    { id: 'tu-lanh', name: 'Tủ lạnh', slug: 'tu-lanh', icon: 'Snowflake', productCount: 12 },
    { id: 'may-giat', name: 'Máy giặt', slug: 'may-giat', icon: 'Tv', productCount: 10 },
    { id: 'may-say', name: 'Máy sấy', slug: 'may-say', icon: 'Flame', productCount: 6 },
    { id: 'binh-nong-lanh', name: 'Bình nóng lạnh', slug: 'binh-nong-lanh', icon: 'Droplet', productCount: 8 },
    { id: 'may-loc-khong-khi', name: 'Máy lọc không khí', slug: 'may-loc-khong-khi', icon: 'Fan', productCount: 7 },
    { id: 'tu-dong', name: 'Tủ đông', slug: 'tu-dong', icon: 'Box', productCount: 5 },
    { id: 'linh-kien', name: 'Linh kiện điện lạnh', slug: 'linh-kien', icon: 'Settings', productCount: 20 },
    { id: 'dich-vu', name: 'Dịch vụ lắp đặt & sửa chữa', slug: 'dich-vu', icon: 'Wrench', productCount: 4 }
  ];

  const brands = [
    { id: 'daikin', name: 'Daikin', slug: 'daikin' },
    { id: 'panasonic', name: 'Panasonic', slug: 'panasonic' },
    { id: 'toshiba', name: 'Toshiba', slug: 'toshiba' },
    { id: 'lg', name: 'LG', slug: 'lg' },
    { id: 'samsung', name: 'Samsung', slug: 'samsung' },
    { id: 'electrolux', name: 'Electrolux', slug: 'electrolux' },
    { id: 'casper', name: 'Casper', slug: 'casper' },
    { id: 'funiki', name: 'Funiki', slug: 'funiki' }
  ];

  const settings = {
    storeName: 'Điện Lạnh 247',
    hotline: '1900 1234',
    zalo: '0987654321',
    email: 'support@dienlanh247.vn',
    address: '123 Đường Cầu Giấy, Hà Nội',
    shippingFee: 30000,
    freeShippingThreshold: 10000000
  };

  const rawProducts = [
    {
      id: 'dh-daikin-ftkf25xvmv',
      name: 'Điều hòa Daikin Inverter 1 HP FTKF25XVMV',
      slug: 'dieu-hoa-daikin-inverter-1-hp-ftkf25xvmv',
      sku: 'FTKF25XVMV',
      categoryId: 'dieu-hoa',
      brandId: 'daikin',
      basePrice: 11990000,
      salePrice: 10490000,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      stock: 18,
      rating: 4.8,
      reviewCount: 45,
      images: [
        'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1621905252507-b354bc25edac?q=80&w=600&auto=format&fit=crop'
      ],
      description: 'Điều hòa Daikin FTKF25XVMV sở hữu thiết kế hiện đại, công nghệ luồng gió Coanda độc quyền giúp bảo vệ sức khỏe, cùng công nghệ tiết kiệm điện Inverter tiên tiến mang lại cảm giác dễ chịu và hóa đơn tiền điện thấp hơn.',
      specifications: [
        { name: 'Công suất lạnh', value: '1 HP (9.200 BTU)' },
        { name: 'Phạm vi sử dụng', value: 'Dưới 15m² (từ 30 đến 45 m³)' },
        { name: 'Công nghệ tiết kiệm điện', value: 'Inverter - Tiết kiệm điện năng vượt trội' },
        { name: 'Loại Gas', value: 'R32 thân thiện môi trường' },
        { name: 'Đặc điểm nổi bật', value: 'Luồng gió Coanda, phin lọc Enzyme Blue tích hợp PM2.5' },
        { name: 'Xuất xứ', value: 'Việt Nam' },
        { name: 'Năm ra mắt', value: '2023' },
        { name: 'Bảo hành', value: 'Cục lạnh 1 năm, Máy nén 5 năm' }
      ],
      features: [
        'Công nghệ Inverter tiết kiệm điện tối ưu, vận hành cực kỳ êm ái',
        'Luồng gió Coanda tránh thổi trực tiếp vào cơ thể, bảo vệ sức khỏe cả nhà',
        'Phin lọc Enzyme Blue kết hợp lọc bụi mịn PM2.5 khử mùi diệt khuẩn',
        'Chức năng chống ẩm mốc giúp dàn lạnh luôn sạch sẽ khô ráo'
      ]
    },
    {
      id: 'dh-panasonic-xu9zkh8',
      name: 'Điều hòa Panasonic Inverter 1 HP CU/CS-XU9ZKH-8',
      slug: 'dieu-hoa-panasonic-inverter-1-hp-cucs-xu9zkh-8',
      sku: 'CU/CS-XU9ZKH-8',
      categoryId: 'dieu-hoa',
      brandId: 'panasonic',
      basePrice: 16290000,
      salePrice: 14790000,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      stock: 12,
      rating: 4.9,
      reviewCount: 32,
      images: [
        'https://images.unsplash.com/photo-1621905252507-b354bc25edac?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=600&auto=format&fit=crop'
      ],
      description: 'Dòng điều hòa cao cấp Panasonic XU9ZKH-8 tích hợp công nghệ Nanoe™ X thế hệ II lọc không khí sạch vượt trội suốt 24 giờ, kết hợp Inverter và Eco thông minh AI giúp tối đa hóa khả năng tiết kiệm điện năng.',
      specifications: [
        { name: 'Công suất lạnh', value: '1 HP (9.040 BTU)' },
        { name: 'Phạm vi sử dụng', value: 'Dưới 15m²' },
        { name: 'Công nghệ tiết kiệm điện', value: 'Inverter + ECO tích hợp AI' },
        { name: 'Loại Gas', value: 'R32' },
        { name: 'Lọc bụi', value: 'Nanoe-G (lọc bụi mịn PM2.5) & Nanoe™ X khử mùi diệt khuẩn' },
        { name: 'Xuất xứ', value: 'Malaysia' },
        { name: 'Năm ra mắt', value: '2023' },
        { name: 'Bảo hành', value: 'Thân máy 1 năm, Máy nén 7 năm' }
      ],
      features: [
        'Công nghệ lọc không khí Nanoe™ X bảo vệ sức khỏe gia đình 24/7',
        'Chế độ Eco tích hợp AI cân bằng giữa tiết kiệm điện và làm lạnh dễ chịu',
        'Làm lạnh cực nhanh iAUTO-X với công nghệ Aerowings luồng gió xa hơn',
        'Kết nối Wi-Fi thông minh quản lý điều hòa trên ứng dụng điện thoại'
      ]
    },
    {
      id: 'tl-lg-grb256bl',
      name: 'Tủ lạnh LG Inverter 519 Lít Side By Side GR-B256BL',
      slug: 'tu-lanh-lg-inverter-519-lit-side-by-side-gr-b256bl',
      sku: 'GR-B256BL',
      categoryId: 'tu-lanh',
      brandId: 'lg',
      basePrice: 21990000,
      salePrice: 17490000,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      stock: 10,
      rating: 4.7,
      reviewCount: 28,
      images: [
        'https://images.unsplash.com/photo-1571175432290-ef713134d131?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop'
      ],
      description: 'Tủ lạnh Side By Side LG GR-B256BL có thiết kế sang trọng bằng chất liệu thép không gỉ màu đen, dung tích lớn phù hợp cho gia đình từ 4-6 người. Tích hợp công nghệ Linear Inverter bền bỉ và làm lạnh đa chiều.',
      specifications: [
        { name: 'Dung tích sử dụng', value: '519 lít' },
        { name: 'Ngăn đá', value: '185 lít' },
        { name: 'Ngăn lạnh', value: '334 lít' },
        { name: 'Kiểu tủ', value: 'Side By Side - Ngăn đá bên trái' },
        { name: 'Công nghệ tiết kiệm điện', value: 'Smart Inverter' },
        { name: 'Chất liệu cửa tủ', value: 'Kim loại sơn tĩnh điện' },
        { name: 'Xuất xứ', value: 'Trung Quốc' },
        { name: 'Bảo hành', value: 'Thiết bị 2 năm, Máy nén 10 năm' }
      ],
      features: [
        'Hệ thống làm lạnh đa chiều tỏa nhiệt đều đến mọi ngăn tủ',
        'Hệ thống khay kính chịu lực bền bỉ và ngăn rau củ giữ ẩm chuyên biệt',
        'Đèn LED chiếu sáng tiết kiệm điện và chống lóa mắt',
        'Thiết kế phẳng tinh tế, tôn lên vẻ sang trọng của căn bếp hiện đại'
      ]
    },
    {
      id: 'mg-lg-fv1410s4w',
      name: 'Máy giặt LG AI DD Inverter 10 Kg FV1410S4W',
      slug: 'may-giat-lg-ai-dd-inverter-10-kg-fv1410s4w',
      sku: 'FV1410S4W',
      categoryId: 'may-giat',
      brandId: 'lg',
      basePrice: 14990000,
      salePrice: 10990000,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      stock: 15,
      rating: 4.8,
      reviewCount: 67,
      images: [
        'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?q=80&w=600&auto=format&fit=crop'
      ],
      description: 'Máy giặt cửa trước LG FV1410S4W sở hữu công nghệ cảm biến AI DD giúp bảo vệ sợi vải tốt hơn 18%. Chế độ giặt nhanh TurboWash™39 phút và công nghệ giặt hơi nước Steam diệt khuẩn tối ưu.',
      specifications: [
        { name: 'Khối lượng giặt', value: '10 Kg (Thích hợp cho gia đình trên 6 người)' },
        { name: 'Kiểu động cơ', value: 'Truyền động trực tiếp bền bỉ & êm ái' },
        { name: 'Tốc độ vắt tối đa', value: '1400 vòng/phút' },
        { name: 'Công nghệ', value: 'AI DD, TurboWash 39, Giặt hơi nước Steam, EzDispense' },
        { name: 'Hiệu suất năng lượng', value: 'Chỉ 20 Wh/kg' },
        { name: 'Xuất xứ', value: 'Việt Nam' },
        { name: 'Bảo hành', value: 'Máy 2 năm, Động cơ 10 năm' }
      ],
      features: [
        'Công nghệ trí tuệ nhân tạo AI DD tự động phát hiện độ mềm và khối lượng vải',
        'Giặt nhanh TurboWash™39 giúp rút ngắn thời gian mà vẫn đảm bảo quần áo sạch bóng',
        'Giặt hơi nước Steam diệt khuẩn và loại bỏ các tác nhân gây dị ứng da',
        'Dễ dàng thêm đồ giặt khi đang hoạt động thông qua nút Add Item'
      ]
    },
    {
      id: 'bnl-ariston-vitaly20',
      name: 'Bình nóng lạnh Ariston Vitaly 20 Slim 20 Lít',
      slug: 'binh-nong-lanh-ariston-vitaly-20-slim-20-lit',
      sku: 'VITALY20SLIM',
      categoryId: 'binh-nong-lanh',
      brandId: 'funiki',
      basePrice: 3200000,
      salePrice: 2490000,
      isFeatured: false,
      isBestSeller: true,
      isNewArrival: false,
      stock: 25,
      rating: 4.6,
      reviewCount: 19,
      images: [
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop'
      ],
      description: 'Bình nóng lạnh Ariston Vitaly 20 Slim sở hữu thiết kế thanh mảnh hiện đại, công nghệ bình chứa tráng men Titan siêu bền, hệ thống an toàn đồng bộ TSS bảo vệ an toàn tối đa cho người dùng.',
      specifications: [
        { name: 'Dung tích', value: '20 Lít' },
        { name: 'Công suất định mức', value: '2500 W' },
        { name: 'Thanh đốt', value: 'Bằng đồng 100% làm nóng nhanh' },
        { name: 'Hệ thống an toàn', value: 'Cầu dao chống giật ELCB, Bộ cảm biến nhiệt TBSE' },
        { name: 'Kích thước', value: '704 x 282 x 301 mm' },
        { name: 'Xuất xứ', value: 'Việt Nam' },
        { name: 'Bảo hành', value: 'Bình chứa 7 năm, phụ kiện 2 năm' }
      ],
      features: [
        'Thiết kế kiểu dáng Slim nằm ngang tiết kiệm không gian phòng tắm',
        'Thanh đốt đồng nguyên chất làm nóng cực nhanh, độ bền vượt trội',
        'Lòng bình tráng men Titan tránh rò rỉ nước từ bên trong',
        'Hệ thống TSS tích hợp cầu dao ELCB bảo vệ chống giật điện cực tốt'
      ]
    },
    {
      id: 'mlkk-sharp-fpjm30ev',
      name: 'Máy lọc không khí bắt muỗi Sharp FP-JM30E-B 23m²',
      slug: 'may-loc-khong-khi-bat-muoi-sharp-fp-jm30e-b',
      sku: 'FP-JM30E-B',
      categoryId: 'may-loc-khong-khi',
      brandId: 'toshiba',
      basePrice: 4890000,
      salePrice: 3850000,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      stock: 14,
      rating: 4.5,
      reviewCount: 11,
      images: [
        'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=600&auto=format&fit=crop'
      ],
      description: 'Máy lọc không khí Sharp FP-JM30E-B kết hợp 2 tính năng trong 1: Lọc sạch không khí bụi mịn PM2.5 bằng màng lọc HEPA cao cấp và bắt muỗi vật lý không chất độc hại bằng đèn UV.',
      specifications: [
        { name: 'Diện tích khuyên dùng', value: 'Dưới 23 m²' },
        { name: 'Bộ lọc', value: 'Màng lọc thô, Màng lọc HEPA khử mùi diệt khuẩn' },
        { name: 'Công nghệ ion', value: 'Plasmacluster Ion giải phóng mật độ 7000 hạt/cm³' },
        { name: 'Chức năng bắt muỗi', value: 'Đèn UV dụ muỗi và tấm keo dính' },
        { name: 'Độ ồn', value: 'từ 27 đến 44 dB' },
        { name: 'Xuất xứ', value: 'Thái Lan' },
        { name: 'Bảo hành', value: '12 tháng chính hãng' }
      ],
      features: [
        'Công nghệ Plasmacluster Ion độc quyền diệt vi khuẩn, nấm mốc và tác nhân dị ứng',
        'Màng lọc HEPA cao cấp loại bỏ 99.97% bụi mịn kích thước nhỏ đến 0.3 micromet',
        'Đèn UV dụ muỗi thông minh cùng luồng khí hút muỗi vào tấm keo không độc hại',
        'Chế độ Haze tự động điều chỉnh tốc độ quạt tối ưu cho không khí trong phòng'
      ]
    },
    {
      id: 'ms-electrolux-eds854n3sb',
      name: 'Máy sấy thông hơi Electrolux 8.5 Kg EDS854N3SB',
      slug: 'may-say-thong-hoi-electrolux-85-kg-eds854n3sb',
      sku: 'EDS854N3SB',
      categoryId: 'may-say',
      brandId: 'electrolux',
      basePrice: 11990000,
      salePrice: 9990000,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      stock: 8,
      rating: 4.8,
      reviewCount: 15,
      images: [
        'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?q=80&w=600&auto=format&fit=crop'
      ],
      description: 'Máy sấy quần áo Electrolux EDS854N3SB với công nghệ sấy đảo chiều ReverseTumbling giúp áo quần giảm nhăn đến 32% và cảm biến thông minh SmartSensors tự động đo độ ẩm để điều chỉnh thời gian sấy phù hợp.',
      specifications: [
        { name: 'Khối lượng sấy', value: '8.5 Kg' },
        { name: 'Loại máy sấy', value: 'Sấy thông hơi' },
        { name: 'Công nghệ sấy', value: 'Đảo chiều giảm nhăn, Cảm biến độ ẩm thông minh' },
        { name: 'Nhiệt độ sấy tối đa', value: '70°C bảo vệ vải' },
        { name: 'Xuất xứ', value: 'Thái Lan' },
        { name: 'Bảo hành', value: '2 năm toàn máy, Động cơ 10 năm' }
      ],
      features: [
        'Sấy đảo chiều ReverseTumbling liên tục giúp quần áo không xoắn rối và giảm nhăn tốt',
        'Cảm biến độ ẩm SmartSensors tránh sấy quá khô làm hư tổn cấu trúc sợi vải',
        'Hẹn giờ sấy linh hoạt và chế độ sấy nhanh tiện lợi cho cuộc sống bận rộn',
        'Bộ lọc xơ vải 2 lớp dễ dàng tháo rời và vệ sinh định kỳ'
      ]
    },
    {
      id: 'td-sanaky-vh2599a1',
      name: 'Tủ đông Sanaky 208 Lít VH-2599A1 một ngăn đông',
      slug: 'tu-dong-sanaky-208-lit-vh-2599a1',
      sku: 'VH-2599A1',
      categoryId: 'tu-dong',
      brandId: 'funiki',
      basePrice: 7500000,
      salePrice: 6290000,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: false,
      stock: 11,
      rating: 4.6,
      reviewCount: 22,
      images: [
        'https://images.unsplash.com/photo-1571175432290-ef713134d131?q=80&w=600&auto=format&fit=crop'
      ],
      description: 'Tủ đông Sanaky VH-2599A1 dung tích sử dụng 208 Lít, lòng tủ làm từ hợp kim nhôm, trang bị dàn lạnh đồng nguyên chất làm lạnh nhanh sâu, giữ thực phẩm tươi ngon lâu ngày.',
      specifications: [
        { name: 'Dung tích tổng', value: '250 Lít' },
        { name: 'Dung tích sử dụng', value: '208 Lít' },
        { name: 'Số ngăn', value: '1 ngăn đông chuyên biệt' },
        { name: 'Dàn lạnh', value: 'Bằng đồng nguyên chất 100%' },
        { name: 'Nhiệt độ ngăn đông', value: '≤ -18°C' },
        { name: 'Xuất xứ', value: 'Việt Nam' },
        { name: 'Bảo hành', value: '24 tháng toàn bộ máy' }
      ],
      features: [
        'Dàn lạnh đồng nguyên chất giúp tủ truyền nhiệt nhanh hơn, giữ nhiệt lâu và tiết kiệm điện',
        'Lòng tủ bằng nhôm sơn tĩnh điện phẳng phẳng dễ lau dọn vệ sinh hàng ngày',
        'Bảng điều khiển nhiệt độ nằm bên ngoài thân tủ dễ thao tác điều chỉnh',
        'Thiết kế bánh xe chịu lực tốt dễ di chuyển đặt để ở mọi không gian kinh doanh'
      ]
    },
    {
      id: 'lk-block-daikin-1hp',
      name: 'Block máy nén điều hòa Daikin 1 HP R32 chính hãng',
      slug: 'block-may-nen-dieu-hoa-daikin-1-hp-r32',
      sku: 'BLOCK-DK-1HP',
      categoryId: 'linh-kien',
      brandId: 'daikin',
      basePrice: 2800000,
      salePrice: 2450000,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: false,
      stock: 30,
      rating: 4.7,
      reviewCount: 14,
      images: [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop'
      ],
      description: 'Block máy nén điều hòa Daikin 1 HP sử dụng gas R32, hàng chính hãng tháo máy hoặc mới nguyên hộp, hoạt động bền bỉ, êm ái, lắp đặt đồng bộ hiệu năng cao.',
      specifications: [
        { name: 'Tương thích', value: 'Các dòng điều hòa Daikin 1 HP (9.000 BTU) dùng gas R32' },
        { name: 'Công suất', value: '1 HP (Máy nén rô-to cuộn)' },
        { name: 'Loại Gas', value: 'R32' },
        { name: 'Xuất xứ', value: 'Thái Lan' },
        { name: 'Tình trạng', value: 'Mới 100% nguyên đai nguyên kiện' },
        { name: 'Bảo hành', value: '6 tháng (lên tới 12 tháng nếu sử dụng dịch vụ thay của Điện Lạnh 247)' }
      ],
      features: [
        'Máy nén chính hãng Daikin đảm bảo hiệu suất nén cao và tiết kiệm điện năng',
        'Vận hành cực êm ái ít tiếng ồn khó chịu',
        'Độ bền vật liệu cao, chống ăn mòn và quá tải tốt'
      ]
    },
    {
      id: 'lk-remote-daikin',
      name: 'Điều khiển điều hòa Daikin Inverter 2 chiều đa năng',
      slug: 'dieu-khien-dieu-hoa-daikin-inverter-2-chieu',
      sku: 'REMOTE-DK-INV',
      categoryId: 'linh-kien',
      brandId: 'daikin',
      basePrice: 250000,
      salePrice: 180000,
      isFeatured: false,
      isBestSeller: true,
      isNewArrival: false,
      stock: 120,
      rating: 4.5,
      reviewCount: 88,
      images: [
        'https://images.unsplash.com/photo-1595787143151-e601da948ea8?q=80&w=600&auto=format&fit=crop'
      ],
      description: 'Điều khiển điều hòa Daikin dùng cho các dòng máy lạnh Inverter 1 chiều và 2 chiều chính hãng hoặc tương đương, chất liệu nhựa ABS cao cấp, phím bấm nhạy nảy, màn hình hiển thị sắc nét.',
      specifications: [
        { name: 'Chất liệu', value: 'Nhựa ABS cao cấp chống va đập tốt' },
        { name: 'Nguồn cấp', value: '2 Pin AAA' },
        { name: 'Khoảng cách nhận tín hiệu', value: 'Lên tới 8m' },
        { name: 'Tương thích', value: 'Hầu hết các dòng điều hòa treo tường Daikin Inverter từ 2015-2023' },
        { name: 'Bảo hành', value: '3 tháng lỗi 1 đổi 1' }
      ],
      features: [
        'Phím bấm cao su cao cấp độ nảy tốt, chữ in rõ nét không phai màu',
        'Màn hình LCD hiển thị đầy đủ nhiệt độ, chế độ gió, chế độ vẩy cánh',
        'Nhỏ gọn cầm chắc tay, tiết kiệm pin'
      ]
    },
    {
      id: 'dv-bao-duong-dh',
      name: 'Dịch vụ bảo dưỡng vệ sinh điều hòa treo tường tiêu chuẩn',
      slug: 'dich-vu-bao-duong-ve-sinh-dieu-hoa-treo-tuong',
      sku: 'DV-BD-DH',
      categoryId: 'dich-vu',
      brandId: 'funiki',
      basePrice: 250000,
      salePrice: 199000,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      stock: 999,
      rating: 4.9,
      reviewCount: 230,
      images: [
        'https://images.unsplash.com/photo-1621905252507-b354bc25edac?q=80&w=600&auto=format&fit=crop'
      ],
      description: 'Dịch vụ vệ sinh xịt rửa bảo dưỡng điều hòa treo tường (9.000 BTU - 24.000 BTU) trọn gói. Đội ngũ kỹ thuật viên giàu kinh nghiệm, chuyên nghiệp, bảo hành chảy nước và gas sau khi vệ sinh 1 tháng.',
      specifications: [
        { name: 'Thời gian thực hiện', value: '45 - 60 phút / máy' },
        { name: 'Phạm vi dịch vụ', value: 'Nội thành Hà Nội & TP. Hồ Chí Minh' },
        { name: 'Quy trình thực hiện', value: 'Đo gas dòng điện -> Xịt rửa cục nóng lạnh -> Vệ sinh phin lọc -> Thông đường thoát nước -> Nghiệm thu kiểm tra' },
        { name: 'Bảo hành chất lượng', value: '1 tháng cho lỗi chảy nước dàn lạnh' },
        { name: 'Hỗ trợ kỹ thuật', value: 'Có mặt trong vòng 2 giờ kể từ khi đặt lịch' }
      ],
      features: [
        'Xịt rửa sạch sâu dàn lạnh và dàn nóng bằng máy bơm áp lực cao',
        'Kiểm tra miễn phí lượng gas hiện tại và độ ổn định của block, quạt gió',
        'Kỹ thuật viên Điện Lạnh 247 được đào tạo bài bản, trung thực, không vẽ bệnh',
        'Có hóa đơn VAT và phiếu nghiệm thu rõ ràng'
      ]
    },
    {
      id: 'dh-daikin-ftkf35xvmv',
      name: 'Điều hòa Daikin Inverter 1.5 HP FTKF35XVMV',
      slug: 'dieu-hoa-daikin-inverter-1-5-hp-ftkf35xvmv',
      sku: 'FTKF35XVMV',
      categoryId: 'dieu-hoa',
      brandId: 'daikin',
      basePrice: 14990000,
      salePrice: 13490000,
      isFeatured: false,
      isBestSeller: true,
      isNewArrival: true,
      stock: 14,
      rating: 4.8,
      reviewCount: 22,
      images: [
        'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=600&auto=format&fit=crop'
      ],
      description: 'Điều hòa Daikin FTKF35XVMV công suất 1.5 HP thích hợp cho phòng khách hoặc phòng ngủ lớn từ 15-20m². Công nghệ Inverter tiết kiệm điện tối ưu, phin lọc Enzyme Blue bảo vệ sức khỏe hệ hô hấp.',
      specifications: [
        { name: 'Công suất lạnh', value: '1.5 HP (11.900 BTU)' },
        { name: 'Phạm vi sử dụng', value: 'Từ 15 đến 20m² (từ 40 đến 60 m³)' },
        { name: 'Công nghệ tiết kiệm điện', value: 'Inverter' },
        { name: 'Loại Gas', value: 'R32' },
        { name: 'Xuất xứ', value: 'Việt Nam' },
        { name: 'Bảo hành', value: 'Cục lạnh 1 năm, Máy nén 5 năm' }
      ],
      features: [
        'Công suất làm lạnh mạnh mẽ cho căn phòng rộng trung bình',
        'Luồng gió thoải mái Coanda phân phối gió mát đều khắp phòng',
        'Phin lọc bụi mịn PM2.5 bảo vệ bầu không khí trong lành',
        'Bo mạch bảo vệ quá áp chống sốc điện bảo vệ dàn nóng tối ưu'
      ]
    },
    {
      id: 'tl-panasonic-bz221qskv',
      name: 'Tủ lạnh Panasonic Inverter 188 Lít NR-BA221QSKV',
      slug: 'tu-lanh-panasonic-inverter-188-lit-nr-ba221qskv',
      sku: 'NR-BA221QSKV',
      categoryId: 'tu-lanh',
      brandId: 'panasonic',
      basePrice: 8290000,
      salePrice: 7190000,
      isFeatured: false,
      isBestSeller: true,
      isNewArrival: false,
      stock: 16,
      rating: 4.7,
      reviewCount: 38,
      images: [
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop'
      ],
      description: 'Tủ lạnh NR-BA221QSKV dung tích 188 lít, trang bị công nghệ tiết kiệm điện thông minh Econavi kết hợp Inverter, công nghệ kháng khuẩn Ag Clean bằng các tinh thể bạc Ag+ khử mùi tối ưu.',
      specifications: [
        { name: 'Dung tích sử dụng', value: '188 Lít' },
        { name: 'Ngăn đá', value: '53 Lít' },
        { name: 'Ngăn lạnh', value: '135 Lít' },
        { name: 'Kiểu tủ', value: 'Ngăn đá trên, 2 cánh' },
        { name: 'Công nghệ', value: 'Inverter + Cảm biến thông minh Econavi' },
        { name: 'Kháng khuẩn khử mùi', value: 'Ag Clean (Tinh thể bạc Ag+)' },
        { name: 'Xuất xứ', value: 'Việt Nam' },
        { name: 'Bảo hành', value: 'Tủ 2 năm, Máy nén 12 năm' }
      ],
      features: [
        'Cảm biến thông minh Econavi tự động điều chỉnh tốc độ máy nén theo thói quen đóng mở tủ',
        'Hệ thống Ag Clean kháng khuẩn khử mùi thực phẩm hôi tanh cực hiệu quả',
        'Ngăn rau củ Fresh Safe giữ ẩm tối đa cho rau củ quả luôn căng mọng',
        'Khay đá di động tiện lợi giúp thay đổi cách sắp xếp ngăn đông'
      ]
    },
    {
      id: 'mg-samsung-ww90t3040ww',
      name: 'Máy giặt Samsung Inverter 9 kg WW90T3040WW/SV',
      slug: 'may-giat-samsung-inverter-9-kg-ww90t3040ww-sv',
      sku: 'WW90T3040WW/SV',
      categoryId: 'may-giat',
      brandId: 'samsung',
      basePrice: 9490000,
      salePrice: 6290000,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: false,
      stock: 11,
      rating: 4.4,
      reviewCount: 19,
      images: [
        'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?q=80&w=600&auto=format&fit=crop'
      ],
      description: 'Máy giặt Samsung WW90T3040WW giá tốt, tích hợp động cơ Digital Inverter tiết kiệm điện năng vận hành êm ái, chương trình giặt nước nóng Hot Wash diệt khuẩn loại bỏ tác nhân dị ứng.',
      specifications: [
        { name: 'Khối lượng giặt', value: '9 Kg' },
        { name: 'Động cơ', value: 'Digital Inverter nam châm vĩnh cửu giảm ma sát' },
        { name: 'Tốc độ vắt', value: '1400 vòng/phút' },
        { name: 'Công nghệ', value: 'Hot Wash nước nóng, Quick Wash giặt nhanh 18 phút, Drum Clean tự vệ sinh lồng giặt' },
        { name: 'Xuất xứ', value: 'Trung Quốc' },
        { name: 'Bảo hành', value: '2 năm chính hãng, động cơ 11 năm' }
      ],
      features: [
        'Động cơ Digital Inverter hoạt động êm ái hơn và bền bỉ hơn 20 năm',
        'Chế độ giặt nhanh Quick Wash giặt sạch đồ bẩn nhẹ chỉ trong 18 phút',
        'Hẹn giờ kết thúc trì hoãn tiện lợi tránh để lâu đồ ướt trong lồng gây ẩm mốc',
        'Màn hình hiển thị LED sắc nét rõ ràng nút xoay điều khiển chương trình dễ dàng'
      ]
    },
    {
      id: 'mlkk-xiaomi-4lite',
      name: 'Máy lọc không khí Xiaomi Smart Air Purifier 4 Lite',
      slug: 'may-loc-khong-khi-xiaomi-smart-air-purifier-4-lite',
      sku: 'XMI-AP4-LITE',
      categoryId: 'may-loc-khong-khi',
      brandId: 'samsung',
      basePrice: 3990000,
      salePrice: 2890000,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      stock: 20,
      rating: 4.7,
      reviewCount: 145,
      images: [
        'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=600&auto=format&fit=crop'
      ],
      description: 'Máy lọc không khí Xiaomi 4 Lite thiết kế hình hộp vuông vắn sang trọng, màn hình OLED cảm ứng hiển thị chất lượng không khí, màng lọc 3 lớp hiệu suất cao lọc sạch đến 99.97% hạt bụi PM2.5.',
      specifications: [
        { name: 'Diện tích khuyên dùng', value: 'Từ 25 đến 43 m²' },
        { name: 'Tỉ lệ lọc sạch bụi', value: '360 m³/h (CADR Particles)' },
        { name: 'Bộ lọc', value: 'Màng lọc thô + Màng lọc HEPA của Xiaomi + Màng lọc than hoạt tính chất lượng cao' },
        { name: 'Đồ ồn khi hoạt động', value: 'Từ 33.4 đến 61 dB' },
        { name: 'Kết nối app', value: 'App Mi Home qua Wi-Fi điều khiển từ xa, hỗ trợ Alexa & Google Assistant' },
        { name: 'Xuất xứ', value: 'Trung Quốc' },
        { name: 'Bảo hành', value: '12 tháng chính hãng' }
      ],
      features: [
        'Lọc sạch 99.97% hạt bụi mịn nhỏ 0.3 micromet, phấn hoa, lông thú nuôi',
        'Màn hình hiển thị chỉ số bụi PM2.5 theo thời gian thực và vòng màu chất lượng không khí',
        'Kết nối thông minh ứng dụng di động điều khiển bật tắt từ xa, khóa trẻ em, đổi chế độ',
        'Chế độ ban đêm siêu êm ái tiếng ồn nhỏ không ảnh hưởng giấc ngủ trẻ thơ'
      ]
    }
  ];

  const products = rawProducts.map(p => ({
    ...p,
    thumbnail: p.images[0] || '',
    status: p.stock > 0 ? 'active' : 'out_of_stock',
    lowStockThreshold: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  const initialOrders = [
    {
      id: 'DL247-849204',
      code: 'DL247-849204',
      customerName: 'Nguyễn Văn Nam',
      phone: '0987654321',
      email: 'nam.nv@gmail.com',
      address: {
        province: 'Hà Nội',
        district: 'Quận Cầu Giấy',
        detail: 'Số 12 Ngõ 34 Trần Thái Tông'
      },
      note: 'Giao giờ hành chính',
      items: [
        {
          productId: 'dv-bao-duong-dh',
          name: 'Dịch vụ bảo dưỡng vệ sinh điều hòa treo tường tiêu chuẩn',
          sku: 'DV-BD-DH',
          thumbnail: 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?q=80&w=200&auto=format&fit=crop',
          price: 199000,
          quantity: 1,
          total: 199000
        }
      ],
      subtotal: 199000,
      shippingFee: 30000,
      discount: 50000,
      total: 179000,
      paymentMethod: 'COD',
      paymentStatus: 'paid',
      status: 'delivered',
      createdAt: '2026-06-19T09:12:00.000Z',
      updatedAt: '2026-06-19T10:00:00.000Z',
      deliveredAt: '2026-06-19T10:00:00.000Z'
    },
    {
      id: 'DL247-920485',
      code: 'DL247-920485',
      customerName: 'Nguyễn Văn Nam',
      phone: '0987654321',
      email: 'nam.nv@gmail.com',
      address: {
        province: 'Hà Nội',
        district: 'Quận Cầu Giấy',
        detail: 'Số 12 Ngõ 34 Trần Thái Tông'
      },
      items: [
        {
          productId: 'dh-daikin-ftkf25xvmv',
          name: 'Điều hòa Daikin Inverter 1 HP FTKF25XVMV',
          sku: 'FTKF25XVMV',
          thumbnail: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=200&auto=format&fit=crop',
          price: 10490000,
          quantity: 1,
          total: 10490000
        }
      ],
      subtotal: 10490000,
      shippingFee: 150000,
      discount: 1000000,
      total: 9640000,
      paymentMethod: 'COD',
      paymentStatus: 'unpaid',
      status: 'processing',
      createdAt: '2026-06-18T14:30:00.000Z',
      updatedAt: '2026-06-18T14:35:00.000Z'
    }
  ];

  const customers = [
    {
      id: 'cust-1',
      name: 'Nguyễn Văn Nam',
      phone: '0987654321',
      email: 'nam.nv@gmail.com',
      orderCount: 2,
      totalSpent: 9819000,
      createdAt: '2026-06-15T09:12:00.000Z'
    }
  ];

  return {
    categories,
    brands,
    settings,
    products,
    orders: initialOrders,
    customers,
    contacts: []
  };
};

// Database utility functions
const readDB = () => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const data = getInitialData();
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
      return data;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    if (!raw.trim()) {
      const data = getInitialData();
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
      return data;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading DB:', error);
    return getInitialData();
  }
};

const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing DB:', error);
    return false;
  }
};

// Adapters to map mock-db standardized model to customer frontend (frontend-user) formats
const mapProductToUser = (p) => {
  // Convert specifications format: array of {name, value} -> object Record<string, string>
  const specificationsObj = {};
  if (Array.isArray(p.specifications)) {
    p.specifications.forEach(spec => {
      specificationsObj[spec.name] = spec.value;
    });
  } else if (p.specifications && typeof p.specifications === 'object') {
    Object.assign(specificationsObj, p.specifications);
  }

  // Convert images to [{url: ...}] format
  const imagesCompat = p.images.map(img => {
    if (typeof img === 'string') return { url: img };
    return img;
  });

  return {
    ...p,
    inStock: p.stock > 0 && p.status === 'active',
    quantity: p.stock, // frontend-user calls stock "quantity"
    specifications: specificationsObj,
    images: imagesCompat
  };
};

const mapOrderToUser = (o) => {
  // Convert address back to flat details
  return {
    id: o.id,
    customerName: o.customerName,
    phone: o.phone,
    email: o.email || '',
    city: o.address.province,
    district: o.address.district,
    addressDetail: o.address.detail,
    note: o.note || '',
    paymentMethod: o.paymentMethod.toLowerCase(),
    shippingFee: o.shippingFee,
    discountAmount: o.discount,
    totalAmount: o.total,
    status: o.status,
    items: o.items.map(item => ({
      productId: item.productId,
      name: item.name,
      sku: item.sku,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.thumbnail
    })),
    createdAt: new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(o.createdAt))
  };
};

// ----------------------------------------------------
// 1. SYSTEM / UTILITY ENDPOINTS
// ----------------------------------------------------

// GET /
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      <h1 style="color: #2563eb;">Điện Lạnh 247 Mock API Server</h1>
      <p style="color: #475569;">Mock API đang chạy thành công trên cổng <strong>3001</strong>.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <h3 style="color: #0f172a;">Các đường dẫn kiểm tra nhanh:</h3>
      <ul style="line-height: 1.8;">
        <li>Kiểm tra sức khỏe hệ thống: <a href="/api/v1/health" style="color: #2563eb; text-decoration: none;">/api/v1/health</a></li>
        <li>Danh sách sản phẩm mẫu: <a href="/api/v1/products" style="color: #2563eb; text-decoration: none;">/api/v1/products</a></li>
        <li>Danh mục sản phẩm: <a href="/api/v1/categories" style="color: #2563eb; text-decoration: none;">/api/v1/categories</a></li>
        <li>Thương hiệu sản phẩm: <a href="/api/v1/brands" style="color: #2563eb; text-decoration: none;">/api/v1/brands</a></li>
      </ul>
    </div>
  `);
});

// GET /api/v1
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: 'Điện Lạnh 247 Mock API v1 đang hoạt động ổn định!'
  });
});

// GET /health
app.get('/api/v1/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Mock API is running',
    data: {
      service: 'dl247-mock-api',
      time: new Date().toISOString()
    }
  });
});


// POST /dev/reset-db
app.post('/api/v1/dev/reset-db', (req, res) => {
  const data = getInitialData();
  writeDB(data);
  return respondSuccess(res, {}, 'Đã khôi phục cơ sở dữ liệu mẫu về mặc định thành công!');
});

// ----------------------------------------------------
// 2. CLIENT WEB ENDPOINTS (frontend-user)
// ----------------------------------------------------

// GET /categories
app.get('/api/v1/categories', (req, res) => {
  const db = readDB();
  return respondSuccess(res, db.categories);
});

// GET /brands
app.get('/api/v1/brands', (req, res) => {
  const db = readDB();
  return respondSuccess(res, db.brands);
});

// GET /products/featured
app.get('/api/v1/products/featured', (req, res) => {
  const db = readDB();
  const featured = db.products
    .filter(p => p.isFeatured && p.status === 'active')
    .map(mapProductToUser);
  return respondSuccess(res, featured);
});

// GET /products/search
app.get('/api/v1/products/search', (req, res) => {
  const db = readDB();
  const q = (req.query.q || '').toLowerCase().trim();
  if (!q) {
    return respondSuccess(res, []);
  }
  const filtered = db.products
    .filter(p => 
      p.status === 'active' && 
      (p.name.toLowerCase().includes(q) || 
       p.sku.toLowerCase().includes(q) || 
       p.description.toLowerCase().includes(q))
    )
    .map(mapProductToUser);
  return respondSuccess(res, filtered.slice(0, 10));
});

// GET /products/:identifier
app.get('/api/v1/products/:identifier', (req, res) => {
  const db = readDB();
  const idOrSlug = req.params.identifier;
  const product = db.products.find(p => p.id === idOrSlug || p.slug === idOrSlug);
  
  if (product) {
    // Hidden products cannot be viewed by customers
    if (product.status === 'hidden') {
      return respondError(res, 404, 'Sản phẩm đã bị ẩn hoặc không tồn tại', 'PRODUCT_NOT_FOUND');
    }
    return respondSuccess(res, mapProductToUser(product));
  }
  return respondError(res, 404, 'Không tìm thấy sản phẩm', 'PRODUCT_NOT_FOUND');
});

// GET /products
app.get('/api/v1/products', (req, res) => {
  const db = readDB();
  let filtered = db.products.filter(p => p.status === 'active' || p.status === 'out_of_stock'); // exclude hidden

  const { categoryId, brandId, priceMin, priceMax, inverter, capacity, q, sort, inStock, hasPromo } = req.query;

  if (categoryId) {
    filtered = filtered.filter(p => p.categoryId === categoryId);
  }
  if (brandId) {
    filtered = filtered.filter(p => p.brandId === brandId);
  }
  if (priceMin) {
    filtered = filtered.filter(p => (p.salePrice || p.basePrice) >= Number(priceMin));
  }
  if (priceMax) {
    filtered = filtered.filter(p => (p.salePrice || p.basePrice) <= Number(priceMax));
  }
  if (inStock === 'true') {
    filtered = filtered.filter(p => p.stock > 0);
  } else if (inStock === 'false') {
    filtered = filtered.filter(p => p.stock <= 0);
  }
  if (hasPromo === 'true') {
    filtered = filtered.filter(p => p.salePrice && p.salePrice < p.basePrice);
  }
  if (inverter) {
    const isInv = inverter === 'true';
    filtered = filtered.filter(p => {
      // Find within specifications
      const specsObj = {};
      p.specifications.forEach(s => { specsObj[s.name] = s.value; });
      const specText = specsObj['Công nghệ tiết kiệm điện'] || '';
      const hasInverter = specText.toLowerCase().includes('inverter');
      return isInv ? hasInverter : !hasInverter;
    });
  }
  if (capacity) {
    filtered = filtered.filter(p => {
      const specsObj = {};
      p.specifications.forEach(s => { specsObj[s.name] = s.value; });
      const specText = specsObj['Công suất lạnh'] || '';
      return specText.toLowerCase().includes(capacity.toLowerCase());
    });
  }
  if (q) {
    const searchWord = q.toLowerCase().trim();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(searchWord) || 
      p.sku.toLowerCase().includes(searchWord) || 
      p.description.toLowerCase().includes(searchWord)
    );
  }

  // Sort
  if (sort === 'priceAsc') {
    filtered.sort((a, b) => (a.salePrice || a.basePrice) - (b.salePrice || b.basePrice));
  } else if (sort === 'priceDesc') {
    filtered.sort((a, b) => (b.salePrice || b.basePrice) - (a.salePrice || a.basePrice));
  } else if (sort === 'bestSeller') {
    filtered.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
  } else if (sort === 'promoHot') {
    filtered.sort((a, b) => {
      const discA = a.salePrice ? (a.basePrice - a.salePrice) : 0;
      const discB = b.salePrice ? (b.basePrice - b.salePrice) : 0;
      return discB - discA;
    });
  } else {
    // default/newest
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Pagination
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 12);
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedData = filtered.slice((page - 1) * limit, page * limit).map(mapProductToUser);

  return respondSuccess(res, paginatedData, 'Lấy danh sách sản phẩm thành công', {
    page,
    limit,
    total,
    totalPages
  });
});

// POST /orders (Place COD/Unpaid orders)
app.post('/api/v1/orders', (req, res) => {
  const db = readDB();
  const body = req.body;

  if (!body.items || body.items.length === 0) {
    return respondError(res, 400, 'Giỏ hàng rỗng', 'EMPTY_CART');
  }

  // 1. Stock validation & updates
  for (const item of body.items) {
    const p = db.products.find(prod => prod.id === item.productId);
    if (!p) {
      return respondError(res, 404, `Sản phẩm ${item.name} không tồn tại`, 'PRODUCT_NOT_FOUND');
    }
    if (p.stock < item.quantity) {
      return respondError(res, 400, `Sản phẩm ${p.name} không đủ tồn kho (Còn lại ${p.stock})`, 'INSUFFICIENT_STOCK');
    }
  }

  // 2. Perform Stock deduction
  body.items.forEach(item => {
    const p = db.products.find(prod => prod.id === item.productId);
    p.stock -= item.quantity;
    if (p.stock <= 0) {
      p.status = 'out_of_stock';
    }
    p.updatedAt = new Date().toISOString();
  });

  // 3. Create new order
  const orderCode = `DL247-${Math.floor(100000 + Math.random() * 900000)}`;
  const orderItems = body.items.map(item => {
    const p = db.products.find(prod => prod.id === item.productId);
    return {
      productId: item.productId,
      name: p.name,
      sku: p.sku,
      thumbnail: p.thumbnail,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
  const shippingFee = body.shippingFee || 30000;
  const discount = body.discountAmount || 0;
  const total = subtotal + shippingFee - discount;

  const newOrder = {
    id: orderCode,
    code: orderCode,
    customerName: body.customerName,
    phone: body.phone,
    email: body.email || '',
    address: {
      province: body.city || '',
      district: body.district || '',
      detail: body.addressDetail || ''
    },
    note: body.note || '',
    items: orderItems,
    subtotal,
    shippingFee,
    discount,
    total,
    paymentMethod: (body.paymentMethod || 'COD').toUpperCase(),
    paymentStatus: 'unpaid',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 4. Update customer profiles
  const custIndex = db.customers.findIndex(c => c.phone === body.phone);
  if (custIndex !== -1) {
    db.customers[custIndex].orderCount += 1;
    db.customers[custIndex].totalSpent += total;
  } else {
    db.customers.push({
      id: `cust-${Date.now()}`,
      name: body.customerName,
      phone: body.phone,
      email: body.email || '',
      orderCount: 1,
      totalSpent: total,
      createdAt: new Date().toISOString()
    });
  }

  db.orders.unshift(newOrder);
  writeDB(db);

  return respondCreated(res, mapOrderToUser(newOrder), 'Đặt hàng thành công');
});

// GET /orders (Lọc theo phone)
app.get('/api/v1/orders', (req, res) => {
  const db = readDB();
  const phone = req.query.phone;
  let list = db.orders;
  if (phone) {
    list = list.filter(o => o.phone === phone);
  }
  return respondSuccess(res, list.map(mapOrderToUser));
});

// GET /orders/:id
app.get('/api/v1/orders/:id', (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if (order) {
    return respondSuccess(res, mapOrderToUser(order));
  }
  return respondError(res, 404, 'Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND');
});

// PATCH /orders/:id/cancel (Customer cancels order)
app.patch('/api/v1/orders/:id/cancel', (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.id === req.params.id);

  if (!order) {
    return respondError(res, 404, 'Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND');
  }

  if (order.status !== 'pending') {
    return respondError(res, 400, 'Chỉ có thể hủy đơn hàng ở trạng thái Chờ xác nhận', 'INVALID_ORDER_STATUS');
  }

  // Restore stock
  order.items.forEach(item => {
    const p = db.products.find(prod => prod.id === item.productId);
    if (p) {
      p.stock += item.quantity;
      if (p.status === 'out_of_stock' && p.stock > 0) {
        p.status = 'active';
      }
      p.updatedAt = new Date().toISOString();
    }
  });

  order.status = 'cancelled';
  order.cancelledAt = new Date().toISOString();
  order.updatedAt = new Date().toISOString();

  // Deduct spent from customer if order cancelled
  const cust = db.customers.find(c => c.phone === order.phone);
  if (cust) {
    cust.totalSpent = Math.max(0, cust.totalSpent - order.total);
    cust.orderCount = Math.max(0, cust.orderCount - 1);
  }

  writeDB(db);
  return respondSuccess(res, mapOrderToUser(order), 'Đã hủy đơn hàng thành công');
});

// POST /contact
app.post('/api/v1/contact', (req, res) => {
  const db = readDB();
  const body = req.body;
  const newContact = {
    id: `contact-${Date.now()}`,
    name: body.name || '',
    phone: body.phone || '',
    email: body.email || '',
    message: body.message || '',
    createdAt: new Date().toISOString()
  };
  db.contacts.push(newContact);
  writeDB(db);
  return respondSuccess(res, {}, 'Gửi yêu cầu tư vấn thành công. Điện Lạnh 247 sẽ liên hệ với bạn trong vòng 15 phút!');
});

// GET /settings/public
app.get('/api/v1/settings/public', (req, res) => {
  const db = readDB();
  const pub = {
    hotline: db.settings.hotline,
    zalo: db.settings.zalo,
    email: db.settings.email,
    address: db.settings.address,
    shippingFee: db.settings.shippingFee,
    freeShippingThreshold: db.settings.freeShippingThreshold
  };
  return respondSuccess(res, pub);
});

// Mock Authentication (matching User client logins)
app.post('/api/v1/auth/login', (req, res) => {
  const { email } = req.body;
  const mockUser = {
    id: 1,
    email: email || 'khachhang@gmail.com',
    role: 'user',
    firstName: email ? email.split('@')[0] : 'Khách Hàng',
    lastName: 'Demo',
    phone: '0987654321',
    city: 'Hà Nội',
    district: 'Quận Cầu Giấy',
    addressDetail: 'Số 12 Ngõ 34 Trần Thái Tông',
  };
  return respondSuccess(res, mockUser, 'Đăng nhập thành công');
});

app.post('/api/v1/auth/register', (req, res) => {
  const { email, firstName, lastName } = req.body;
  const mockUser = {
    id: 2,
    email: email || 'khachhang2@gmail.com',
    role: 'user',
    firstName: firstName || 'Khách',
    lastName: lastName || 'Mới',
    phone: '',
    city: '',
    district: '',
    addressDetail: '',
  };
  return respondCreated(res, mockUser, 'Đăng ký thành công');
});

app.post('/api/v1/auth/logout', (req, res) => {
  return respondSuccess(res, null, 'Đăng xuất thành công');
});

app.get('/api/v1/auth/me', (req, res) => {
  // Always return user for demo
  const mockUser = {
    id: 1,
    email: 'khachhang@gmail.com',
    role: 'user',
    firstName: 'Khách Hàng',
    lastName: 'Demo',
    phone: '0987654321',
    city: 'Hà Nội',
    district: 'Quận Cầu Giấy',
    addressDetail: 'Số 12 Ngõ 34 Trần Thái Tông',
  };
  return respondSuccess(res, mockUser);
});


// ----------------------------------------------------
// 3. ADMIN PORTAL ENDPOINTS (frontend-admin)
// ----------------------------------------------------

// GET /admin/dashboard
app.get('/api/v1/admin/dashboard', (req, res) => {
  const db = readDB();
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate today's revenue: sum of total amounts of 'delivered' orders delivered today
  const todayRevenue = db.orders
    .filter(o => o.status === 'delivered' && o.deliveredAt && o.deliveredAt.startsWith(todayStr))
    .reduce((sum, o) => sum + o.total, 0);

  // New orders: count of 'pending' orders
  const pendingOrders = db.orders.filter(o => o.status === 'pending').length;

  // New customers today
  const newCustomers = db.customers.filter(c => c.createdAt && c.createdAt.startsWith(todayStr)).length;

  const totalProducts = db.products.length;
  const totalOrders = db.orders.length;

  // Recent 5 orders
  const recentOrders = db.orders.slice(0, 5).map(o => ({
    key: o.id,
    orderNumber: o.code,
    customer: o.customerName,
    total: o.total,
    status: o.status,
    date: new Date(o.createdAt).toLocaleDateString('vi-VN')
  }));

  const stats = {
    todayRevenue,
    pendingOrders,
    newCustomers,
    totalProducts,
    totalOrders,
    recentOrders
  };

  return respondSuccess(res, stats);
});

// GET /admin/products
app.get('/api/v1/admin/products', (req, res) => {
  const db = readDB();
  // Return raw details including hidden
  return respondSuccess(res, db.products);
});

// POST /admin/products
app.post('/api/v1/admin/products', (req, res) => {
  const db = readDB();
  const body = req.body;

  if (!body.name || !body.sku || !body.basePrice) {
    return respondError(res, 400, 'Thiếu thông tin sản phẩm', 'INVALID_PRODUCT_DATA');
  }

  const generatedSlug = body.slug || body.name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-');

  const generatedId = body.id || `prod-${Date.now()}`;

  const newProduct = {
    id: generatedId,
    name: body.name,
    slug: generatedSlug,
    sku: body.sku,
    categoryId: body.categoryId || 'linh-kien',
    brandId: body.brandId || 'funiki',
    thumbnail: body.thumbnail || 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=400',
    images: body.images || [body.thumbnail || 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=400'],
    basePrice: Number(body.basePrice),
    salePrice: body.salePrice ? Number(body.salePrice) : Number(body.basePrice),
    stock: Number(body.stock !== undefined ? body.stock : 10),
    lowStockThreshold: Number(body.lowStockThreshold || 3),
    status: body.status || (Number(body.stock) > 0 ? 'active' : 'out_of_stock'),
    isFeatured: !!body.isFeatured,
    isBestSeller: !!body.isBestSeller,
    isNewArrival: !!body.isNewArrival,
    specifications: body.specifications || [],
    features: body.features || [],
    description: body.description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.products.unshift(newProduct);
  writeDB(db);

  return respondCreated(res, newProduct, 'Thêm sản phẩm mới thành công');
});

// PATCH /admin/products/:id
app.patch('/api/v1/admin/products/:id', (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const pIndex = db.products.findIndex(p => p.id === id);

  if (pIndex === -1) {
    return respondError(res, 404, 'Không tìm thấy sản phẩm', 'PRODUCT_NOT_FOUND');
  }

  const existing = db.products[pIndex];
  const body = req.body;

  const updatedProduct = {
    ...existing,
    ...body,
    basePrice: body.basePrice !== undefined ? Number(body.basePrice) : existing.basePrice,
    salePrice: body.salePrice !== undefined ? Number(body.salePrice) : existing.salePrice,
    stock: body.stock !== undefined ? Number(body.stock) : existing.stock,
    lowStockThreshold: body.lowStockThreshold !== undefined ? Number(body.lowStockThreshold) : existing.lowStockThreshold,
    updatedAt: new Date().toISOString()
  };

  // Sync status if stock changes and status isn't hidden
  if (body.stock !== undefined && updatedProduct.status !== 'hidden') {
    updatedProduct.status = Number(body.stock) > 0 ? 'active' : 'out_of_stock';
  }

  db.products[pIndex] = updatedProduct;
  writeDB(db);

  return respondSuccess(res, updatedProduct, 'Cập nhật sản phẩm thành công');
});

// DELETE /admin/products/:id
app.delete('/api/v1/admin/products/:id', (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const pIndex = db.products.findIndex(p => p.id === id);

  if (pIndex === -1) {
    return respondError(res, 404, 'Không tìm thấy sản phẩm', 'PRODUCT_NOT_FOUND');
  }

  db.products.splice(pIndex, 1);
  writeDB(db);

  return respondSuccess(res, {}, 'Xóa sản phẩm thành công');
});

// GET /admin/orders
app.get('/api/v1/admin/orders', (req, res) => {
  const db = readDB();
  return respondSuccess(res, db.orders);
});

// GET /admin/orders/:id
app.get('/api/v1/admin/orders/:id', (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if (order) {
    return respondSuccess(res, order);
  }
  return respondError(res, 404, 'Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND');
});

// PATCH /admin/orders/:id/status
app.patch('/api/v1/admin/orders/:id/status', (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const order = db.orders.find(o => o.id === id);

  if (!order) {
    return respondError(res, 404, 'Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND');
  }

  const { status, paymentStatus } = req.body;
  const oldStatus = order.status;

  if (status && status !== oldStatus) {
    // 1. If moving to cancelled, restore stock
    if (status === 'cancelled') {
      order.items.forEach(item => {
        const p = db.products.find(prod => prod.id === item.productId);
        if (p) {
          p.stock += item.quantity;
          if (p.status === 'out_of_stock' && p.stock > 0) {
            p.status = 'active';
          }
          p.updatedAt = new Date().toISOString();
        }
      });
      order.cancelledAt = new Date().toISOString();
      
      // Deduct order totals from customer spent profile
      const cust = db.customers.find(c => c.phone === order.phone);
      if (cust) {
        cust.totalSpent = Math.max(0, cust.totalSpent - order.total);
        cust.orderCount = Math.max(0, cust.orderCount - 1);
      }
    }

    // 2. If moving away from cancelled back to pending/processing (rare but possible in admin), subtract stock again
    if (oldStatus === 'cancelled' && status !== 'cancelled') {
      // Validate stock
      for (const item of order.items) {
        const p = db.products.find(prod => prod.id === item.productId);
        if (p && p.stock < item.quantity) {
          return respondError(res, 400, `Sản phẩm ${p.name} không đủ tồn kho để khôi phục đơn hàng`, 'INSUFFICIENT_STOCK');
        }
      }
      // Deduct stock
      order.items.forEach(item => {
        const p = db.products.find(prod => prod.id === item.productId);
        if (p) {
          p.stock -= item.quantity;
          if (p.stock <= 0) {
            p.status = 'out_of_stock';
          }
          p.updatedAt = new Date().toISOString();
        }
      });
      
      // Re-add order totals to customer spent profile
      const cust = db.customers.find(c => c.phone === order.phone);
      if (cust) {
        cust.totalSpent += order.total;
        cust.orderCount += 1;
      }
    }

    // 3. Mark delivery timestamps
    if (status === 'delivered') {
      order.deliveredAt = new Date().toISOString();
      order.paymentStatus = 'paid'; // delivery COD implies paid
    }

    order.status = status;
  }

  if (paymentStatus) {
    order.paymentStatus = paymentStatus;
  }

  order.updatedAt = new Date().toISOString();
  writeDB(db);

  return respondSuccess(res, order, 'Cập nhật trạng thái đơn hàng thành công');
});

// GET /admin/customers
app.get('/api/v1/admin/customers', (req, res) => {
  const db = readDB();
  return respondSuccess(res, db.customers);
});

// GET /admin/settings
app.get('/api/v1/admin/settings', (req, res) => {
  const db = readDB();
  return respondSuccess(res, db.settings);
});

// PATCH /admin/settings
app.patch('/api/v1/admin/settings', (req, res) => {
  const db = readDB();
  db.settings = {
    ...db.settings,
    ...req.body
  };
  writeDB(db);
  return respondSuccess(res, db.settings, 'Cập nhật cài đặt hệ thống thành công');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Mock API Server is running on http://localhost:${PORT}`);
  console.log(`Healthcheck URL: http://localhost:${PORT}/api/v1/health`);
  // Initialize db on start
  readDB();
});
