import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @MaxLength(191)
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(10, { message: 'Mật khẩu phải có ít nhất 10 ký tự' })
  @MaxLength(128)
  @Matches(/[a-z]/, { message: 'Mật khẩu phải có ít nhất một chữ thường' })
  @Matches(/[A-Z]/, { message: 'Mật khẩu phải có ít nhất một chữ hoa' })
  @Matches(/[0-9]/, { message: 'Mật khẩu phải có ít nhất một chữ số' })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/, {
    message: 'Số điện thoại Việt Nam không hợp lệ',
  })
  phone?: string;
}
