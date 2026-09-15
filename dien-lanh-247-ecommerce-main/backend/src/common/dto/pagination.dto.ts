import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Trang phải là số nguyên' })
  @Min(1, { message: 'Trang tối thiểu là 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Giới hạn số lượng phải là số nguyên' })
  @Min(1, { message: 'Giới hạn số lượng tối thiểu là 1' })
  @Max(100, { message: 'Giới hạn số lượng tối đa là 100' })
  limit?: number = 10;
}
