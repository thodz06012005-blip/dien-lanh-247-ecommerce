import { IsOptional, IsEnum } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsEnum(['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'], {
    message: 'Trạng thái đơn hàng không hợp lệ'
  })
  @IsOptional()
  status?: string;

  @IsEnum(['paid', 'unpaid'], {
    message: 'Trạng thái thanh toán không hợp lệ'
  })
  @IsOptional()
  paymentStatus?: string;
}
