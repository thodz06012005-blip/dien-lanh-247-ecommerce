import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { SERVICE_REQUEST_STATUSES } from '../service-request-workflow';

export class ServiceRequestQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @IsIn(SERVICE_REQUEST_STATUSES, { message: 'Trạng thái yêu cầu dịch vụ không hợp lệ' })
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(['low', 'medium', 'high', 'urgent'], { message: 'Độ ưu tiên không hợp lệ' })
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
  @IsIn(['all', 'new', 'unassigned', 'active', 'waiting-parts', 'overdue', 'warranty'], {
    message: 'Quick filter không hợp lệ',
  })
  quickFilter?: string;

  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'updatedAt', 'workflowStatus', 'priority', 'preferredDate', 'district', 'customerName'], {
    message: 'Trường sắp xếp không hợp lệ',
  })
  sortBy?: string;

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'], { message: 'Thứ tự sắp xếp chỉ nhận asc hoặc desc' })
  sortOrder?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100, { message: 'Từ khóa tìm kiếm có độ dài từ 1 đến 100 ký tự' })
  q?: string;
}
