import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class LookupServiceRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã yêu cầu là bắt buộc' })
  @MaxLength(40)
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại là bắt buộc' })
  @Matches(/^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/, { message: 'Số điện thoại không hợp lệ' })
  phone: string;
}
