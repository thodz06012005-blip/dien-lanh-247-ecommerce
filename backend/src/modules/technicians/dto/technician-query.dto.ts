import { IsOptional, IsString, IsEnum, Length } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class TechnicianQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @IsEnum(['available', 'busy', 'inactive', 'AVAILABLE', 'BUSY', 'INACTIVE'], {
    message: 'Trạng thái hoạt động không hợp lệ'
  })
  status?: string;

  @IsOptional()
  @IsString()
  skill?: string;

  @IsOptional()
  @IsString()
  workingArea?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['name', 'phone', 'status', 'rating', 'currentJobs', 'createdAt', 'updatedAt'], {
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
