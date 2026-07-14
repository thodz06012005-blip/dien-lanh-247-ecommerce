import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { ContentPayloadDto, ContentQueryDto } from './dto/content.dto';

type ContentType =
  | 'services'
  | 'service-categories'
  | 'projects'
  | 'posts'
  | 'categories'
  | 'tags'
  | 'media';

interface PageResult<T> {
  success: true;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly allowedTypes: ContentType[] = [
    'services',
    'service-categories',
    'projects',
    'posts',
    'categories',
    'tags',
    'media',
  ];

  private assertType(value: string): asserts value is ContentType {
    if (!this.allowedTypes.includes(value as ContentType)) {
      throw new BadRequestException(`Unsupported content type: ${value}`);
    }
  }

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private parseJson(value: unknown) {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private normalizeRow(row: Record<string, unknown>) {
    const jsonFields = [
      'pricing',
      'process',
      'faq',
      'tasks',
      'relatedServiceSlugs',
      'mediaIds',
      'tagIds',
    ];
    const normalized = { ...row };
    for (const field of jsonFields) {
      if (field in normalized) normalized[field] = this.parseJson(normalized[field]);
    }
    return normalized;
  }

  private async paginate<T extends Record<string, unknown>>(
    rowsSql: string,
    countSql: string,
    params: unknown[],
    page: number,
    limit: number,
  ): Promise<PageResult<T>> {
    const offset = (page - 1) * limit;
    const rows = await this.prisma.$queryRawUnsafe<T[]>(`${rowsSql} LIMIT ? OFFSET ?`, ...params, limit, offset);
    const countRows = await this.prisma.$queryRawUnsafe<Array<{ total: bigint | number }>>(countSql, ...params);
    const total = Number(countRows[0]?.total ?? 0);
    return {
      success: true,
      data: rows.map((row) => this.normalizeRow(row) as T),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async listPublic(type: 'services' | 'projects' | 'posts', query: ContentQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 12;
    const clauses = [`x.status = 'PUBLISHED'`, '(x.publishedAt IS NULL OR x.publishedAt <= NOW())'];
    const params: unknown[] = [];

    if (query.q) {
      clauses.push('(x.title LIKE ? OR x.excerpt LIKE ?)');
      params.push(`%${query.q}%`, `%${query.q}%`);
    }
    if (typeof query.featured === 'boolean') {
      clauses.push('x.isFeatured = ?');
      params.push(query.featured);
    }

    if (type === 'services') {
      if (query.category) {
        clauses.push('(sc.slug = ? OR sc.id = ?)');
        params.push(query.category, query.category);
      }
      const where = `WHERE ${clauses.join(' AND ')}`;
      return this.paginate(
        `SELECT x.*, sc.name AS categoryName, sc.slug AS categorySlug,
          m.url AS coverUrl, m.altText AS coverAlt
         FROM Service x
         JOIN ServiceCategory sc ON sc.id = x.serviceCategoryId
         LEFT JOIN Media m ON m.id = x.coverMediaId
         ${where}
         ORDER BY x.isFeatured DESC, x.sortOrder ASC, x.publishedAt DESC`,
        `SELECT COUNT(*) AS total
         FROM Service x JOIN ServiceCategory sc ON sc.id = x.serviceCategoryId ${where}`,
        params,
        page,
        limit,
      );
    }

    if (type === 'projects') {
      const where = `WHERE ${clauses.join(' AND ')}`;
      return this.paginate(
        `SELECT x.*, m.url AS coverUrl, m.altText AS coverAlt
         FROM Project x LEFT JOIN Media m ON m.id = x.coverMediaId
         ${where}
         ORDER BY x.isFeatured DESC, x.sortOrder ASC, x.publishedAt DESC`,
        `SELECT COUNT(*) AS total FROM Project x ${where}`,
        params,
        page,
        limit,
      );
    }

    if (query.category) {
      clauses.push('(c.slug = ? OR CAST(c.id AS CHAR) = ?)');
      params.push(query.category, query.category);
    }
    if (query.tag) {
      clauses.push('EXISTS (SELECT 1 FROM PostTag pt JOIN Tag t ON t.id = pt.tagId WHERE pt.postId = x.id AND t.slug = ?)');
      params.push(query.tag);
    }
    const where = `WHERE ${clauses.join(' AND ')}`;
    return this.paginate(
      `SELECT x.*, c.name AS categoryName, c.slug AS categorySlug,
        CONCAT(COALESCE(u.firstName, ''), ' ', COALESCE(u.lastName, '')) AS authorName,
        m.url AS coverUrl, m.altText AS coverAlt
       FROM Post x
       JOIN Category c ON c.id = x.categoryId
       JOIN User u ON u.id = x.authorId
       LEFT JOIN Media m ON m.id = x.coverMediaId
       ${where}
       ORDER BY x.isFeatured DESC, x.publishedAt DESC`,
      `SELECT COUNT(*) AS total
       FROM Post x JOIN Category c ON c.id = x.categoryId ${where}`,
      params,
      page,
      limit,
    );
  }

  async findPublic(type: 'services' | 'projects' | 'posts', slug: string) {
    let rows: Array<Record<string, unknown>> = [];
    if (type === 'services') {
      rows = await this.prisma.$queryRawUnsafe(
        `SELECT x.*, sc.name AS categoryName, sc.slug AS categorySlug,
          m.url AS coverUrl, m.altText AS coverAlt
         FROM Service x
         JOIN ServiceCategory sc ON sc.id = x.serviceCategoryId
         LEFT JOIN Media m ON m.id = x.coverMediaId
         WHERE x.slug = ? AND x.status = 'PUBLISHED'
           AND (x.publishedAt IS NULL OR x.publishedAt <= NOW()) LIMIT 1`,
        slug,
      );
    } else if (type === 'projects') {
      rows = await this.prisma.$queryRawUnsafe(
        `SELECT x.*, m.url AS coverUrl, m.altText AS coverAlt
         FROM Project x LEFT JOIN Media m ON m.id = x.coverMediaId
         WHERE x.slug = ? AND x.status = 'PUBLISHED'
           AND (x.publishedAt IS NULL OR x.publishedAt <= NOW()) LIMIT 1`,
        slug,
      );
    } else {
      rows = await this.prisma.$queryRawUnsafe(
        `SELECT x.*, c.name AS categoryName, c.slug AS categorySlug,
          CONCAT(COALESCE(u.firstName, ''), ' ', COALESCE(u.lastName, '')) AS authorName,
          m.url AS coverUrl, m.altText AS coverAlt
         FROM Post x
         JOIN Category c ON c.id = x.categoryId
         JOIN User u ON u.id = x.authorId
         LEFT JOIN Media m ON m.id = x.coverMediaId
         WHERE x.slug = ? AND x.status = 'PUBLISHED'
           AND (x.publishedAt IS NULL OR x.publishedAt <= NOW()) LIMIT 1`,
        slug,
      );
    }

    if (!rows.length) throw new NotFoundException('Content not found');
    const item = this.normalizeRow(rows[0]);

    if (type === 'projects') {
      const media = await this.prisma.$queryRawUnsafe(
        `SELECT m.*, pm.caption, pm.sortOrder
         FROM ProjectMedia pm JOIN Media m ON m.id = pm.mediaId
         WHERE pm.projectId = ? ORDER BY pm.sortOrder ASC`,
        item.id,
      );
      return { success: true, data: { ...item, album: media } };
    }

    if (type === 'posts') {
      const tags = await this.prisma.$queryRawUnsafe(
        `SELECT t.id, t.name, t.slug
         FROM PostTag pt JOIN Tag t ON t.id = pt.tagId
         WHERE pt.postId = ? ORDER BY t.name ASC`,
        item.id,
      );
      return { success: true, data: { ...item, tags } };
    }

    const relatedSlugs = Array.isArray(item.relatedServiceSlugs) ? item.relatedServiceSlugs : [];
    const related = relatedSlugs.length
      ? await this.prisma.$queryRawUnsafe(
          `SELECT x.id, x.title, x.slug, x.excerpt, m.url AS coverUrl
           FROM Service x LEFT JOIN Media m ON m.id = x.coverMediaId
           WHERE x.slug IN (${relatedSlugs.map(() => '?').join(',')}) AND x.status = 'PUBLISHED'`,
          ...relatedSlugs,
        )
      : [];
    return { success: true, data: { ...item, related } };
  }

  async listAdmin(typeValue: string, query: ContentQueryDto) {
    this.assertType(typeValue);
    const type = typeValue;
    if (type === 'services' || type === 'projects' || type === 'posts') {
      const table = type === 'services' ? 'Service' : type === 'projects' ? 'Project' : 'Post';
      const clauses = ['1=1'];
      const params: unknown[] = [];
      if (query.q) {
        clauses.push('(x.title LIKE ? OR x.slug LIKE ?)');
        params.push(`%${query.q}%`, `%${query.q}%`);
      }
      if (query.status) {
        clauses.push('x.status = ?');
        params.push(query.status);
      }
      if (typeof query.featured === 'boolean') {
        clauses.push('x.isFeatured = ?');
        params.push(query.featured);
      }
      const where = `WHERE ${clauses.join(' AND ')}`;
      return this.paginate(
        `SELECT x.*, m.url AS coverUrl FROM ${table} x LEFT JOIN Media m ON m.id = x.coverMediaId
         ${where} ORDER BY x.updatedAt DESC`,
        `SELECT COUNT(*) AS total FROM ${table} x ${where}`,
        params,
        query.page || 1,
        query.limit || 20,
      );
    }

    const config = {
      'service-categories': { table: 'ServiceCategory', label: 'name', extra: '' },
      categories: { table: 'Category', label: 'name', extra: "AND x.categoryType = 'POST'" },
      tags: { table: 'Tag', label: 'name', extra: '' },
      media: { table: 'Media', label: 'name', extra: '' },
    }[type];
    const clauses = ['1=1', config.extra].filter(Boolean);
    const params: unknown[] = [];
    if (query.q) {
      clauses.push(`(x.${config.label} LIKE ? OR ${type === 'media' ? 'x.url' : 'x.slug'} LIKE ?)`);
      params.push(`%${query.q}%`, `%${query.q}%`);
    }
    if (typeof query.active === 'boolean') {
      clauses.push('x.isActive = ?');
      params.push(query.active);
    }
    const where = `WHERE ${clauses.join(' AND ')}`;
    return this.paginate(
      `SELECT x.* FROM ${config.table} x ${where} ORDER BY x.updatedAt DESC`,
      `SELECT COUNT(*) AS total FROM ${config.table} x ${where}`,
      params,
      query.page || 1,
      query.limit || 20,
    );
  }

  async findAdmin(typeValue: string, identifier: string) {
    this.assertType(typeValue);
    const type = typeValue;
    const tableMap: Record<ContentType, string> = {
      services: 'Service',
      'service-categories': 'ServiceCategory',
      projects: 'Project',
      posts: 'Post',
      categories: 'Category',
      tags: 'Tag',
      media: 'Media',
    };
    const table = tableMap[type];
    const idField = type === 'service-categories' ? 'id' : /^\d+$/.test(identifier) ? 'id' : 'slug';
    const rows = await this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT * FROM ${table} WHERE ${idField} = ? LIMIT 1`,
      idField === 'id' && type !== 'service-categories' ? Number(identifier) : identifier,
    );
    if (!rows.length) throw new NotFoundException('Content not found');
    return { success: true, data: this.normalizeRow(rows[0]) };
  }

  private async assertUniqueSlug(table: string, slug: string, id?: number | string) {
    const params: unknown[] = [slug];
    let sql = `SELECT id FROM ${table} WHERE slug = ?`;
    if (id !== undefined) {
      sql += ' AND id <> ?';
      params.push(id);
    }
    sql += ' LIMIT 1';
    const rows = await this.prisma.$queryRawUnsafe<Array<{ id: number | string }>>(sql, ...params);
    if (rows.length) throw new ConflictException(`Slug already exists: ${slug}`);
  }

  private json(value: unknown) {
    if (value === undefined || value === null || value === '') return null;
    return JSON.stringify(value);
  }

  async createAdmin(typeValue: string, payload: ContentPayloadDto) {
    this.assertType(typeValue);
    const type = typeValue;
    const displayName = payload.title || payload.name;
    if (!displayName) throw new BadRequestException('title or name is required');
    const slug = payload.slug || this.slugify(displayName);

    if (type !== 'media') {
      const table = type === 'services' ? 'Service' : type === 'service-categories' ? 'ServiceCategory' : type === 'projects' ? 'Project' : type === 'posts' ? 'Post' : type === 'categories' ? 'Category' : 'Tag';
      await this.assertUniqueSlug(table, slug);
    }

    if (type === 'services') {
      if (!payload.serviceCategoryId) throw new BadRequestException('serviceCategoryId is required');
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO Service
        (title, slug, excerpt, content, pricing, process, warranty, faq, relatedServiceSlugs,
         status, isFeatured, sortOrder, publishedAt, seoTitle, seoDescription,
         serviceCategoryId, coverMediaId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
        payload.title, slug, payload.excerpt ?? null, payload.content ?? null,
        this.json(payload.pricing), this.json(payload.process), payload.warranty ?? null,
        this.json(payload.faq), this.json(payload.relatedServiceSlugs), payload.status ?? 'DRAFT',
        payload.isFeatured ?? false, payload.sortOrder ?? 0,
        payload.publishedAt ? new Date(payload.publishedAt) : null,
        payload.seoTitle ?? null, payload.seoDescription ?? null,
        payload.serviceCategoryId, payload.coverMediaId ?? null,
      );
    } else if (type === 'projects') {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO Project
        (title, slug, excerpt, clientName, location, startedAt, completedAt, tasks, content, result,
         status, isFeatured, sortOrder, publishedAt, seoTitle, seoDescription, coverMediaId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
        payload.title, slug, payload.excerpt ?? null, payload.clientName ?? null, payload.location ?? null,
        payload.startedAt ? new Date(payload.startedAt) : null,
        payload.completedAt ? new Date(payload.completedAt) : null,
        this.json(payload.tasks), payload.content ?? null, payload.result ?? null,
        payload.status ?? 'DRAFT', payload.isFeatured ?? false, payload.sortOrder ?? 0,
        payload.publishedAt ? new Date(payload.publishedAt) : null,
        payload.seoTitle ?? null, payload.seoDescription ?? null, payload.coverMediaId ?? null,
      );
    } else if (type === 'posts') {
      if (!payload.categoryId || !payload.authorId) throw new BadRequestException('categoryId and authorId are required');
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO Post
        (title, slug, excerpt, content, status, isFeatured, publishedAt, seoTitle, seoDescription,
         canonicalUrl, categoryId, authorId, coverMediaId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
        payload.title, slug, payload.excerpt ?? null, payload.content ?? null,
        payload.status ?? 'DRAFT', payload.isFeatured ?? false,
        payload.publishedAt ? new Date(payload.publishedAt) : null,
        payload.seoTitle ?? null, payload.seoDescription ?? null, payload.canonicalUrl ?? null,
        payload.categoryId, payload.authorId, payload.coverMediaId ?? null,
      );
    } else if (type === 'service-categories') {
      const id = payload.slug || slug;
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO ServiceCategory
        (id, name, slug, icon, description, summary, coverMediaId, isActive, isFeatured,
         sortOrder, seoTitle, seoDescription, createdAt, updatedAt)
         VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
        id, payload.name, slug, payload.description ?? null, payload.summary ?? null,
        payload.coverMediaId ?? null, payload.isActive ?? true, payload.isFeatured ?? false,
        payload.sortOrder ?? 0, payload.seoTitle ?? null, payload.seoDescription ?? null,
      );
    } else if (type === 'categories') {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO Category
        (name, slug, description, categoryType, isActive, sortOrder, seoTitle, seoDescription, createdAt, updatedAt)
         VALUES (?, ?, ?, 'POST', ?, ?, ?, ?, NOW(3), NOW(3))`,
        payload.name, slug, payload.description ?? null, payload.isActive ?? true,
        payload.sortOrder ?? 0, payload.seoTitle ?? null, payload.seoDescription ?? null,
      );
    } else if (type === 'tags') {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO Tag (name, slug, description, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, NOW(3), NOW(3))`,
        payload.name, slug, payload.description ?? null, payload.isActive ?? true,
      );
    } else {
      if (!payload.url) throw new BadRequestException('url is required');
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO Media
        (name, url, altText, mimeType, width, height, sizeBytes, provider, publicId, folder, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
        payload.name, payload.url, payload.altText ?? null, payload.mimeType ?? 'image/jpeg',
        payload.width ?? null, payload.height ?? null, payload.sizeBytes ?? null,
        payload.provider ?? null, payload.publicId ?? null, payload.folder ?? null,
        payload.isActive ?? true,
      );
    }

    const inserted = await this.prisma.$queryRawUnsafe<Array<{ id: number }>>('SELECT LAST_INSERT_ID() AS id');
    const identifier = type === 'service-categories' ? payload.slug || slug : inserted[0]?.id;
    if ((type === 'projects' || type === 'posts') && identifier) {
      await this.syncRelations(type, Number(identifier), payload);
    }
    return this.findAdmin(type, String(identifier || slug));
  }

  async updateAdmin(typeValue: string, identifier: string, payload: ContentPayloadDto) {
    this.assertType(typeValue);
    const type = typeValue;
    const current = await this.findAdmin(type, identifier);
    const id = current.data.id as number | string;
    const table = type === 'services' ? 'Service' : type === 'service-categories' ? 'ServiceCategory' : type === 'projects' ? 'Project' : type === 'posts' ? 'Post' : type === 'categories' ? 'Category' : type === 'tags' ? 'Tag' : 'Media';

    const allowed: Record<ContentType, string[]> = {
      services: ['title','slug','excerpt','content','pricing','process','warranty','faq','relatedServiceSlugs','status','isFeatured','sortOrder','publishedAt','seoTitle','seoDescription','serviceCategoryId','coverMediaId'],
      'service-categories': ['name','slug','description','summary','coverMediaId','isActive','isFeatured','sortOrder','seoTitle','seoDescription'],
      projects: ['title','slug','excerpt','clientName','location','startedAt','completedAt','tasks','content','result','status','isFeatured','sortOrder','publishedAt','seoTitle','seoDescription','coverMediaId'],
      posts: ['title','slug','excerpt','content','status','isFeatured','publishedAt','seoTitle','seoDescription','canonicalUrl','categoryId','authorId','coverMediaId'],
      categories: ['name','slug','description','isActive','sortOrder','seoTitle','seoDescription'],
      tags: ['name','slug','description','isActive'],
      media: ['name','url','altText','mimeType','width','height','sizeBytes','provider','publicId','folder','isActive'],
    };

    const entries = allowed[type]
      .filter((key) => (payload as Record<string, unknown>)[key] !== undefined)
      .map((key) => {
        let value = (payload as Record<string, unknown>)[key];
        if (['pricing','process','faq','tasks','relatedServiceSlugs'].includes(key)) value = this.json(value);
        if (['publishedAt','startedAt','completedAt'].includes(key) && value) value = new Date(String(value));
        return [key, value] as const;
      });
    if (!entries.length && !payload.mediaIds && !payload.tagIds) return current;

    const nextSlug = entries.find(([key]) => key === 'slug')?.[1];
    if (typeof nextSlug === 'string' && type !== 'media') await this.assertUniqueSlug(table, nextSlug, id);

    if (entries.length) {
      const assignments = entries.map(([key]) => `${key} = ?`).join(', ');
      await this.prisma.$executeRawUnsafe(
        `UPDATE ${table} SET ${assignments}, updatedAt = NOW(3) WHERE id = ?`,
        ...entries.map(([, value]) => value),
        id,
      );
    }
    if ((type === 'projects' || type === 'posts') && typeof id === 'number') await this.syncRelations(type, id, payload);
    return this.findAdmin(type, String(id));
  }

  private async syncRelations(type: 'projects' | 'posts', id: number, payload: ContentPayloadDto) {
    if (type === 'projects' && payload.mediaIds) {
      await this.prisma.$executeRawUnsafe('DELETE FROM ProjectMedia WHERE projectId = ?', id);
      for (const [index, mediaId] of payload.mediaIds.entries()) {
        await this.prisma.$executeRawUnsafe(
          'INSERT INTO ProjectMedia (projectId, mediaId, sortOrder) VALUES (?, ?, ?)',
          id,
          mediaId,
          index,
        );
      }
    }
    if (type === 'posts' && payload.tagIds) {
      await this.prisma.$executeRawUnsafe('DELETE FROM PostTag WHERE postId = ?', id);
      for (const tagId of payload.tagIds) {
        await this.prisma.$executeRawUnsafe('INSERT INTO PostTag (postId, tagId) VALUES (?, ?)', id, tagId);
      }
    }
  }

  async removeAdmin(typeValue: string, identifier: string) {
    this.assertType(typeValue);
    const type = typeValue;
    const current = await this.findAdmin(type, identifier);
    const id = current.data.id as number | string;
    const table = type === 'services' ? 'Service' : type === 'service-categories' ? 'ServiceCategory' : type === 'projects' ? 'Project' : type === 'posts' ? 'Post' : type === 'categories' ? 'Category' : type === 'tags' ? 'Tag' : 'Media';

    if (['services','projects','posts'].includes(type)) {
      await this.prisma.$executeRawUnsafe(`UPDATE ${table} SET status = 'ARCHIVED', updatedAt = NOW(3) WHERE id = ?`, id);
    } else {
      await this.prisma.$executeRawUnsafe(`UPDATE ${table} SET isActive = FALSE, updatedAt = NOW(3) WHERE id = ?`, id);
    }
    return { success: true, data: { id, archived: true } };
  }
}
