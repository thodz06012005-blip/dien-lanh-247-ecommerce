import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateAdminProfileDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName: string;

  @IsOptional()
  @IsString()
  @Matches(/^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/, { message: 'Số điện thoại Việt Nam không hợp lệ' })
  phone?: string;
}

export class ChangeAdminPasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(/[a-z]/, { message: 'Mật khẩu phải có chữ thường' })
  @Matches(/[A-Z]/, { message: 'Mật khẩu phải có chữ hoa' })
  @Matches(/\d/, { message: 'Mật khẩu phải có chữ số' })
  newPassword: string;
}
