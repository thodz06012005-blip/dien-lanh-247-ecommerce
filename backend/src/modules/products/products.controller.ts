import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('products/search')
  search(@Query() query: ProductQueryDto) {
    return this.productsService.findAll({ q: query.q, limit: 10 });
  }

  @Get('products/featured')
  featured() {
    return this.productsService.findAll({ limit: 6 });
  }

  @Get('admin/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  findAllAdmin(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query, { includeInactive: true });
  }

  @Get('admin/products/:identifier')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  findOneAdmin(@Param('identifier') identifier: string) {
    return this.productsService.findOne(identifier, { includeInactive: true });
  }

  @Get('products')
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query, { includeInactive: false });
  }

  @Get('products/:identifier')
  findOne(@Param('identifier') identifier: string) {
    return this.productsService.findOne(identifier, { includeInactive: false });
  }

  @Post(['products', 'admin/products'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Patch(['products/:id', 'admin/products/:id'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(['products/:id', 'admin/products/:id'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
