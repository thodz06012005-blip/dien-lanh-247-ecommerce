import {
  Body,
  Controller,
  Delete,
  Get,
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

@Controller()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('services/featured')
  listFeaturedServices(@Query() query: ContentQueryDto) {
    query.featured = true;
    query.limit = Math.min(query.limit || 6, 12);
    return this.contentService.listPublic('services', query);
  }

  @Get('services')
  listServices(@Query() query: ContentQueryDto) {
    return this.contentService.listPublic('services', query);
  }

  @Get('services/:slug')
  getService(@Param('slug') slug: string) {
    return this.contentService.findPublic('services', slug);
  }

  @Get('projects/featured')
  listFeaturedProjects(@Query() query: ContentQueryDto) {
    query.featured = true;
    query.limit = Math.min(query.limit || 6, 12);
    return this.contentService.listPublic('projects', query);
  }

  @Get('projects')
  listProjects(@Query() query: ContentQueryDto) {
    return this.contentService.listPublic('projects', query);
  }

  @Get('projects/:slug')
  getProject(@Param('slug') slug: string) {
    return this.contentService.findPublic('projects', slug);
  }

  @Get('posts/featured')
  listFeaturedPosts(@Query() query: ContentQueryDto) {
    query.featured = true;
    query.limit = Math.min(query.limit || 6, 12);
    return this.contentService.listPublic('posts', query);
  }

  @Get('posts')
  listPosts(@Query() query: ContentQueryDto) {
    return this.contentService.listPublic('posts', query);
  }

  @Get('posts/:slug')
  getPost(@Param('slug') slug: string) {
    return this.contentService.findPublic('posts', slug);
  }

  @Get('admin/content/:type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  listAdmin(@Param('type') type: string, @Query() query: ContentQueryDto) {
    return this.contentService.listAdmin(type, query);
  }

  @Get('admin/content/:type/:identifier')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  findAdmin(@Param('type') type: string, @Param('identifier') identifier: string) {
    return this.contentService.findAdmin(type, identifier);
  }

  @Get('admin/content/:type/:identifier/preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  preview(@Param('type') type: string, @Param('identifier') identifier: string) {
    return this.contentService.findAdmin(type, identifier);
  }

  @Post('admin/content/:type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  create(@Param('type') type: string, @Body() payload: ContentPayloadDto) {
    return this.contentService.createAdmin(type, payload);
  }

  @Patch('admin/content/:type/:identifier')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  update(
    @Param('type') type: string,
    @Param('identifier') identifier: string,
    @Body() payload: ContentPayloadDto,
  ) {
    return this.contentService.updateAdmin(type, identifier, payload);
  }

  @Delete('admin/content/:type/:identifier')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  remove(@Param('type') type: string, @Param('identifier') identifier: string) {
    return this.contentService.removeAdmin(type, identifier);
  }
}
