import { IsOptional, IsString, IsEnum, Length } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class OrderQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @IsEnum(['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED'], {
    message: 'Trạng thái đơn hàng không hợp lệ'
  })
  status?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['paid', 'unpaid', 'PAID', 'UNPAID'], {
    message: 'Trạng thái thanh toán không hợp lệ'
  })
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['code', 'customerName', 'phone', 'total', 'status', 'paymentStatus', 'createdAt', 'updatedAt'], {
    message: 'Trường sắp xếp không hợp lệ'
  })
  sortBy?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['asc', 'desc', 'ASC', 'DESC'], {
    message: 'Thứ tự sắp xếp chỉ nhận asc hoặc desc'
  })
  sortOrder?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100, { message: 'Từ khóa tìm kiếm có độ dài từ 1 đến 100 ký tự' })
  q?: string;
}
