import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Token đặt lại mật khẩu là bắt buộc' })
  @MaxLength(256)
  token: string;

  @IsString()
  @MinLength(10, { message: 'Mật khẩu phải có ít nhất 10 ký tự' })
  @MaxLength(128)
  newPassword: string;
}

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty({ message: 'Token xác minh email là bắt buộc' })
  @MaxLength(256)
  token: string;
}
