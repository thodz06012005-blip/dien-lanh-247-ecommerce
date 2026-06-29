import { IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsNotEmpty({ message: 'Mã sản phẩm không được để trống' })
  productId: string | number;

  @IsNotEmpty({ message: 'Số lượng sản phẩm không được để trống' })
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  @IsNotEmpty({ message: 'Họ tên khách hàng không được để trống' })
  customerName: string;

  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  phone: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty({ message: 'Tỉnh/Thành phố không được để trống' })
  city: string;

  @IsString()
  @IsNotEmpty({ message: 'Quận/Huyện không được để trống' })
  district: string;

  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ chi tiết không được để trống' })
  addressDetail: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsNotEmpty({ message: 'Phương thức thanh toán không được để trống' })
  paymentMethod: string;

  @IsString()
  @IsOptional()
  voucherCode?: string;
}
