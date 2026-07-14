import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const booleanTransform = ({ value }: { value: unknown }) => {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  return value;
};

export class ContentQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 12;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsIn(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: string;

  @IsOptional()
  @Transform(booleanTransform)
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Transform(booleanTransform)
  @IsBoolean()
  active?: boolean;
}

export class ContentPayloadDto {
  @IsOptional() @IsString() @MaxLength(191) title?: string;
  @IsOptional() @IsString() @MaxLength(191) name?: string;
  @IsOptional() @IsString() @MaxLength(191) slug?: string;
  @IsOptional() @IsString() @MaxLength(500) excerpt?: string;
  @IsOptional() @IsString() @MaxLength(500) summary?: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() warranty?: string;
  @IsOptional() pricing?: unknown;
  @IsOptional() process?: unknown;
  @IsOptional() faq?: unknown;
  @IsOptional() tasks?: unknown;
  @IsOptional() relatedServiceSlugs?: unknown;

  @IsOptional() @IsString() @MaxLength(191) serviceCategoryId?: string;
  @IsOptional() @Type(() => Number) @IsInt() categoryId?: number;
  @IsOptional() @Type(() => Number) @IsInt() authorId?: number;
  @IsOptional() @Type(() => Number) @IsInt() coverMediaId?: number;
  @IsOptional() @IsArray() mediaIds?: number[];
  @IsOptional() @IsArray() tagIds?: number[];

  @IsOptional() @IsString() @MaxLength(191) clientName?: string;
  @IsOptional() @IsString() @MaxLength(255) location?: string;
  @IsOptional() @IsDateString() startedAt?: string;
  @IsOptional() @IsDateString() completedAt?: string;
  @IsOptional() @IsString() result?: string;

  @IsOptional() @IsIn(['DRAFT', 'PUBLISHED', 'ARCHIVED']) status?: string;
  @IsOptional() @Transform(booleanTransform) @IsBoolean() isFeatured?: boolean;
  @IsOptional() @Transform(booleanTransform) @IsBoolean() isActive?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
  @IsOptional() @IsDateString() publishedAt?: string;

  @IsOptional() @IsString() @MaxLength(255) seoTitle?: string;
  @IsOptional() @IsString() @MaxLength(500) seoDescription?: string;
  @IsOptional() @IsUrl({ require_tld: false }) canonicalUrl?: string;

  @IsOptional() @IsUrl({ require_tld: false }) url?: string;
  @IsOptional() @IsString() @MaxLength(500) altText?: string;
  @IsOptional() @IsString() @MaxLength(120) mimeType?: string;
  @IsOptional() @Type(() => Number) @IsInt() width?: number;
  @IsOptional() @Type(() => Number) @IsInt() height?: number;
  @IsOptional() @Type(() => Number) @IsInt() sizeBytes?: number;
  @IsOptional() @IsString() @MaxLength(80) provider?: string;
  @IsOptional() @IsString() @MaxLength(255) publicId?: string;
  @IsOptional() @IsString() @MaxLength(255) folder?: string;
}
