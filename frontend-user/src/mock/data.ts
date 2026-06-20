export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  brandId: string;
  basePrice: number;
  salePrice?: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  inStock: boolean;
  quantity: number;
  rating: number;
  reviewCount: number;
  images: { url: string }[];
  description: string;
  specifications: Record<string, string>;
  features: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  productCount: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface Voucher {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  description: string;
}

export const categories: Category[] = [
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

export const brands: Brand[] = [
  { id: 'daikin', name: 'Daikin', slug: 'daikin' },
  { id: 'panasonic', name: 'Panasonic', slug: 'panasonic' },
  { id: 'toshiba', name: 'Toshiba', slug: 'toshiba' },
  { id: 'lg', name: 'LG', slug: 'lg' },
  { id: 'samsung', name: 'Samsung', slug: 'samsung' },
  { id: 'electrolux', name: 'Electrolux', slug: 'electrolux' },
  { id: 'casper', name: 'Casper', slug: 'casper' },
  { id: 'funiki', name: 'Funiki', slug: 'funiki' }
];

export const products: Product[] = [
  // 1. Điều hòa Daikin
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
    inStock: true,
    quantity: 18,
    rating: 4.8,
    reviewCount: 45,
    images: [
      { url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=600&auto=format&fit=crop' },
      { url: 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?q=80&w=600&auto=format&fit=crop' }
    ],
    description: 'Điều hòa Daikin FTKF25XVMV sở hữu thiết kế hiện đại, công nghệ luồng gió Coanda độc quyền giúp bảo vệ sức khỏe, cùng công nghệ tiết kiệm điện Inverter tiên tiến mang lại cảm giác dễ chịu và hóa đơn tiền điện thấp hơn.',
    specifications: {
      'Công suất lạnh': '1 HP (9.200 BTU)',
      'Phạm vi sử dụng': 'Dưới 15m² (từ 30 đến 45 m³)',
      'Công nghệ tiết kiệm điện': 'Inverter - Tiết kiệm điện năng vượt trội',
      'Loại Gas': 'R32 thân thiện môi trường',
      'Đặc điểm nổi bật': 'Luồng gió Coanda, phin lọc Enzyme Blue tích hợp PM2.5',
      'Xuất xứ': 'Việt Nam',
      'Năm ra mắt': '2023',
      'Bảo hành': 'Cục lạnh 1 năm, Máy nén 5 năm'
    },
    features: [
      'Công nghệ Inverter tiết kiệm điện tối ưu, vận hành cực kỳ êm ái',
      'Luồng gió Coanda tránh thổi trực tiếp vào cơ thể, bảo vệ sức khỏe cả nhà',
      'Phin lọc Enzyme Blue kết hợp lọc bụi mịn PM2.5 khử mùi diệt khuẩn',
      'Chức năng chống ẩm mốc giúp dàn lạnh luôn sạch sẽ khô ráo'
    ]
  },
  // 2. Điều hòa Panasonic
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
    inStock: true,
    quantity: 12,
    rating: 4.9,
    reviewCount: 32,
    images: [
      { url: 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?q=80&w=600&auto=format&fit=crop' },
      { url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=600&auto=format&fit=crop' }
    ],
    description: 'Dòng điều hòa cao cấp Panasonic XU9ZKH-8 tích hợp công nghệ Nanoe™ X thế hệ II lọc không khí sạch vượt trội suốt 24 giờ, kết hợp Inverter và Eco thông minh AI giúp tối đa hóa khả năng tiết kiệm điện năng.',
    specifications: {
      'Công suất lạnh': '1 HP (9.040 BTU)',
      'Phạm vi sử dụng': 'Dưới 15m²',
      'Công nghệ tiết kiệm điện': 'Inverter + ECO tích hợp AI',
      'Loại Gas': 'R32',
      'Lọc bụi': 'Nanoe-G (lọc bụi mịn PM2.5) & Nanoe™ X khử mùi diệt khuẩn',
      'Xuất xứ': 'Malaysia',
      'Năm ra mắt': '2023',
      'Bảo hành': 'Thân máy 1 năm, Máy nén 7 năm'
    },
    features: [
      'Công nghệ lọc không khí Nanoe™ X bảo vệ sức khỏe gia đình 24/7',
      'Chế độ Eco tích hợp AI cân bằng giữa tiết kiệm điện và làm lạnh dễ chịu',
      'Làm lạnh cực nhanh iAUTO-X với công nghệ Aerowings luồng gió xa hơn',
      'Kết nối Wi-Fi thông minh quản lý điều hòa trên ứng dụng điện thoại'
    ]
  },
  // 3. Tủ lạnh LG Side by Side
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
    inStock: true,
    quantity: 10,
    rating: 4.7,
    reviewCount: 28,
    images: [
      { url: 'https://images.unsplash.com/photo-1571175432290-ef713134d131?q=80&w=600&auto=format&fit=crop' },
      { url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop' }
    ],
    description: 'Tủ lạnh Side By Side LG GR-B256BL có thiết kế sang trọng bằng chất liệu thép không gỉ màu đen, dung tích lớn phù hợp cho gia đình từ 4-6 người. Tích hợp công nghệ Linear Inverter bền bỉ và làm lạnh đa chiều.',
    specifications: {
      'Dung tích sử dụng': '519 lít',
      'Ngăn đá': '185 lít',
      'Ngăn lạnh': '334 lít',
      'Kiểu tủ': 'Side By Side - Ngăn đá bên trái',
      'Công nghệ tiết kiệm điện': 'Smart Inverter',
      'Chất liệu cửa tủ': 'Kim loại sơn tĩnh điện',
      'Xuất xứ': 'Trung Quốc',
      'Bảo hành': 'Thiết bị 2 năm, Máy nén 10 năm'
    },
    features: [
      'Hệ thống làm lạnh đa chiều tỏa nhiệt đều đến mọi ngăn tủ',
      'Hệ thống khay kính chịu lực bền bỉ và ngăn rau củ giữ ẩm chuyên biệt',
      'Đèn LED chiếu sáng tiết kiệm điện và chống lóa mắt',
      'Thiết kế phẳng tinh tế, tôn lên vẻ sang trọng của căn bếp hiện đại'
    ]
  },
  // 4. Máy giặt LG cửa ngang
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
    inStock: true,
    quantity: 15,
    rating: 4.8,
    reviewCount: 67,
    images: [
      { url: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?q=80&w=600&auto=format&fit=crop' }
    ],
    description: 'Máy giặt cửa trước LG FV1410S4W sở hữu công nghệ cảm biến AI DD giúp bảo vệ sợi vải tốt hơn 18%. Chế độ giặt nhanh TurboWash™39 phút và công nghệ giặt hơi nước Steam diệt khuẩn tối ưu.',
    specifications: {
      'Khối lượng giặt': '10 Kg (Thích hợp cho gia đình trên 6 người)',
      'Kiểu động cơ': 'Truyền động trực tiếp bền bỉ & êm ái',
      'Tốc độ vắt tối đa': '1400 vòng/phút',
      'Công nghệ': 'AI DD, TurboWash 39, Giặt hơi nước Steam, EzDispense',
      'Hiệu suất năng lượng': 'Chỉ 20 Wh/kg',
      'Xuất xứ': 'Việt Nam',
      'Bảo hành': 'Máy 2 năm, Động cơ 10 năm'
    },
    features: [
      'Công nghệ trí tuệ nhân tạo AI DD tự động phát hiện độ mềm và khối lượng vải',
      'Giặt nhanh TurboWash™39 giúp rút ngắn thời gian mà vẫn đảm bảo quần áo sạch bóng',
      'Giặt hơi nước Steam diệt khuẩn và loại bỏ các tác nhân gây dị ứng da',
      'Dễ dàng thêm đồ giặt khi đang hoạt động thông qua nút Add Item'
    ]
  },
  // 5. Bình nóng lạnh Ariston
  {
    id: 'bnl-ariston-vitaly20',
    name: 'Bình nóng lạnh Ariston Vitaly 20 Slim 20 Lít',
    slug: 'binh-nong-lanh-ariston-vitaly-20-slim-20-lit',
    sku: 'VITALY20SLIM',
    categoryId: 'binh-nong-lanh',
    brandId: 'funiki', // using funiki for domestic category mapping or local brand
    basePrice: 3200000,
    salePrice: 2490000,
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: false,
    inStock: true,
    quantity: 25,
    rating: 4.6,
    reviewCount: 19,
    images: [
      { url: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=600&auto=format&fit=crop' }
    ],
    description: 'Bình nóng lạnh Ariston Vitaly 20 Slim sở hữu thiết kế thanh mảnh hiện đại, công nghệ bình chứa tráng men Titan siêu bền, hệ thống an toàn đồng bộ TSS bảo vệ an toàn tối đa cho người dùng.',
    specifications: {
      'Dung tích': '20 Lít',
      'Công suất định mức': '2500 W',
      'Thanh đốt': 'Bằng đồng 100% làm nóng nhanh',
      'Hệ thống an toàn': 'Cầu dao chống giật ELCB, Bộ cảm biến nhiệt TBSE',
      'Kích thước': '704 x 282 x 301 mm',
      'Xuất xứ': 'Việt Nam',
      'Bảo hành': 'Bình chứa 7 năm, phụ kiện 2 năm'
    },
    features: [
      'Thiết kế kiểu dáng Slim nằm ngang tiết kiệm không gian phòng tắm',
      'Thanh đốt đồng nguyên chất làm nóng cực nhanh, độ bền vượt trội',
      'Lòng bình tráng men Titan tránh rò rỉ nước từ bên trong',
      'Hệ thống TSS tích hợp cầu dao ELCB bảo vệ chống giật điện cực tốt'
    ]
  },
  // 6. Máy lọc không khí Sharp
  {
    id: 'mlkk-sharp-fpjm30ev',
    name: 'Máy lọc không khí bắt muỗi Sharp FP-JM30E-B 23m²',
    slug: 'may-loc-khong-khi-bat-muoi-sharp-fp-jm30e-b',
    sku: 'FP-JM30E-B',
    categoryId: 'may-loc-khong-khi',
    brandId: 'toshiba', // generic mapping for mock
    basePrice: 4890000,
    salePrice: 3850000,
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true,
    inStock: true,
    quantity: 14,
    rating: 4.5,
    reviewCount: 11,
    images: [
      { url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=600&auto=format&fit=crop' } // air filtration image
    ],
    description: 'Máy lọc không khí Sharp FP-JM30E-B kết hợp 2 tính năng trong 1: Lọc sạch không khí bụi mịn PM2.5 bằng màng lọc HEPA cao cấp và bắt muỗi vật lý không chất độc hại bằng đèn UV.',
    specifications: {
      'Diện tích khuyên dùng': 'Dưới 23 m²',
      'Bộ lọc': 'Màng lọc thô, Màng lọc HEPA khử mùi diệt khuẩn',
      'Công nghệ ion': 'Plasmacluster Ion giải phóng mật độ 7000 hạt/cm³',
      'Chức năng bắt muỗi': 'Đèn UV dụ muỗi và tấm keo dính',
      'Độ ồn': 'từ 27 đến 44 dB',
      'Xuất xứ': 'Thái Lan',
      'Bảo hành': '12 tháng chính hãng'
    },
    features: [
      'Công nghệ Plasmacluster Ion độc quyền diệt vi khuẩn, nấm mốc và tác nhân dị ứng',
      'Màng lọc HEPA cao cấp loại bỏ 99.97% bụi mịn kích thước nhỏ đến 0.3 micromet',
      'Đèn UV dụ muỗi thông minh cùng luồng khí hút muỗi vào tấm keo không độc hại',
      'Chế độ Haze tự động điều chỉnh tốc độ quạt tối ưu cho không khí trong phòng'
    ]
  },
  // 7. Máy sấy quần áo Electrolux
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
    inStock: true,
    quantity: 8,
    rating: 4.8,
    reviewCount: 15,
    images: [
      { url: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?q=80&w=600&auto=format&fit=crop' }
    ],
    description: 'Máy sấy quần áo Electrolux EDS854N3SB với công nghệ sấy đảo chiều ReverseTumbling giúp áo quần giảm nhăn đến 32% và cảm biến thông minh SmartSensors tự động đo độ ẩm để điều chỉnh thời gian sấy phù hợp.',
    specifications: {
      'Khối lượng sấy': '8.5 Kg',
      'Loại máy sấy': 'Sấy thông hơi',
      'Công nghệ sấy': 'Đảo chiều giảm nhăn, Cảm biến độ ẩm thông minh',
      'Nhiệt độ sấy tối đa': '70°C bảo vệ vải',
      'Xuất xứ': 'Thái Lan',
      'Bảo hành': '2 năm toàn máy, Động cơ 10 năm'
    },
    features: [
      'Sấy đảo chiều ReverseTumbling liên tục giúp quần áo không xoắn rối và giảm nhăn tốt',
      'Cảm biến độ ẩm SmartSensors tránh sấy quá khô làm hư tổn cấu trúc sợi vải',
      'Hẹn giờ sấy linh hoạt và chế độ sấy nhanh tiện lợi cho cuộc sống bận rộn',
      'Bộ lọc xơ vải 2 lớp dễ dàng tháo rời và vệ sinh định kỳ'
    ]
  },
  // 8. Tủ đông Sanaky
  {
    id: 'td-sanaky-vh2599a1',
    name: 'Tủ đông Sanaky 208 Lít VH-2599A1 một ngăn đông',
    slug: 'tu-dong-sanaky-208-lit-vh-2599a1',
    sku: 'VH-2599A1',
    categoryId: 'tu-dong',
    brandId: 'funiki', // mock mapped
    basePrice: 7500000,
    salePrice: 6290000,
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    inStock: true,
    quantity: 11,
    rating: 4.6,
    reviewCount: 22,
    images: [
      { url: 'https://images.unsplash.com/photo-1571175432290-ef713134d131?q=80&w=600&auto=format&fit=crop' }
    ],
    description: 'Tủ đông Sanaky VH-2599A1 dung tích sử dụng 208 Lít, lòng tủ làm từ hợp kim nhôm, trang bị dàn lạnh đồng nguyên chất làm lạnh nhanh sâu, giữ thực phẩm tươi ngon lâu ngày.',
    specifications: {
      'Dung tích tổng': '250 Lít',
      'Dung tích sử dụng': '208 Lít',
      'Số ngăn': '1 ngăn đông chuyên biệt',
      'Dàn lạnh': 'Bằng đồng nguyên chất 100%',
      'Nhiệt độ ngăn đông': '≤ -18°C',
      'Xuất xứ': 'Việt Nam',
      'Bảo hành': '24 tháng toàn bộ máy'
    },
    features: [
      'Dàn lạnh đồng nguyên chất giúp tủ truyền nhiệt nhanh hơn, giữ nhiệt lâu và tiết kiệm điện',
      'Lòng tủ bằng nhôm sơn tĩnh điện phẳng phẳng dễ lau dọn vệ sinh hàng ngày',
      'Bảng điều khiển nhiệt độ nằm bên ngoài thân tủ dễ thao tác điều chỉnh',
      'Thiết kế bánh xe chịu lực tốt dễ di chuyển đặt để ở mọi không gian kinh doanh'
    ]
  },
  // 9. Linh kiện Block Điều hòa Daikin 1HP
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
    inStock: true,
    quantity: 30,
    rating: 4.7,
    reviewCount: 14,
    images: [
      { url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop' }
    ],
    description: 'Block máy nén điều hòa Daikin 1 HP sử dụng gas R32, hàng chính hãng tháo máy hoặc mới nguyên hộp, hoạt động bền bỉ, êm ái, lắp đặt đồng bộ hiệu năng cao.',
    specifications: {
      'Tương thích': 'Các dòng điều hòa Daikin 1 HP (9.000 BTU) dùng gas R32',
      'Công suất': '1 HP (Máy nén rô-to cuộn)',
      'Loại Gas': 'R32',
      'Xuất xứ': 'Thái Lan',
      'Tình trạng': 'Mới 100% nguyên đai nguyên kiện',
      'Bảo hành': '6 tháng (lên tới 12 tháng nếu sử dụng dịch vụ thay của Điện Lạnh 247)'
    },
    features: [
      'Máy nén chính hãng Daikin đảm bảo hiệu suất nén cao và tiết kiệm điện năng',
      'Vận hành cực êm ái ít tiếng ồn khó chịu',
      'Độ bền vật liệu cao, chống ăn mòn và quá tải tốt'
    ]
  },
  // 10. Linh kiện Điều khiển Điều hòa Daikin
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
    inStock: true,
    quantity: 120,
    rating: 4.5,
    reviewCount: 88,
    images: [
      { url: 'https://images.unsplash.com/photo-1595787143151-e601da948ea8?q=80&w=600&auto=format&fit=crop' }
    ],
    description: 'Điều khiển điều hòa Daikin dùng cho các dòng máy lạnh Inverter 1 chiều và 2 chiều chính hãng hoặc tương đương, chất liệu nhựa ABS cao cấp, phím bấm nhạy nảy, màn hình hiển thị sắc nét.',
    specifications: {
      'Chất liệu': 'Nhựa ABS cao cấp chống va đập tốt',
      'Nguồn cấp': '2 Pin AAA',
      'Khoảng cách nhận tín hiệu': 'Lên tới 8m',
      'Tương thích': 'Hầu hết các dòng điều hòa treo tường Daikin Inverter từ 2015-2023',
      'Bảo hành': '3 tháng lỗi 1 đổi 1'
    },
    features: [
      'Phím bấm cao su cao cấp độ nảy tốt, chữ in rõ nét không phai màu',
      'Màn hình LCD hiển thị đầy đủ nhiệt độ, chế độ gió, chế độ vẩy cánh',
      'Nhỏ gọn cầm chắc tay, tiết kiệm pin'
    ]
  },
  // 11. Dịch vụ bảo dưỡng điều hòa treo tường
  {
    id: 'dv-bao-duong-dh',
    name: 'Dịch vụ bảo dưỡng vệ sinh điều hòa treo tường tiêu chuẩn',
    slug: 'dich-vu-bao-duong-ve-sinh-dieu-hoa-treo-tuong',
    sku: 'DV-BD-DH',
    categoryId: 'dich-vu',
    brandId: 'funiki', // general domestic
    basePrice: 250000,
    salePrice: 199000,
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    inStock: true,
    quantity: 999,
    rating: 4.9,
    reviewCount: 230,
    images: [
      { url: 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?q=80&w=600&auto=format&fit=crop' }
    ],
    description: 'Dịch vụ vệ sinh xịt rửa bảo dưỡng điều hòa treo tường (9.000 BTU - 24.000 BTU) trọn gói. Đội ngũ kỹ thuật viên giàu kinh nghiệm, chuyên nghiệp, bảo hành chảy nước và gas sau khi vệ sinh 1 tháng.',
    specifications: {
      'Thời gian thực hiện': '45 - 60 phút / máy',
      'Phạm vi dịch vụ': 'Nội thành Hà Nội & TP. Hồ Chí Minh',
      'Quy trình thực hiện': 'Đo gas dòng điện -> Xịt rửa cục nóng lạnh -> Vệ sinh phin lọc -> Thông đường thoát nước -> Nghiệm thu kiểm tra',
      'Bảo hành chất lượng': '1 tháng cho lỗi chảy nước dàn lạnh',
      'Hỗ trợ kỹ thuật': 'Có mặt trong vòng 2 giờ kể từ khi đặt lịch'
    },
    features: [
      'Xịt rửa sạch sâu dàn lạnh và dàn nóng bằng máy bơm áp lực cao',
      'Kiểm tra miễn phí lượng gas hiện tại và độ ổn định của block, quạt gió',
      'Kỹ thuật viên Điện Lạnh 247 được đào tạo bài bản, trung thực, không vẽ bệnh',
      'Có hóa đơn VAT và phiếu nghiệm thu rõ ràng'
    ]
  },
  // 12. Điều hòa Daikin 1.5 HP
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
    inStock: true,
    quantity: 14,
    rating: 4.8,
    reviewCount: 22,
    images: [
      { url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=600&auto=format&fit=crop' }
    ],
    description: 'Điều hòa Daikin FTKF35XVMV công suất 1.5 HP thích hợp cho phòng khách hoặc phòng ngủ lớn từ 15-20m². Công nghệ Inverter tiết kiệm điện tối ưu, phin lọc Enzyme Blue bảo vệ sức khỏe hệ hô hấp.',
    specifications: {
      'Công suất lạnh': '1.5 HP (11.900 BTU)',
      'Phạm vi sử dụng': 'Từ 15 đến 20m² (từ 40 đến 60 m³)',
      'Công nghệ tiết kiệm điện': 'Inverter',
      'Loại Gas': 'R32',
      'Xuất xứ': 'Việt Nam',
      'Bảo hành': 'Cục lạnh 1 năm, Máy nén 5 năm'
    },
    features: [
      'Công suất làm lạnh mạnh mẽ cho căn phòng rộng trung bình',
      'Luồng gió thoải mái Coanda phân phối gió mát đều khắp phòng',
      'Phin lọc bụi mịn PM2.5 bảo vệ bầu không khí trong lành',
      'Bo mạch bảo vệ quá áp chống sốc điện bảo vệ dàn nóng tối ưu'
    ]
  },
  // 13. Tủ lạnh Panasonic 2 cánh
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
    inStock: true,
    quantity: 16,
    rating: 4.7,
    reviewCount: 38,
    images: [
      { url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop' }
    ],
    description: 'Tủ lạnh NR-BA221QSKV dung tích 188 lít, trang bị công nghệ tiết kiệm điện thông minh Econavi kết hợp Inverter, công nghệ kháng khuẩn Ag Clean bằng các tinh thể bạc Ag+ khử mùi tối ưu.',
    specifications: {
      'Dung tích sử dụng': '188 Lít',
      'Ngăn đá': '53 Lít',
      'Ngăn lạnh': '135 Lít',
      'Kiểu tủ': 'Ngăn đá trên, 2 cánh',
      'Công nghệ': 'Inverter + Cảm biến thông minh Econavi',
      'Kháng khuẩn khử mùi': 'Ag Clean (Tinh thể bạc Ag+)',
      'Xuất xứ': 'Việt Nam',
      'Bảo hành': 'Tủ 2 năm, Máy nén 12 năm'
    },
    features: [
      'Cảm biến thông minh Econavi tự động điều chỉnh tốc độ máy nén theo thói quen đóng mở tủ',
      'Hệ thống Ag Clean kháng khuẩn khử mùi thực phẩm hôi tanh cực hiệu quả',
      'Ngăn rau củ Fresh Safe giữ ẩm tối đa cho rau củ quả luôn căng mọng',
      'Khay đá di động tiện lợi giúp thay đổi cách sắp xếp ngăn đông'
    ]
  },
  // 14. Máy giặt Samsung 9kg cửa ngang
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
    inStock: true,
    quantity: 11,
    rating: 4.4,
    reviewCount: 19,
    images: [
      { url: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?q=80&w=600&auto=format&fit=crop' }
    ],
    description: 'Máy giặt Samsung WW90T3040WW giá tốt, tích hợp động cơ Digital Inverter tiết kiệm điện năng vận hành êm ái, chương trình giặt nước nóng Hot Wash diệt khuẩn loại bỏ tác nhân dị ứng.',
    specifications: {
      'Khối lượng giặt': '9 Kg',
      'Động cơ': 'Digital Inverter nam châm vĩnh cửu giảm ma sát',
      'Tốc độ vắt': '1400 vòng/phút',
      'Công nghệ': 'Hot Wash nước nóng, Quick Wash giặt nhanh 18 phút, Drum Clean tự vệ sinh lồng giặt',
      'Xuất xứ': 'Trung Quốc',
      'Bảo hành': '2 năm chính hãng, động cơ 11 năm'
    },
    features: [
      'Động cơ Digital Inverter hoạt động êm ái hơn và bền bỉ hơn 20 năm',
      'Chế độ giặt nhanh Quick Wash giặt sạch đồ bẩn nhẹ chỉ trong 18 phút',
      'Hẹn giờ kết thúc trì hoãn tiện lợi tránh để lâu đồ ướt trong lồng gây ẩm mốc',
      'Màn hình hiển thị LED sắc nét rõ ràng nút xoay điều khiển chương trình dễ dàng'
    ]
  },
  // 15. Máy lọc không khí Xiaomi
  {
    id: 'mlkk-xiaomi-4lite',
    name: 'Máy lọc không khí Xiaomi Smart Air Purifier 4 Lite',
    slug: 'may-loc-khong-khi-xiaomi-smart-air-purifier-4-lite',
    sku: 'XMI-AP4-LITE',
    categoryId: 'may-loc-khong-khi',
    brandId: 'samsung', // generic mapping for mockup
    basePrice: 3990000,
    salePrice: 2890000,
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    inStock: true,
    quantity: 20,
    rating: 4.7,
    reviewCount: 145,
    images: [
      { url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=600&auto=format&fit=crop' }
    ],
    description: 'Máy lọc không khí Xiaomi 4 Lite thiết kế hình hộp vuông vắn sang trọng, màn hình OLED cảm ứng hiển thị chất lượng không khí, màng lọc 3 lớp hiệu suất cao lọc sạch đến 99.97% hạt bụi PM2.5.',
    specifications: {
      'Diện tích khuyên dùng': 'Từ 25 đến 43 m²',
      'Tỉ lệ lọc sạch bụi': '360 m³/h (CADR Particles)',
      'Bộ lọc': 'Màng lọc thô + Màng lọc HEPA của Xiaomi + Màng lọc than hoạt tính chất lượng cao',
      'Đồ ồn khi hoạt động': 'Từ 33.4 đến 61 dB',
      'Kết nối app': 'App Mi Home qua Wi-Fi điều khiển từ xa, hỗ trợ Alexa & Google Assistant',
      'Xuất xứ': 'Trung Quốc',
      'Bảo hành': '12 tháng chính hãng'
    },
    features: [
      'Lọc sạch 99.97% hạt bụi mịn nhỏ 0.3 micromet, phấn hoa, lông thú nuôi',
      'Màn hình hiển thị chỉ số bụi PM2.5 theo thời gian thực và vòng màu chất lượng không khí',
      'Kết nối thông minh ứng dụng di động điều khiển bật tắt từ xa, khóa trẻ em, đổi chế độ',
      'Chế độ ban đêm siêu êm ái tiếng ồn nhỏ không ảnh hưởng giấc ngủ trẻ thơ'
    ]
  }
];

export const vouchers: Voucher[] = [
  {
    code: 'DIENLANH247',
    discountType: 'percentage',
    value: 10, // 10%
    minOrderValue: 2000000, // Min 2M VND
    maxDiscount: 1000000, // Max discount 1M VND
    description: 'Giảm ngay 10% tối đa 1.000.000đ cho đơn hàng điện lạnh từ 2.000.000đ'
  },
  {
    code: 'GIAM50K',
    discountType: 'fixed',
    value: 50000,
    minOrderValue: 200000,
    description: 'Giảm ngay 50.000đ cho đơn hàng dịch vụ/phụ kiện từ 200.000đ'
  },
  {
    code: 'MIENPHIYENTAM',
    discountType: 'percentage',
    value: 100,
    minOrderValue: 5000000,
    maxDiscount: 200000,
    description: 'Giảm 200.000đ chi phí vận chuyển & lắp đặt cho đơn máy giặt/tủ lạnh lớn'
  }
];

export interface Review {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  content: string;
  productName: string;
  date: string;
}

export const reviews: Review[] = [
  {
    id: 'rv-1',
    name: 'Nguyễn Văn Nam',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
    rating: 5,
    content: 'Mình đặt dịch vụ bảo dưỡng điều hòa lúc sáng mà trưa thợ đã có mặt làm rất sạch sẽ, nhanh gọn. Giá cả đúng như niêm yết không thu thêm phí phụ.',
    productName: 'Dịch vụ bảo dưỡng vệ sinh điều hòa treo tường tiêu chuẩn',
    date: '15/06/2026'
  },
  {
    id: 'rv-2',
    name: 'Trần Thị Hoa',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
    rating: 5,
    content: 'Máy giặt dùng rất êm, giặt quần áo sạch và không bị nhăn nhiều. Giao hàng lắp đặt nhanh trong ngày, nhân viên tư vấn nhiệt tình.',
    productName: 'Máy giặt LG AI DD Inverter 10 Kg FV1410S4W',
    date: '10/06/2026'
  },
  {
    id: 'rv-3',
    name: 'Lê Hoàng Hải',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150&auto=format&fit=crop',
    rating: 4,
    content: 'Điều hòa Daikin làm lạnh nhanh, luồng gió thổi rất dễ chịu không bị buốt đầu. Chế độ Inverter tiết kiệm điện thấy rõ trên hóa đơn tháng này.',
    productName: 'Điều hòa Daikin Inverter 1 HP FTKF25XVMV',
    date: '05/06/2026'
  }
];

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  addressDetail: string;
  note?: string;
  paymentMethod: string;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipping' | 'completed' | 'cancelled';
  items: OrderItem[];
  createdAt: string;
}

export const initialOrders: Order[] = [
  {
    id: 'DL247-849204',
    customerName: 'Nguyễn Văn Nam',
    phone: '0987654321',
    email: 'nam.nv@gmail.com',
    city: 'Hà Nội',
    district: 'Quận Cầu Giấy',
    addressDetail: 'Số 12 Ngõ 34 Trần Thái Tông',
    paymentMethod: 'cod',
    shippingFee: 30000,
    discountAmount: 50000,
    totalAmount: 179000,
    status: 'completed',
    items: [
      {
        productId: 'dv-bao-duong-dh',
        name: 'Dịch vụ bảo dưỡng vệ sinh điều hòa treo tường tiêu chuẩn',
        sku: 'DV-BD-DH',
        price: 199000,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?q=80&w=200&auto=format&fit=crop'
      }
    ],
    createdAt: '15/06/2026 09:12'
  },
  {
    id: 'DL247-920485',
    customerName: 'Nguyễn Văn Nam',
    phone: '0987654321',
    email: 'nam.nv@gmail.com',
    city: 'Hà Nội',
    district: 'Quận Cầu Giấy',
    addressDetail: 'Số 12 Ngõ 34 Trần Thái Tông',
    paymentMethod: 'cod',
    shippingFee: 150000,
    discountAmount: 1000000,
    totalAmount: 9640000,
    status: 'processing',
    items: [
      {
        productId: 'dh-daikin-ftkf25xvmv',
        name: 'Điều hòa Daikin Inverter 1 HP FTKF25XVMV',
        sku: 'FTKF25XVMV',
        price: 10490000,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=200&auto=format&fit=crop'
      }
    ],
    createdAt: '18/06/2026 14:30'
  }
];
