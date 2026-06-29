import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ProductQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  q?: string; // Search keyword

  @IsOptional()
  @IsString()
  categoryId?: string; // Supports either numeric id or slug

  @IsOptional()
  @IsString()
  brandId?: string; // Supports either numeric id or slug

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMax?: number;

  @IsOptional()
  @IsString()
  sortBy?: string; // Backend alias, e.g. 'price_asc', 'newest'

  @IsOptional()
  @IsString()
  sort?: string; // Frontend alias, e.g. 'priceAsc', 'priceDesc'

  @IsOptional()
  @IsString()
  inStock?: string; // 'true' or 'false'

  @IsOptional()
  @IsString()
  hasPromo?: string; // 'true' or 'false'

  @IsOptional()
  @IsString()
  inverter?: string; // 'true' or 'false'

  @IsOptional()
  @IsString()
  capacity?: string; // e.g. '1 HP', '1.5 HP', '2 HP'
}
