import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import { basename, extname } from 'node:path';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MIME_EXTENSIONS: Record<string, Set<string>> = {
  'image/jpeg': new Set(['.jpg', '.jpeg']),
  'image/png': new Set(['.png']),
  'image/webp': new Set(['.webp']),
};
const DANGEROUS_INNER_EXTENSION = /\.(?:php\d*|phtml|phar|cgi|pl|py|rb|sh|bash|ps1|cmd|bat|exe|dll|com|js|mjs|cjs|html?|svg)(?:\.|$)/i;

function hasBytes(buffer: Buffer, expected: number[], offset = 0) {
  if (buffer.length < offset + expected.length) return false;
  return expected.every((byte, index) => buffer[offset + index] === byte);
}

function hasValidSignature(file: Express.Multer.File) {
  const buffer = file.buffer;
  if (!Buffer.isBuffer(buffer)) return false;
  if (file.mimetype === 'image/jpeg') return hasBytes(buffer, [0xff, 0xd8, 0xff]);
  if (file.mimetype === 'image/png') {
    return hasBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }
  if (file.mimetype === 'image/webp') {
    return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  }
  return false;
}

export function assertSafeImageMetadata(file: Express.Multer.File) {
  const cleanName = basename(file.originalname || 'upload').normalize('NFKC');
  const lowerName = cleanName.toLowerCase();
  const extension = extname(lowerName);
  const allowedForMime = MIME_EXTENSIONS[file.mimetype];

  if (!allowedForMime || !ALLOWED_EXTENSIONS.has(extension) || !allowedForMime.has(extension)) {
    throw new BadRequestException('Chỉ chấp nhận ảnh JPG, JPEG, PNG hoặc WebP đúng định dạng.');
  }
  if (DANGEROUS_INNER_EXTENSION.test(lowerName.slice(0, -extension.length))) {
    throw new BadRequestException('Tên tệp chứa phần mở rộng không an toàn.');
  }
  if (!Number.isInteger(file.size) || file.size <= 0 || file.size > MAX_FILE_BYTES) {
    throw new BadRequestException('Ảnh phải có dung lượng lớn hơn 0 và không vượt quá 5 MB.');
  }

  file.originalname = cleanName.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 120);
}

@Injectable()
export class SafeImageFilesPipe implements PipeTransform<Express.Multer.File[]> {
  transform(files: Express.Multer.File[]) {
    if (!Array.isArray(files) || files.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một ảnh.');
    }
    if (files.length > 5) {
      throw new BadRequestException('Mỗi lần chỉ được tải tối đa 5 ảnh.');
    }

    for (const file of files) {
      assertSafeImageMetadata(file);
      if (!hasValidSignature(file)) {
        throw new BadRequestException(`Nội dung tệp ${file.originalname} không khớp định dạng khai báo.`);
      }
    }
    return files;
  }
}
