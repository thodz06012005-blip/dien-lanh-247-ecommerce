import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe, Req } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { AuditLogService } from '../audit/audit-log.service';

@Controller()
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly auditLogService: AuditLogService,
  ) {}

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
  async create(@Body() createProductDto: CreateProductDto, @Req() req: Request) {
    const result = await this.productsService.create(createProductDto);
    this.auditLogService.auditSuccess(req, 'PRODUCT_CREATED', 'product', String(result.data.id), { name: result.data.name }, 'Product created successfully');
    return result;
  }

  @Patch(['products/:id', 'admin/products/:id'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateProductDto: UpdateProductDto, @Req() req: Request) {
    const result = await this.productsService.update(id, updateProductDto);
    this.auditLogService.auditSuccess(req, 'PRODUCT_UPDATED', 'product', String(result.data.id), { name: result.data.name }, 'Product updated successfully');
    return result;
  }

  @Delete(['products/:id', 'admin/products/:id'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const result = await this.productsService.remove(id);
    this.auditLogService.auditSuccess(req, 'PRODUCT_DELETED', 'product', String(id), { id }, 'Product deleted successfully');
    return result;
  }
}
