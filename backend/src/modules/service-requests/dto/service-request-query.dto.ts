import { IsOptional, IsString, IsEnum, Length } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ServiceRequestQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @IsEnum(['pending', 'confirmed', 'assigned', 'completed', 'cancelled', 'PENDING', 'CONFIRMED', 'ASSIGNED', 'COMPLETED', 'CANCELLED'], {
    message: 'Trạng thái yêu cầu dịch vụ không hợp lệ'
  })
  status?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['low', 'medium', 'high', 'urgent', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
    message: 'Độ ưu tiên không hợp lệ'
  })
  priority?: string;

  @IsOptional()
  @IsString()
  serviceCategoryId?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  technicianId?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['createdAt', 'updatedAt', 'status', 'priority', 'scheduledAt', 'district', 'customerName'], {
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
