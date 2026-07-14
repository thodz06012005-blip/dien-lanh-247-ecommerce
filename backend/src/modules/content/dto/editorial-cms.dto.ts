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

const asBoolean = ({ value }: { value: unknown }) => {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  return value;
};

export class EditorialQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
  @IsOptional() @IsString() @MaxLength(160) q?: string;
  @IsOptional() @IsIn(['DRAFT', 'PUBLISHED', 'ARCHIVED']) status?: string;
  @IsOptional() @Transform(asBoolean) @IsBoolean() active?: boolean;
  @IsOptional() @Transform(asBoolean) @IsBoolean() featured?: boolean;
  @IsOptional() @Transform(asBoolean) @IsBoolean() includeDeleted?: boolean;
  @IsOptional() @IsString() @MaxLength(120) placement?: string;
}

export class EditorialPayloadDto {
  @IsOptional() @IsString() @MaxLength(191) title?: string;
  @IsOptional() @IsString() @MaxLength(191) name?: string;
  @IsOptional() @IsString() @MaxLength(191) displayName?: string;
  @IsOptional() @IsString() @MaxLength(191) customerName?: string;
  @IsOptional() @IsString() @MaxLength(191) slug?: string;
  @IsOptional() @IsString() @MaxLength(120) sectionKey?: string;
  @IsOptional() @IsString() @MaxLength(120) placement?: string;
  @IsOptional() @IsString() @MaxLength(40) theme?: string;
  @IsOptional() @IsString() @MaxLength(191) eyebrow?: string;
  @IsOptional() @IsString() @MaxLength(500) excerpt?: string;
  @IsOptional() @IsString() @MaxLength(500) summary?: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() warranty?: string;
  @IsOptional() @IsString() quote?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() result?: string;

  @IsOptional() pricing?: unknown;
  @IsOptional() process?: unknown;
  @IsOptional() faq?: unknown;
  @IsOptional() tasks?: unknown;
  @IsOptional() config?: unknown;
  @IsOptional() socialLinks?: unknown;
  @IsOptional() relatedServiceSlugs?: unknown;

  @IsOptional() @IsString() @MaxLength(191) serviceCategoryId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) categoryId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) authorId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) userId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) serviceId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) coverMediaId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) socialImageMediaId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) desktopMediaId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) mobileMediaId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) logoMediaId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) avatarMediaId?: number;
  @IsOptional() @IsArray() mediaIds?: number[];
  @IsOptional() @IsArray() tagIds?: number[];

  @IsOptional() @IsString() @MaxLength(191) clientName?: string;
  @IsOptional() @IsString() @MaxLength(255) location?: string;
  @IsOptional() @IsString() @MaxLength(191) customerTitle?: string;
  @IsOptional() @IsString() @MaxLength(191) company?: string;
  @IsOptional() @IsString() @MaxLength(191) roleTitle?: string;
  @IsOptional() @IsDateString() startedAt?: string;
  @IsOptional() @IsDateString() completedAt?: string;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;

  @IsOptional() @IsIn(['DRAFT', 'PUBLISHED', 'ARCHIVED']) status?: string;
  @IsOptional() @Transform(asBoolean) @IsBoolean() isFeatured?: boolean;
  @IsOptional() @Transform(asBoolean) @IsBoolean() isActive?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) rating?: number;
  @IsOptional() @IsDateString() publishedAt?: string;

  @IsOptional() @IsString() @MaxLength(255) seoTitle?: string;
  @IsOptional() @IsString() @MaxLength(500) seoDescription?: string;
  @IsOptional() @IsUrl({ require_tld: false }) canonicalUrl?: string;

  @IsOptional() @IsString() @MaxLength(120) ctaLabel?: string;
  @IsOptional() @IsUrl({ require_tld: false }) ctaUrl?: string;
  @IsOptional() @IsString() @MaxLength(120) secondaryCtaLabel?: string;
  @IsOptional() @IsUrl({ require_tld: false }) secondaryCtaUrl?: string;
  @IsOptional() @IsUrl({ require_tld: false }) websiteUrl?: string;

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

export class PublishContentDto {
  @IsOptional() @IsDateString() publishedAt?: string;
  @IsOptional() @IsString() @MaxLength(500) summary?: string;
}

export class RevisionQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}

export class MediaMetadataDto {
  @IsOptional() @IsString() @MaxLength(191) name?: string;
  @IsOptional() @IsString() @MaxLength(500) altText?: string;
  @IsOptional() @IsString() @MaxLength(255) folder?: string;
}
