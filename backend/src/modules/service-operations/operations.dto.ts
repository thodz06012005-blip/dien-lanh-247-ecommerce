import { IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
export class SaveInspectionDto {
  @IsString() @MinLength(3) @MaxLength(2000) diagnosis: string;
  @IsNumber() @Min(0) labor: number;
  @IsNumber() @Min(0) parts: number;
  @IsNumber() @Min(0) travel: number;
  @IsNumber() @Min(0) other: number;
  @IsOptional() @IsString() validUntil?: string;
}
