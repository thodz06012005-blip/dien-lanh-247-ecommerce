import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { ContentService } from './content.service';
import { ContentRevisionService } from './content-revision.service';
import type { ContentPayloadDto } from './dto/content.dto';
import type {
  EditorialPayloadDto,
  EditorialQueryDto,
  PublishContentDto,
  RevisionQueryDto,
} from './dto/editorial-cms.dto';
import {
  EDITORIAL_TABLES,
  isEditorialType,
  isLegacyType,
  isPublishableType,
  type EditorialActor,
  type EditorialContentType,
} from './editorial-cms.types';

interface CmsRecord extends Record<string, unknown> {
  id: number | string;
  version?: number;
}

@Injectable()
export class EditorialCmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly legacyContent: ContentService,
    private readonly revisions: ContentRevisionService,
  ) {}

  assertType(value: string): EditorialContentType {
    if (!isEditorialType(value)) throw new BadRequestException(`Loại nội dung không được hỗ trợ: ${value}`);
    return value;
  }

  private normalizeRow<T extends Record<string, unknown>>(row: T): T {
    const jsonFields = [
      'pricing',
      'process',
      'faq',
      'tasks',
      'config',
      'socialLinks',
      'relatedServiceSlugs',
      'mediaIds',
      'tagIds',
      'snapshot',
    ];
    const normalized = { ...row };
    for (const field of jsonFields) {
      const value = normalized[field];
      if (typeof value === 'string') {
        try {
          normalized[field] = JSON.parse(value) as T[string];
        } catch {
          normalized[field] = value;
        }
      }
    }
    for (const field of ['isActive', 'isFeatured']) {
      if (field in normalized) normalized[field] = Boolean(normalized[field]) as T[string];
    }
    return normalized;
  }

  private sanitizeHtml(value?: string) {
    if (!value) return value;
    return value
      .replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, '')
      .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/data\s*:\s*text\/html/gi, '');
  }

  private cleanPayload(payload: EditorialPayloadDto): EditorialPayloadDto {
    return {
      ...payload,
      content: this.sanitizeHtml(payload.content),
      description: this.sanitizeHtml(payload.description),
      warranty: this.sanitizeHtml(payload.warranty),
      bio: this.sanitizeHtml(payload.bio),
    };
  }

  private table(type: EditorialContentType) {
    return EDITORIAL_TABLES[type];
  }

  private async assertUnique(
    table: string,
    field: string,
    value: string,
    currentId?: string | number,
  ) {
    const params: unknown[] = [value];
    let sql = `SELECT id FROM ${table} WHERE ${field} = ?`;
    if (currentId !== undefined) {
      sql += ' AND id <> ?';
      params.push(currentId);
    }
    sql += ' LIMIT 1';
    const rows = await this.prisma.$queryRawUnsafe<Array<{ id: number | string }>>(sql, ...params);
    if (rows.length) throw new ConflictException(`${field} đã tồn tại: ${value}`);
  }

  private identifierWhere(type: EditorialContentType, identifier: string) {
    const config = this.table(type);
    if (/^\d+$/.test(identifier)) return { sql: 'x.id = ?', value: Number(identifier) };
    if (type === 'service-categories') return { sql: '(x.id = ? OR x.slug = ?)', value: identifier, duplicate: true };
    if (type === 'site-sections') return { sql: 'x.sectionKey = ?', value: identifier };
    if (config.slugField) return { sql: `x.${config.slugField} = ?`, value: identifier };
    throw new BadRequestException('Mã nội dung phải là số');
  }

  async list(typeValue: string, query: EditorialQueryDto) {
    const type = this.assertType(typeValue);
    const config = this.table(type);
    const clauses = ['1=1'];
    const params: unknown[] = [];

    if (!query.includeDeleted) clauses.push('x.deletedAt IS NULL');
    if (type === 'categories') clauses.push("x.categoryType = 'POST'");
    if (query.q) {
      const slugExpression = config.slugField ? `CAST(x.${config.slugField} AS CHAR)` : "''";
      clauses.push(`(x.${config.labelField} LIKE ? OR ${slugExpression} LIKE ?)`);
      params.push(`%${query.q}%`, `%${query.q}%`);
    }
    if (query.status && config.publishable) {
      clauses.push('x.status = ?');
      params.push(query.status);
    }
    if (typeof query.active === 'boolean' && config.activeField) {
      clauses.push(`x.${config.activeField} = ?`);
      params.push(query.active);
    }
    if (typeof query.featured === 'boolean' && ['services', 'service-categories', 'projects', 'posts', 'partners', 'testimonials'].includes(type)) {
      clauses.push('x.isFeatured = ?');
      params.push(query.featured);
    }
    if (query.placement && type === 'banners') {
      clauses.push('x.placement = ?');
      params.push(query.placement);
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;
    const where = `WHERE ${clauses.join(' AND ')}`;
    const [rows, countRows] = await Promise.all([
      this.prisma.$queryRawUnsafe<CmsRecord[]>(
        `SELECT x.*,
                CONCAT(COALESCE(uu.firstName, ''), ' ', COALESCE(uu.lastName, '')) AS updatedByName,
                uu.email AS updatedByEmail
         FROM ${config.table} x
         LEFT JOIN User uu ON uu.id = x.updatedById
         ${where}
         ORDER BY x.updatedAt DESC, x.id DESC LIMIT ? OFFSET ?`,
        ...params,
        limit,
        offset,
      ),
      this.prisma.$queryRawUnsafe<Array<{ total: bigint | number }>>(
        `SELECT COUNT(*) AS total FROM ${config.table} x ${where}`,
        ...params,
      ),
    ]);
    const total = Number(countRows[0]?.total ?? 0);
    return {
      success: true,
      data: rows.map((row) => this.normalizeRow(row)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async find(typeValue: string, identifier: string) {
    const type = this.assertType(typeValue);
    const config = this.table(type);
    const where = this.identifierWhere(type, identifier);
    const params = where.duplicate ? [where.value, where.value] : [where.value];
    const rows = await this.prisma.$queryRawUnsafe<CmsRecord[]>(
      `SELECT x.*,
              CONCAT(COALESCE(uu.firstName, ''), ' ', COALESCE(uu.lastName, '')) AS updatedByName,
              uu.email AS updatedByEmail,
              CONCAT(COALESCE(pu.firstName, ''), ' ', COALESCE(pu.lastName, '')) AS publishedByName
       FROM ${config.table} x
       LEFT JOIN User uu ON uu.id = x.updatedById
       ${config.publishable ? 'LEFT JOIN User pu ON pu.id = x.publishedById' : 'LEFT JOIN User pu ON 1 = 0'}
       WHERE ${where.sql} LIMIT 1`,
      ...params,
    );
    if (!rows.length) throw new NotFoundException('Không tìm thấy nội dung');
    const item = this.normalizeRow(rows[0]);

    if (type === 'projects') {
      const album = await this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `SELECT m.*, pm.caption, pm.sortOrder FROM ProjectMedia pm
         JOIN Media m ON m.id = pm.mediaId
         WHERE pm.projectId = ? AND m.deletedAt IS NULL ORDER BY pm.sortOrder ASC`,
        item.id,
      );
      item.album = album.map((row) => this.normalizeRow(row));
    }
    if (type === 'posts') {
      item.tags = await this.prisma.$queryRawUnsafe(
        `SELECT t.id, t.name, t.slug FROM PostTag pt JOIN Tag t ON t.id = pt.tagId
         WHERE pt.postId = ? AND t.deletedAt IS NULL ORDER BY t.name ASC`,
        item.id,
      );
    }
    return { success: true, data: item };
  }

  private async enrichLegacyAfterCreate(
    type: EditorialContentType,
    id: string | number,
    payload: EditorialPayloadDto,
    actor: EditorialActor,
  ) {
    const config = this.table(type);
    const assignments = ['updatedById = ?', 'deletedAt = NULL'];
    const params: unknown[] = [actor.userId];
    if (['services', 'service-categories', 'projects', 'posts', 'categories'].includes(type)) {
      assignments.push('socialImageMediaId = ?');
      params.push(payload.socialImageMediaId ?? null);
    }
    if (config.publishable && payload.status === 'PUBLISHED') {
      assignments.push('publishedById = ?');
      params.push(actor.userId);
    }
    await this.prisma.$executeRawUnsafe(
      `UPDATE ${config.table} SET ${assignments.join(', ')}, updatedAt = NOW(3) WHERE id = ?`,
      ...params,
      id,
    );
  }

  async create(typeValue: string, rawPayload: EditorialPayloadDto, actor: EditorialActor) {
    const type = this.assertType(typeValue);
    const payload = this.cleanPayload(rawPayload);
    let identifier: string | number;

    if (isLegacyType(type)) {
      const result = await this.legacyContent.createAdmin(type, payload as ContentPayloadDto) as { data: CmsRecord };
      identifier = result.data.id ?? result.data.slug as string;
      await this.enrichLegacyAfterCreate(type, identifier, payload, actor);
    } else {
      identifier = await this.createEditorialRecord(type, payload, actor);
    }

    const result = await this.find(type, String(identifier));
    await this.revisions.record(type, identifier, 'CREATE', Number(result.data.version ?? 1), result.data, actor, 'Tạo nội dung');
    return result;
  }

  private async createEditorialRecord(
    type: Exclude<EditorialContentType, 'services' | 'service-categories' | 'projects' | 'posts' | 'categories' | 'tags' | 'media'>,
    payload: EditorialPayloadDto,
    actor: EditorialActor,
  ) {
    if (type === 'banners') {
      if (!payload.name || !payload.title) throw new BadRequestException('Tên quản trị và tiêu đề banner là bắt buộc');
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO Banner
          (name, eyebrow, title, subtitle, ctaLabel, ctaUrl, secondaryCtaLabel, secondaryCtaUrl,
           placement, theme, desktopMediaId, mobileMediaId, status, isActive, sortOrder,
           publishedAt, startsAt, endsAt, updatedById, publishedById, version, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(3), NOW(3))`,
        payload.name.trim(), payload.eyebrow ?? null, payload.title.trim(), payload.subtitle ?? null,
        payload.ctaLabel ?? null, payload.ctaUrl ?? null, payload.secondaryCtaLabel ?? null,
        payload.secondaryCtaUrl ?? null, payload.placement ?? 'HOME_HERO', payload.theme ?? 'DARK',
        payload.desktopMediaId ?? null, payload.mobileMediaId ?? null, payload.status ?? 'DRAFT',
        payload.isActive ?? true, payload.sortOrder ?? 0,
        payload.publishedAt ? new Date(payload.publishedAt) : null,
        payload.startsAt ? new Date(payload.startsAt) : null,
        payload.endsAt ? new Date(payload.endsAt) : null,
        actor.userId, payload.status === 'PUBLISHED' ? actor.userId : null,
      );
    } else if (type === 'partners') {
      if (!payload.name) throw new BadRequestException('Tên đối tác là bắt buộc');
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO Partner
          (name, description, websiteUrl, logoMediaId, status, isFeatured, isActive, sortOrder,
           publishedAt, updatedById, publishedById, version, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(3), NOW(3))`,
        payload.name.trim(), payload.description ?? null, payload.websiteUrl ?? null,
        payload.logoMediaId ?? null, payload.status ?? 'DRAFT', payload.isFeatured ?? false,
        payload.isActive ?? true, payload.sortOrder ?? 0,
        payload.publishedAt ? new Date(payload.publishedAt) : null,
        actor.userId, payload.status === 'PUBLISHED' ? actor.userId : null,
      );
    } else if (type === 'testimonials') {
      if (!payload.customerName || !payload.quote) throw new BadRequestException('Tên khách hàng và nội dung đánh giá là bắt buộc');
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO Testimonial
          (customerName, customerTitle, company, quote, rating, avatarMediaId, serviceId,
           status, isFeatured, isActive, sortOrder, publishedAt, updatedById, publishedById,
           version, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(3), NOW(3))`,
        payload.customerName.trim(), payload.customerTitle ?? null, payload.company ?? null,
        payload.quote.trim(), payload.rating ?? 5, payload.avatarMediaId ?? null,
        payload.serviceId ?? null, payload.status ?? 'DRAFT', payload.isFeatured ?? false,
        payload.isActive ?? true, payload.sortOrder ?? 0,
        payload.publishedAt ? new Date(payload.publishedAt) : null,
        actor.userId, payload.status === 'PUBLISHED' ? actor.userId : null,
      );
    } else if (type === 'site-sections') {
      if (!payload.sectionKey || !payload.name) throw new BadRequestException('Mã khu vực và tên quản trị là bắt buộc');
      await this.assertUnique('SiteSection', 'sectionKey', payload.sectionKey);
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO SiteSection
          (sectionKey, name, eyebrow, title, content, config, status, isActive, sortOrder,
           publishedAt, seoTitle, seoDescription, canonicalUrl, socialImageMediaId,
           updatedById, publishedById, version, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(3), NOW(3))`,
        payload.sectionKey.trim().toUpperCase(), payload.name.trim(), payload.eyebrow ?? null,
        payload.title ?? null, payload.content ?? null, this.json(payload.config),
        payload.status ?? 'DRAFT', payload.isActive ?? true, payload.sortOrder ?? 0,
        payload.publishedAt ? new Date(payload.publishedAt) : null,
        payload.seoTitle ?? null, payload.seoDescription ?? null, payload.canonicalUrl ?? null,
        payload.socialImageMediaId ?? null, actor.userId,
        payload.status === 'PUBLISHED' ? actor.userId : null,
      );
    } else {
      if (!payload.userId || !payload.displayName) throw new BadRequestException('Tài khoản và tên tác giả là bắt buộc');
      await this.assertUnique('AuthorProfile', 'userId', String(payload.userId));
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO AuthorProfile
          (userId, displayName, title, bio, avatarMediaId, socialLinks, isActive,
           updatedById, version, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?, 1, NOW(3), NOW(3))`,
        payload.userId, payload.displayName.trim(), payload.roleTitle ?? null, payload.bio ?? null,
        payload.avatarMediaId ?? null, this.json(payload.socialLinks), payload.isActive ?? true,
        actor.userId,
      );
    }
    const inserted = await this.prisma.$queryRawUnsafe<Array<{ id: number }>>('SELECT LAST_INSERT_ID() AS id');
    return inserted[0]?.id;
  }

  private json(value: unknown) {
    if (value === undefined || value === null || value === '') return null;
    return JSON.stringify(value);
  }

  async update(
    typeValue: string,
    identifier: string,
    rawPayload: EditorialPayloadDto,
    actor: EditorialActor,
  ) {
    const type = this.assertType(typeValue);
    const payload = this.cleanPayload(rawPayload);
    const current = await this.find(type, identifier);
    const id = current.data.id;

    if (isLegacyType(type)) {
      await this.legacyContent.updateAdmin(type, String(id), payload as ContentPayloadDto);
      await this.updateLegacyMetadata(type, id, payload, actor);
    } else {
      await this.updateEditorialRecord(type, id, payload, actor);
    }

    const result = await this.find(type, String(id));
    await this.revisions.record(type, id, 'UPDATE', Number(result.data.version ?? 1), result.data, actor, 'Cập nhật nội dung');
    return result;
  }

  private async updateLegacyMetadata(
    type: EditorialContentType,
    id: string | number,
    payload: EditorialPayloadDto,
    actor: EditorialActor,
  ) {
    const config = this.table(type);
    const assignments = ['updatedById = ?', 'version = version + 1'];
    const params: unknown[] = [actor.userId];
    if (payload.socialImageMediaId !== undefined && ['services', 'service-categories', 'projects', 'posts', 'categories'].includes(type)) {
      assignments.push('socialImageMediaId = ?');
      params.push(payload.socialImageMediaId ?? null);
    }
    if (config.publishable && payload.status === 'PUBLISHED') {
      assignments.push('publishedById = ?');
      params.push(actor.userId);
    }
    await this.prisma.$executeRawUnsafe(
      `UPDATE ${config.table} SET ${assignments.join(', ')}, updatedAt = NOW(3) WHERE id = ?`,
      ...params,
      id,
    );
  }

  private async updateEditorialRecord(
    type: Exclude<EditorialContentType, 'services' | 'service-categories' | 'projects' | 'posts' | 'categories' | 'tags' | 'media'>,
    id: string | number,
    payload: EditorialPayloadDto,
    actor: EditorialActor,
  ) {
    const allowed: Record<typeof type, string[]> = {
      banners: ['name','eyebrow','title','subtitle','ctaLabel','ctaUrl','secondaryCtaLabel','secondaryCtaUrl','placement','theme','desktopMediaId','mobileMediaId','status','isActive','sortOrder','publishedAt','startsAt','endsAt'],
      partners: ['name','description','websiteUrl','logoMediaId','status','isFeatured','isActive','sortOrder','publishedAt'],
      testimonials: ['customerName','customerTitle','company','quote','rating','avatarMediaId','serviceId','status','isFeatured','isActive','sortOrder','publishedAt'],
      'site-sections': ['sectionKey','name','eyebrow','title','content','config','status','isActive','sortOrder','publishedAt','seoTitle','seoDescription','canonicalUrl','socialImageMediaId'],
      authors: ['userId','displayName','roleTitle','bio','avatarMediaId','socialLinks','isActive'],
    };
    const fieldAliases: Record<string, string> = { roleTitle: 'title' };
    const entries = allowed[type]
      .filter((field) => (payload as Record<string, unknown>)[field] !== undefined)
      .map((field) => {
        const column = fieldAliases[field] || field;
        let value = (payload as Record<string, unknown>)[field];
        if (['config', 'socialLinks'].includes(field)) value = this.json(value);
        if (['publishedAt', 'startsAt', 'endsAt'].includes(field) && value) value = new Date(String(value));
        return [column, value] as const;
      });
    if (type === 'site-sections' && payload.sectionKey) {
      await this.assertUnique('SiteSection', 'sectionKey', payload.sectionKey, id);
    }
    if (type === 'authors' && payload.userId) {
      await this.assertUnique('AuthorProfile', 'userId', String(payload.userId), id);
    }
    if (!entries.length) return;
    const assignments = entries.map(([field]) => `${field} = ?`);
    assignments.push('updatedById = ?', 'version = version + 1', 'updatedAt = NOW(3)');
    await this.prisma.$executeRawUnsafe(
      `UPDATE ${this.table(type).table} SET ${assignments.join(', ')} WHERE id = ?`,
      ...entries.map(([, value]) => value),
      actor.userId,
      id,
    );
  }

  async publish(
    typeValue: string,
    identifier: string,
    dto: PublishContentDto,
    actor: EditorialActor,
  ) {
    const type = this.assertType(typeValue);
    if (!isPublishableType(type)) throw new BadRequestException('Loại nội dung này không sử dụng workflow xuất bản');
    const current = await this.find(type, identifier);
    const id = current.data.id;
    const config = this.table(type);
    const activeAssignment = config.activeField ? `, ${config.activeField} = TRUE` : '';
    await this.prisma.$executeRawUnsafe(
      `UPDATE ${config.table}
       SET status = 'PUBLISHED', publishedAt = ?, publishedById = ?, updatedById = ?,
           deletedAt = NULL, version = version + 1, updatedAt = NOW(3)${activeAssignment}
       WHERE id = ?`,
      dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
      actor.userId,
      actor.userId,
      id,
    );
    const result = await this.find(type, String(id));
    await this.revisions.record(type, id, 'PUBLISH', Number(result.data.version ?? 1), result.data, actor, dto.summary || 'Xuất bản nội dung');
    return result;
  }

  async unpublish(typeValue: string, identifier: string, actor: EditorialActor) {
    const type = this.assertType(typeValue);
    if (!isPublishableType(type)) throw new BadRequestException('Loại nội dung này không sử dụng workflow xuất bản');
    const current = await this.find(type, identifier);
    const id = current.data.id;
    await this.prisma.$executeRawUnsafe(
      `UPDATE ${this.table(type).table}
       SET status = 'DRAFT', publishedAt = NULL, updatedById = ?, version = version + 1, updatedAt = NOW(3)
       WHERE id = ?`,
      actor.userId,
      id,
    );
    const result = await this.find(type, String(id));
    await this.revisions.record(type, id, 'UNPUBLISH', Number(result.data.version ?? 1), result.data, actor, 'Gỡ xuất bản');
    return result;
  }

  async archive(typeValue: string, identifier: string, actor: EditorialActor) {
    const type = this.assertType(typeValue);
    const current = await this.find(type, identifier);
    const id = current.data.id;
    const config = this.table(type);
    const state = config.publishable ? "status = 'ARCHIVED'" : `${config.activeField || 'isActive'} = FALSE`;
    await this.prisma.$executeRawUnsafe(
      `UPDATE ${config.table}
       SET ${state}, deletedAt = NOW(3), updatedById = ?, version = version + 1, updatedAt = NOW(3)
       WHERE id = ?`,
      actor.userId,
      id,
    );
    const result = await this.find(type, String(id));
    await this.revisions.record(type, id, 'ARCHIVE', Number(result.data.version ?? 1), result.data, actor, 'Lưu trữ mềm');
    return { success: true, data: result.data };
  }

  async restore(typeValue: string, identifier: string, actor: EditorialActor) {
    const type = this.assertType(typeValue);
    const current = await this.find(type, identifier);
    const id = current.data.id;
    const config = this.table(type);
    const state = config.publishable ? "status = 'DRAFT'" : `${config.activeField || 'isActive'} = TRUE`;
    await this.prisma.$executeRawUnsafe(
      `UPDATE ${config.table}
       SET ${state}, deletedAt = NULL, updatedById = ?, version = version + 1, updatedAt = NOW(3)
       WHERE id = ?`,
      actor.userId,
      id,
    );
    const result = await this.find(type, String(id));
    await this.revisions.record(type, id, 'RESTORE', Number(result.data.version ?? 1), result.data, actor, 'Khôi phục nội dung');
    return result;
  }

  history(typeValue: string, identifier: string, query: RevisionQueryDto) {
    const type = this.assertType(typeValue);
    return this.revisions.list(type, identifier, query.page, query.limit);
  }

  async getSiteBundle(scopeValue: string) {
    const scope = scopeValue.toLowerCase();
    if (!['home', 'footer', 'all'].includes(scope)) throw new BadRequestException('Scope site content không hợp lệ');
    const nowClause = "status = 'PUBLISHED' AND isActive = TRUE AND deletedAt IS NULL AND (publishedAt IS NULL OR publishedAt <= NOW(3))";
    const sectionFilter = scope === 'home'
      ? "AND (sectionKey LIKE 'HOME_%' OR sectionKey = 'CONTACT')"
      : scope === 'footer'
        ? "AND (sectionKey LIKE 'FOOTER_%' OR sectionKey = 'FOOTER' OR sectionKey = 'CONTACT')"
        : '';

    const [banners, partners, testimonials, sections, services, projects, posts] = await Promise.all([
      scope === 'footer' ? Promise.resolve([]) : this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `SELECT x.*, dm.url AS desktopMediaUrl, dm.altText AS desktopMediaAlt,
                mm.url AS mobileMediaUrl
         FROM Banner x
         LEFT JOIN Media dm ON dm.id = x.desktopMediaId
         LEFT JOIN Media mm ON mm.id = x.mobileMediaId
         WHERE ${nowClause}
           AND (x.startsAt IS NULL OR x.startsAt <= NOW(3))
           AND (x.endsAt IS NULL OR x.endsAt >= NOW(3))
         ORDER BY x.sortOrder ASC, x.updatedAt DESC`,
      ),
      scope === 'footer' ? Promise.resolve([]) : this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `SELECT x.*, m.url AS logoUrl, m.altText AS logoAlt
         FROM Partner x LEFT JOIN Media m ON m.id = x.logoMediaId
         WHERE ${nowClause} ORDER BY x.isFeatured DESC, x.sortOrder ASC`,
      ),
      scope === 'footer' ? Promise.resolve([]) : this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `SELECT x.*, m.url AS avatarUrl, s.title AS serviceTitle
         FROM Testimonial x
         LEFT JOIN Media m ON m.id = x.avatarMediaId
         LEFT JOIN Service s ON s.id = x.serviceId
         WHERE ${nowClause} ORDER BY x.isFeatured DESC, x.sortOrder ASC`,
      ),
      this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `SELECT x.*, m.url AS socialImageUrl FROM SiteSection x
         LEFT JOIN Media m ON m.id = x.socialImageMediaId
         WHERE ${nowClause} ${sectionFilter} ORDER BY x.sortOrder ASC`,
      ),
      scope === 'footer' ? Promise.resolve({ data: [] }) : this.legacyContent.listPublic('services', Object.assign(new (class { page = 1; limit = 6; featured = true; })(), {})),
      scope === 'footer' ? Promise.resolve({ data: [] }) : this.legacyContent.listPublic('projects', Object.assign(new (class { page = 1; limit = 6; featured = true; })(), {})),
      scope === 'footer' ? Promise.resolve({ data: [] }) : this.legacyContent.listPublic('posts', Object.assign(new (class { page = 1; limit = 3; featured = true; })(), {})),
    ]);

    return {
      success: true,
      data: {
        scope,
        banners: banners.map((row) => this.normalizeRow(row)),
        partners: partners.map((row) => this.normalizeRow(row)),
        testimonials: testimonials.map((row) => this.normalizeRow(row)),
        sections: sections.map((row) => this.normalizeRow(row)),
        services: (services as { data: unknown[] }).data,
        projects: (projects as { data: unknown[] }).data,
        posts: (posts as { data: unknown[] }).data,
      },
    };
  }

  async getPublicSection(key: string) {
    const rows = await this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT x.*, m.url AS socialImageUrl FROM SiteSection x
       LEFT JOIN Media m ON m.id = x.socialImageMediaId
       WHERE x.sectionKey = ? AND x.status = 'PUBLISHED' AND x.isActive = TRUE
         AND x.deletedAt IS NULL AND (x.publishedAt IS NULL OR x.publishedAt <= NOW(3)) LIMIT 1`,
      key.toUpperCase(),
    );
    if (!rows.length) throw new NotFoundException('Không tìm thấy khu vực nội dung');
    return { success: true, data: this.normalizeRow(rows[0]) };
  }
}
