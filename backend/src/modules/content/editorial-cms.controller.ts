import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { ADMIN_PERMISSIONS } from '../../common/auth/admin-permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ContentMediaService } from './content-media.service';
import { EditorialCmsService } from './editorial-cms.service';
import type { EditorialActor } from './editorial-cms.types';
import {
  EditorialPayloadDto,
  EditorialQueryDto,
  MediaMetadataDto,
  PublishContentDto,
  RevisionQueryDto,
} from './dto/editorial-cms.dto';

interface CurrentAdmin {
  userId: number;
  email: string;
  role: string;
  name?: string;
}

@Controller()
export class EditorialCmsController {
  constructor(
    private readonly cms: EditorialCmsService,
    private readonly media: ContentMediaService,
  ) {}

  private actor(user: CurrentAdmin): EditorialActor {
    return {
      userId: user.userId,
      email: user.email,
      role: user.role,
      name: user.name,
    };
  }

  @Get('site-content/section/:key')
  publicSection(@Param('key') key: string) {
    return this.cms.getPublicSection(key);
  }

  @Get('site-content/:scope')
  publicBundle(@Param('scope') scope: string) {
    return this.cms.getSiteBundle(scope);
  }

  @Post('admin/cms/media/upload')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.CONTENT_MANAGE)
  @UseInterceptors(FileInterceptor('file', { limits: { files: 1, fileSize: 10 * 1024 * 1024 } }))
  uploadMedia(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() metadata: MediaMetadataDto,
    @CurrentUser() user: CurrentAdmin,
  ) {
    return this.media.upload(file, metadata, this.actor(user));
  }

  @Get('admin/cms/:type')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.CONTENT_VIEW)
  list(@Param('type') type: string, @Query() query: EditorialQueryDto) {
    return this.cms.list(type, query);
  }

  @Get('admin/cms/:type/:identifier/history')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.CONTENT_VIEW)
  history(
    @Param('type') type: string,
    @Param('identifier') identifier: string,
    @Query() query: RevisionQueryDto,
  ) {
    return this.cms.history(type, identifier, query);
  }

  @Get('admin/cms/:type/:identifier/preview')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.CONTENT_VIEW)
  preview(@Param('type') type: string, @Param('identifier') identifier: string) {
    return this.cms.find(type, identifier);
  }

  @Get('admin/cms/:type/:identifier')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.CONTENT_VIEW)
  find(@Param('type') type: string, @Param('identifier') identifier: string) {
    return this.cms.find(type, identifier);
  }

  @Post('admin/cms/:type')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(ADMIN_PERMISSIONS.CONTENT_MANAGE)
  create(
    @Param('type') type: string,
    @Body() payload: EditorialPayloadDto,
    @CurrentUser() user: CurrentAdmin,
  ) {
    return this.cms.create(type, payload, this.actor(user));
  }

  @Patch('admin/cms/:type/:identifier')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(ADMIN_PERMISSIONS.CONTENT_MANAGE)
  update(
    @Param('type') type: string,
    @Param('identifier') identifier: string,
    @Body() payload: EditorialPayloadDto,
    @CurrentUser() user: CurrentAdmin,
  ) {
    return this.cms.update(type, identifier, payload, this.actor(user));
  }

  @Post('admin/cms/:type/:identifier/publish')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(ADMIN_PERMISSIONS.CONTENT_MANAGE)
  publish(
    @Param('type') type: string,
    @Param('identifier') identifier: string,
    @Body() dto: PublishContentDto,
    @CurrentUser() user: CurrentAdmin,
  ) {
    return this.cms.publish(type, identifier, dto, this.actor(user));
  }

  @Post('admin/cms/:type/:identifier/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(ADMIN_PERMISSIONS.CONTENT_MANAGE)
  unpublish(
    @Param('type') type: string,
    @Param('identifier') identifier: string,
    @CurrentUser() user: CurrentAdmin,
  ) {
    return this.cms.unpublish(type, identifier, this.actor(user));
  }

  @Post('admin/cms/:type/:identifier/restore')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(ADMIN_PERMISSIONS.CONTENT_MANAGE)
  restore(
    @Param('type') type: string,
    @Param('identifier') identifier: string,
    @CurrentUser() user: CurrentAdmin,
  ) {
    return this.cms.restore(type, identifier, this.actor(user));
  }

  @Delete('admin/cms/:type/:identifier')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(ADMIN_PERMISSIONS.CONTENT_MANAGE)
  archive(
    @Param('type') type: string,
    @Param('identifier') identifier: string,
    @CurrentUser() user: CurrentAdmin,
  ) {
    return this.cms.archive(type, identifier, this.actor(user));
  }
}
