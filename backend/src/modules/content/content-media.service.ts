import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { CloudinaryService } from '../../integrations/cloudinary/cloudinary.service';
import { PrismaService } from '../../core/database/prisma.service';
import { ContentRevisionService } from './content-revision.service';
import type { EditorialActor } from './editorial-cms.types';
import type { MediaMetadataDto } from './dto/editorial-cms.dto';

interface MediaRow {
  id: number;
  name: string;
  url: string;
  altText: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  provider: string | null;
  publicId: string | null;
  folder: string | null;
  isActive: number | boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ContentMediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly cloudinary: CloudinaryService,
    private readonly revisions: ContentRevisionService,
  ) {}

  private assertFile(file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Vui lòng chọn tệp cần tải lên');
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Chỉ hỗ trợ JPEG, PNG, WebP, GIF hoặc PDF');
    }
    const maxBytes = Number(this.config.get('MEDIA_MAX_BYTES')) || 10 * 1024 * 1024;
    if (file.size > maxBytes) throw new BadRequestException(`Tệp vượt quá giới hạn ${Math.round(maxBytes / 1024 / 1024)} MB`);
    return file;
  }

  private cleanFolder(value?: string) {
    const normalized = (value || 'content').replace(/[^a-zA-Z0-9/_-]/g, '').replace(/^\/+|\/+$/g, '');
    return normalized || 'content';
  }

  private async uploadLocal(file: Express.Multer.File, folder: string) {
    const root = this.config.get<string>('MEDIA_STORAGE_PATH') || join(process.cwd(), 'storage');
    const directory = join(root, folder);
    await mkdir(directory, { recursive: true });
    const safeExtension = extname(file.originalname).toLowerCase() || this.extensionForMime(file.mimetype);
    const filename = `${Date.now()}-${randomUUID()}${safeExtension}`;
    await writeFile(join(directory, filename), file.buffer, { flag: 'wx' });
    return {
      url: `/uploads/${folder}/${filename}`,
      publicId: `${folder}/${filename}`,
      provider: 'local',
      width: null,
      height: null,
    };
  }

  private extensionForMime(mimeType: string) {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'application/pdf': '.pdf',
    };
    return map[mimeType] || '.bin';
  }

  async upload(rawFile: Express.Multer.File | undefined, metadata: MediaMetadataDto, actor: EditorialActor) {
    const file = this.assertFile(rawFile);
    const folder = this.cleanFolder(metadata.folder);
    const driver = this.config.get<string>('MEDIA_STORAGE_DRIVER', 'local').toLowerCase();

    const stored = driver === 'cloudinary'
      ? await this.cloudinary.uploadFile(file, `dien-lanh-247/${folder}`).then((result) => ({
          url: result.secure_url,
          publicId: result.public_id,
          provider: 'cloudinary',
          width: result.width ?? null,
          height: result.height ?? null,
        }))
      : await this.uploadLocal(file, folder);

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO Media
        (name, url, altText, mimeType, width, height, sizeBytes, provider, publicId, folder,
         isActive, updatedById, version, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, 1, NOW(3), NOW(3))`,
      metadata.name?.trim() || file.originalname,
      stored.url,
      metadata.altText?.trim() || null,
      file.mimetype,
      stored.width,
      stored.height,
      file.size,
      stored.provider,
      stored.publicId,
      folder,
      actor.userId,
    );
    const inserted = await this.prisma.$queryRawUnsafe<Array<{ id: number }>>('SELECT LAST_INSERT_ID() AS id');
    const rows = await this.prisma.$queryRawUnsafe<MediaRow[]>(
      `SELECT id, name, url, altText, mimeType, width, height, sizeBytes, provider,
              publicId, folder, isActive, version, createdAt, updatedAt
       FROM Media WHERE id = ? LIMIT 1`,
      inserted[0]?.id,
    );
    const media = rows[0];
    if (!media) throw new BadRequestException('Không thể lưu metadata media');
    await this.revisions.record('media', media.id, 'UPLOAD', media.version, media, actor, 'Tải media mới');
    return { success: true, data: { ...media, isActive: Boolean(media.isActive) } };
  }
}
