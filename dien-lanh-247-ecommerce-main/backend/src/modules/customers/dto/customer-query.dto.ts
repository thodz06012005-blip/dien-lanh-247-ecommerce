import { IsOptional, IsString, IsEnum, Length } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CustomerQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @IsEnum(['name', 'email', 'phone', 'orderCount', 'totalSpent', 'createdAt'], {
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
