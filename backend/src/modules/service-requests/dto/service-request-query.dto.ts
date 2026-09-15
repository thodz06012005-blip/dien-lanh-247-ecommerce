import { IsOptional, IsString, IsEnum, Length, IsDateString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ServiceRequestQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @IsEnum(['pending', 'confirmed', 'assigned', 'in_progress', 'waiting_customer_approval', 'completed', 'cancelled', 'PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_CUSTOMER_APPROVAL', 'COMPLETED', 'CANCELLED'], {
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
  areaId?: string;

  @IsOptional()
  @IsString()
  technicianId?: string;

  @IsOptional()
  @IsString()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsString()
  @IsDateString()
  createdTo?: string;

  @IsOptional()
  @IsDateString()
  scheduledFrom?: string;

  @IsOptional()
  @IsDateString()
  scheduledTo?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['createdAt', 'updatedAt', 'status', 'priority', 'preferredDate', 'district', 'customerName'], {
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
