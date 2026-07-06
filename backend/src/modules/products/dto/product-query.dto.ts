import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, Min, IsEnum, Length } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ProductQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Length(1, 100, { message: 'Từ khóa tìm kiếm có độ dài từ 1 đến 100 ký tự' })
  q?: string; // Search keyword

  @IsOptional()
  @IsString()
  categoryId?: string; // Supports either numeric id or slug

  @IsOptional()
  @IsString()
  brandId?: string; // Supports either numeric id or slug

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá tối thiểu phải là số' })
  @Min(0, { message: 'Giá tối thiểu phải lớn hơn hoặc bằng 0' })
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá tối đa phải là số' })
  @Min(0, { message: 'Giá tối đa phải lớn hơn hoặc bằng 0' })
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá tối thiểu phải là số' })
  @Min(0, { message: 'Giá tối thiểu phải lớn hơn hoặc bằng 0' })
  priceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá tối đa phải là số' })
  @Min(0, { message: 'Giá tối đa phải lớn hơn hoặc bằng 0' })
  priceMax?: number;

  @IsOptional()
  @IsString()
  @IsEnum(['name', 'sku', 'basePrice', 'salePrice', 'stock', 'status', 'createdAt', 'updatedAt', 'price_asc', 'price_desc', 'newest'], {
    message: 'Trường sắp xếp không hợp lệ'
  })
  sortBy?: string; // Backend alias, e.g. 'price_asc', 'newest'

  @IsOptional()
  @IsString()
  @IsEnum(['priceAsc', 'priceDesc', 'bestSeller', 'promoHot'], {
    message: 'Trường sắp xếp không hợp lệ'
  })
  sort?: string; // Frontend alias, e.g. 'priceAsc', 'priceDesc'

  @IsOptional()
  @IsString()
  @IsEnum(['true', 'false'], { message: 'inStock phải là true hoặc false' })
  inStock?: string; // 'true' or 'false'

  @IsOptional()
  @IsString()
  @IsEnum(['true', 'false'], { message: 'hasPromo phải là true hoặc false' })
  hasPromo?: string; // 'true' or 'false'

  @IsOptional()
  @IsString()
  @IsEnum(['true', 'false'], { message: 'inverter phải là true hoặc false' })
  inverter?: string; // 'true' or 'false'

  @IsOptional()
  @IsString()
  capacity?: string; // e.g. '1 HP', '1.5 HP', '2 HP'
}
