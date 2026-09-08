const DEFAULT_BUSINESS_CONFIG = {
  appliances: [
    { id: 'air-conditioner', name: 'Điều hòa', active: true, issues: ['Không mát', 'Rò nước', 'Không lên nguồn', 'Kêu to', 'Có mùi', 'Cần vệ sinh', 'Không rõ lỗi'], priceMin: 150000, priceMax: 650000 },
    { id: 'refrigerator', name: 'Tủ lạnh', active: true, issues: ['Không lạnh', 'Đóng tuyết', 'Chảy nước', 'Kêu to', 'Hỏng block', 'Không rõ lỗi'], priceMin: 250000, priceMax: 900000 },
    { id: 'washing-machine', name: 'Máy giặt', active: true, issues: ['Không vắt', 'Không xả nước', 'Rung mạnh', 'Không lên nguồn', 'Báo lỗi', 'Không rõ lỗi'], priceMin: 200000, priceMax: 750000 },
    { id: 'water-heater', name: 'Bình nóng lạnh', active: true, issues: ['Không nóng', 'Rò điện', 'Rò nước', 'Hỏng thanh đốt', 'Cần bảo dưỡng', 'Không rõ lỗi'], priceMin: 180000, priceMax: 600000 }
  ],
  serviceAreas: [
    { id: 'cau-giay', name: 'Quận Cầu Giấy', active: true, travelFee: 0 },
    { id: 'ba-dinh', name: 'Quận Ba Đình', active: true, travelFee: 0 },
    { id: 'dong-da', name: 'Quận Đống Đa', active: true, travelFee: 0 },
    { id: 'hai-ba-trung', name: 'Quận Hai Bà Trưng', active: true, travelFee: 30000 },
    { id: 'thanh-xuan', name: 'Quận Thanh Xuân', active: true, travelFee: 30000 }
  ],
  timeSlots: [
    { id: 'morning-1', label: '08:00 - 10:00', active: true },
    { id: 'morning-2', label: '10:00 - 12:00', active: true },
    { id: 'afternoon-1', label: '14:00 - 16:00', active: true },
    { id: 'afternoon-2', label: '16:00 - 18:00', active: true }
  ],
  pricing: {
    inspectionFee: 100000,
    emergencySurcharge: 100000,
    showPriceRanges: true,
    disclaimer: 'Mức giá chỉ để tham khảo. Chi phí thực tế phụ thuộc tình trạng, model và linh kiện; kỹ thuật viên sẽ thông báo để khách hàng đồng ý trước khi sửa.'
  },
  requestStatuses: [
    { id: 'pending', label: 'Mới tiếp nhận', color: 'amber', active: true },
    { id: 'confirmed', label: 'Đã xác nhận', color: 'blue', active: true },
    { id: 'assigned', label: 'Đã phân công thợ', color: 'indigo', active: true },
    { id: 'in_progress', label: 'Đang sửa chữa', color: 'cyan', active: true },
    { id: 'completed', label: 'Đã hoàn thành', color: 'green', active: true },
    { id: 'cancelled', label: 'Đã hủy', color: 'red', active: true }
  ],
  roles: [
    { id: 'owner', name: 'Chủ cửa hàng', description: 'Toàn quyền cấu hình, tài chính và nhân sự.' },
    { id: 'dispatcher', name: 'Điều phối viên', description: 'Tiếp nhận yêu cầu, xác nhận lịch và phân công thợ.' },
    { id: 'technician', name: 'Kỹ thuật viên', description: 'Nhận việc và cập nhật tiến độ công việc được giao.' }
  ],
  finance: {
    revenueRecognition: 'completed',
    technicianPayType: 'percentage',
    technicianPayRate: 40,
    includePartsInCommission: false
  }
};

module.exports = { DEFAULT_BUSINESS_CONFIG };
