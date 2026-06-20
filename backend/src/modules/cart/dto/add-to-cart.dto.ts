import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class AddToCartDto {
  @IsInt()
  @IsNotEmpty()
  variantId: number;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity: number;
}
