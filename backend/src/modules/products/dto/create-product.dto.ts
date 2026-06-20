import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  basePrice: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  brandId: number;
}
