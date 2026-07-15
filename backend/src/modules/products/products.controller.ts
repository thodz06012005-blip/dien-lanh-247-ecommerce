import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { ADMIN_PERMISSIONS } from '../../common/auth/admin-permissions';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogService } from '../audit/audit-log.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

const PUBLIC_LIST_CACHE = 'public, max-age=60, s-maxage=300, stale-while-revalidate=600';
const PUBLIC_DETAIL_CACHE = 'public, max-age=300, s-maxage=900, stale-while-revalidate=1800';

@Controller()
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get('products/search')
  @Header('Cache-Control', PUBLIC_LIST_CACHE)
  @Header('Vary', 'Accept-Encoding')
  search(@Query() query: ProductQueryDto) {
    return this.productsService.findAll({ q: query.q, limit: 10 });
  }

  @Get('products/featured')
  @Header('Cache-Control', PUBLIC_LIST_CACHE)
  @Header('Vary', 'Accept-Encoding')
  featured() {
    return this.productsService.findAll({ limit: 6 });
  }

  @Get('admin/products')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.PRODUCTS_VIEW)
  findAllAdmin(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query, { includeInactive: true });
  }

  @Get('admin/products/:identifier')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.PRODUCTS_VIEW)
  findOneAdmin(@Param('identifier') identifier: string) {
    return this.productsService.findOne(identifier, { includeInactive: true });
  }

  @Get('products')
  @Header('Cache-Control', PUBLIC_LIST_CACHE)
  @Header('Vary', 'Accept-Encoding')
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query, { includeInactive: false });
  }

  @Get('products/:identifier')
  @Header('Cache-Control', PUBLIC_DETAIL_CACHE)
  @Header('Vary', 'Accept-Encoding')
  findOne(@Param('identifier') identifier: string) {
    return this.productsService.findOne(identifier, { includeInactive: false });
  }

  @Post(['products', 'admin/products'])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(ADMIN_PERMISSIONS.PRODUCTS_MANAGE)
  async create(@Body() createProductDto: CreateProductDto, @Req() req: Request) {
    const result = await this.productsService.create(createProductDto);
    this.auditLogService.auditSuccess(
      req,
      'PRODUCT_CREATED',
      'product',
      String(result.data.id),
      { name: result.data.name },
      'Product created successfully',
    );
    return result;
  }

  @Patch(['products/:id', 'admin/products/:id'])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(ADMIN_PERMISSIONS.PRODUCTS_MANAGE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @Req() req: Request,
  ) {
    const result = await this.productsService.update(id, updateProductDto);
    this.auditLogService.auditSuccess(
      req,
      'PRODUCT_UPDATED',
      'product',
      String(result.data.id),
      { name: result.data.name },
      'Product updated successfully',
    );
    return result;
  }

  @Delete(['products/:id', 'admin/products/:id'])
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPERADMIN)
  @Permissions(ADMIN_PERMISSIONS.PRODUCTS_MANAGE)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @Query('confirm') queryConfirm: string,
    @Query('reason') queryReason: string,
    @Headers('x-confirm-dangerous-action') headerConfirm: string,
    @Req() req: Request,
  ) {
    const bodyConfirm = body?.confirm;
    const bodyReason = body?.reason;
    const isConfirmed =
      bodyConfirm === true ||
      bodyConfirm === 'true' ||
      queryConfirm === 'true' ||
      headerConfirm === 'true';
    const rawReason = bodyReason || queryReason || 'No reason provided';
    let cleanReason = String(rawReason).trim();
    if (cleanReason.length > 300) cleanReason = `${cleanReason.substring(0, 297)}...`;
    cleanReason = cleanReason.replace(/[<>]/g, '');

    if (!isConfirmed) {
      this.auditLogService.auditFailure(
        req,
        'DANGEROUS_ACTION_BLOCKED',
        'product',
        String(id),
        { action: 'DELETE_PRODUCT', reason: 'Missing confirmation', clientReason: cleanReason },
        'Dangerous action blocked: product deletion requires confirmation',
      );
      throw new BadRequestException({
        success: false,
        message: 'Dangerous action confirmation required',
      });
    }

    const result = await this.productsService.remove(id);
    this.auditLogService.auditSuccess(
      req,
      'PRODUCT_SOFT_DELETED',
      'product',
      String(id),
      { id, reason: cleanReason },
      'Product soft deleted successfully',
    );
    return result;
  }
}
