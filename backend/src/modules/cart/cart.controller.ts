import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: any) {
    return this.cartService.getCart(user.userId);
  }

  @Post('items')
  addToCart(@CurrentUser() user: any, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(user.userId, addToCartDto);
  }

  @Patch('items/:itemId')
  updateItem(
    @CurrentUser() user: any,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.userId, itemId, updateCartItemDto);
  }

  @Delete('items/:itemId')
  removeItem(
    @CurrentUser() user: any,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.cartService.removeItem(user.userId, itemId);
  }
}
