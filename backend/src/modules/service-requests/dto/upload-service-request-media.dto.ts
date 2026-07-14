import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { SERVICE_REQUEST_MEDIA_STAGES } from '../service-request-workflow';

export class UploadServiceRequestMediaDto {
  @IsString()
  @IsIn(SERVICE_REQUEST_MEDIA_STAGES, { message: 'Giai đoạn hình ảnh không hợp lệ' })
  stage: string;

  @IsString()
  @IsOptional()
  @Matches(/^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/, { message: 'Số điện thoại không hợp lệ' })
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  caption?: string;
}
