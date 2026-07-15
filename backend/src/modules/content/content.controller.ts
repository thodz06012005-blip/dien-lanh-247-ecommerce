import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ContentService } from './content.service';
import { ContentPayloadDto, ContentQueryDto } from './dto/content.dto';

const PUBLIC_LIST_CACHE = 'public, max-age=60, s-maxage=300, stale-while-revalidate=600';
const PUBLIC_DETAIL_CACHE = 'public, max-age=300, s-maxage=900, stale-while-revalidate=1800';

@Controller()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('services/featured')
  @Header('Cache-Control', PUBLIC_LIST_CACHE)
  @Header('Vary', 'Accept-Encoding')
  listFeaturedServices(@Query() query: ContentQueryDto): Promise<unknown> {
    query.featured = true;
    query.limit = Math.min(query.limit || 6, 12);
    return this.contentService.listPublic('services', query);
  }

  @Get('services')
  @Header('Cache-Control', PUBLIC_LIST_CACHE)
  @Header('Vary', 'Accept-Encoding')
  listServices(@Query() query: ContentQueryDto): Promise<unknown> {
    return this.contentService.listPublic('services', query);
  }

  @Get('services/:slug')
  @Header('Cache-Control', PUBLIC_DETAIL_CACHE)
  @Header('Vary', 'Accept-Encoding')
  getService(@Param('slug') slug: string): Promise<unknown> {
    return this.contentService.findPublic('services', slug);
  }

  @Get('projects/featured')
  @Header('Cache-Control', PUBLIC_LIST_CACHE)
  @Header('Vary', 'Accept-Encoding')
  listFeaturedProjects(@Query() query: ContentQueryDto): Promise<unknown> {
    query.featured = true;
    query.limit = Math.min(query.limit || 6, 12);
    return this.contentService.listPublic('projects', query);
  }

  @Get('projects')
  @Header('Cache-Control', PUBLIC_LIST_CACHE)
  @Header('Vary', 'Accept-Encoding')
  listProjects(@Query() query: ContentQueryDto): Promise<unknown> {
    return this.contentService.listPublic('projects', query);
  }

  @Get('projects/:slug')
  @Header('Cache-Control', PUBLIC_DETAIL_CACHE)
  @Header('Vary', 'Accept-Encoding')
  getProject(@Param('slug') slug: string): Promise<unknown> {
    return this.contentService.findPublic('projects', slug);
  }

  @Get('posts/featured')
  @Header('Cache-Control', PUBLIC_LIST_CACHE)
  @Header('Vary', 'Accept-Encoding')
  listFeaturedPosts(@Query() query: ContentQueryDto): Promise<unknown> {
    query.featured = true;
    query.limit = Math.min(query.limit || 6, 12);
    return this.contentService.listPublic('posts', query);
  }

  @Get('posts')
  @Header('Cache-Control', PUBLIC_LIST_CACHE)
  @Header('Vary', 'Accept-Encoding')
  listPosts(@Query() query: ContentQueryDto): Promise<unknown> {
    return this.contentService.listPublic('posts', query);
  }

  @Get('posts/:slug')
  @Header('Cache-Control', PUBLIC_DETAIL_CACHE)
  @Header('Vary', 'Accept-Encoding')
  getPost(@Param('slug') slug: string): Promise<unknown> {
    return this.contentService.findPublic('posts', slug);
  }

  @Get('admin/content/:type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  listAdmin(@Param('type') type: string, @Query() query: ContentQueryDto): Promise<unknown> {
    return this.contentService.listAdmin(type, query);
  }

  @Get('admin/content/:type/:identifier')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  findAdmin(@Param('type') type: string, @Param('identifier') identifier: string): Promise<unknown> {
    return this.contentService.findAdmin(type, identifier);
  }

  @Get('admin/content/:type/:identifier/preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  preview(@Param('type') type: string, @Param('identifier') identifier: string): Promise<unknown> {
    return this.contentService.findAdmin(type, identifier);
  }

  @Post('admin/content/:type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  create(@Param('type') type: string, @Body() payload: ContentPayloadDto): Promise<unknown> {
    return this.contentService.createAdmin(type, payload);
  }

  @Patch('admin/content/:type/:identifier')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  update(
    @Param('type') type: string,
    @Param('identifier') identifier: string,
    @Body() payload: ContentPayloadDto,
  ): Promise<unknown> {
    return this.contentService.updateAdmin(type, identifier, payload);
  }

  @Delete('admin/content/:type/:identifier')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  remove(@Param('type') type: string, @Param('identifier') identifier: string): Promise<unknown> {
    return this.contentService.removeAdmin(type, identifier);
  }
}
