import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const writeReports = process.argv.includes('--write');
const strict = process.argv.includes('--strict');

const excludedParts = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.vite',
  '.cache',
  'playwright-report',
  'test-results',
]);

const imageExtensions = new Set(['.svg', '.avif', '.webp', '.png', '.jpg', '.jpeg', '.gif']);
const textExtensions = new Set([
  '.md', '.txt', '.json', '.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.css', '.scss', '.html', '.yml', '.yaml', '.prisma', '.sql', '.env',
]);

function normalize(value) {
  return value.replaceAll('\\', '/');
}

function trackedFiles() {
  const raw = execFileSync('git', ['ls-files', '-z'], { cwd: repoRoot, encoding: 'utf8' });
  return raw.split('\0').filter(Boolean).map(normalize);
}

function shouldIgnore(filePath) {
  return filePath.split('/').some((part) => excludedParts.has(part));
}

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function classify(filePath) {
  if (filePath.startsWith('assets/images/')) return 'hinh-anh-canonical';
  if (filePath.startsWith('frontend-user/')) return 'frontend-khach-hang';
  if (filePath.startsWith('frontend-admin/')) return 'frontend-quan-tri';
  if (filePath.startsWith('backend/')) return 'backend';
  if (filePath.startsWith('mock-api/')) return 'mock-api';
  if (filePath.startsWith('docs/')) return 'tai-lieu';
  if (filePath.startsWith('scripts/')) return 'script';
  if (filePath.startsWith('tests/')) return 'kiem-thu';
  if (filePath.startsWith('.github/')) return 'ci-workflow';
  if (filePath.startsWith('deploy/')) return 'trien-khai';
  return 'thu-muc-goc';
}

function namingWarnings(filePath) {
  const warnings = [];
  const baseName = path.basename(filePath);
  if (/\s/.test(baseName)) warnings.push('ten-co-khoang-trang');
  if (/[^\x00-\x7F]/.test(baseName)) warnings.push('ten-co-ky-tu-ngoai-ascii');
  if (baseName.length > 120) warnings.push('ten-qua-dai');
  if (/^(?:image|img|anh)[-_]?\d+\./i.test(baseName)) warnings.push('ten-chung-chung');
  if (/(?:final[-_]?final|new[-_]?new|test\d*)/i.test(baseName)) warnings.push('ten-phien-ban-khong-ro-rang');
  return warnings;
}

function extractExternalImages(content) {
  return [...content.matchAll(/https:\/\/(?:images\.)?(?:unsplash\.com|pexels\.com|cloudinary\.com|res\.cloudinary\.com)[^\s'"`)]+/g)]
    .map((match) => match[0].replace(/[),.;]+$/, ''));
}

const files = trackedFiles().filter((filePath) => !shouldIgnore(filePath));
const inventory = [];
const basenameMap = new Map();
const hashMap = new Map();
const extensionCounts = new Map();
const groupCounts = new Map();
const rootMarkdown = [];
const externalImageReferences = [];
const missingTrackedFiles = [];

for (const filePath of files) {
  const absolutePath = path.join(repoRoot, filePath);
  if (!existsSync(absolutePath)) {
    missingTrackedFiles.push(filePath);
    continue;
  }

  const stats = statSync(absolutePath);
  if (!stats.isFile()) continue;

  const extension = path.extname(filePath).toLowerCase() || '[khong-co-duoi]';
  const group = classify(filePath);
  const hash = sha256(absolutePath);
  const warnings = namingWarnings(filePath);

  extensionCounts.set(extension, (extensionCounts.get(extension) ?? 0) + 1);
  groupCounts.set(group, (groupCounts.get(group) ?? 0) + 1);

  const baseName = path.basename(filePath).toLowerCase();
  basenameMap.set(baseName, [...(basenameMap.get(baseName) ?? []), filePath]);
  hashMap.set(hash, [...(hashMap.get(hash) ?? []), filePath]);

  if (!filePath.includes('/') && extension === '.md') rootMarkdown.push(filePath);

  if (textExtensions.has(extension) && stats.size <= 2 * 1024 * 1024) {
    const content = readFileSync(absolutePath, 'utf8');
    for (const url of extractExternalImages(content)) {
      externalImageReferences.push({ file: filePath, url });
    }
  }

  inventory.push({
    duongDan: filePath,
    loaiTep: group,
    phanMoRong: extension,
    kichThuoc: stats.size,
    sha256: hash,
    tracked: true,
    nhomDeXuat: group,
    trangThai: warnings.length ? 'can-xem-xet' : 'hop-le',
    canhBaoTen: warnings,
    laHinhAnh: imageExtensions.has(extension),
    ghiChu: '',
  });
}

const duplicateBasenames = [...basenameMap.entries()]
  .filter(([, paths]) => paths.length > 1)
  .map(([name, paths]) => ({ name, paths }));
const duplicateHashes = [...hashMap.entries()]
  .filter(([, paths]) => paths.length > 1)
  .map(([hash, paths]) => ({ hash, paths }));
const namingIssueCount = inventory.filter((item) => item.canhBaoTen.length > 0).length;
const imageCount = inventory.filter((item) => item.laHinhAnh).length;

const summary = {
  generatedAt: new Date().toISOString(),
  trackedFileCount: inventory.length,
  imageCount,
  rootMarkdownCount: rootMarkdown.length,
  externalImageReferenceCount: externalImageReferences.length,
  duplicateBasenameGroupCount: duplicateBasenames.length,
  duplicateHashGroupCount: duplicateHashes.length,
  namingIssueCount,
  missingTrackedFileCount: missingTrackedFiles.length,
  groupCounts: Object.fromEntries([...groupCounts.entries()].sort()),
  extensionCounts: Object.fromEntries([...extensionCounts.entries()].sort()),
};

console.log('FILE ORGANIZATION AUDIT');
console.log(`- Tracked files scanned: ${summary.trackedFileCount}`);
console.log(`- Images: ${summary.imageCount}`);
console.log(`- Root Markdown files: ${summary.rootMarkdownCount}`);
console.log(`- External image references: ${summary.externalImageReferenceCount}`);
console.log(`- Duplicate basename groups: ${summary.duplicateBasenameGroupCount}`);
console.log(`- Duplicate SHA-256 groups: ${summary.duplicateHashGroupCount}`);
console.log(`- Naming warnings: ${summary.namingIssueCount}`);
console.log(`- Missing tracked files: ${summary.missingTrackedFileCount}`);

if (writeReports) {
  const reportDir = path.join(repoRoot, 'docs', 'bao-cao');
  mkdirSync(reportDir, { recursive: true });
  const jsonPath = path.join(reportDir, 'BC_TEP_danh-sach-tep-truoc-sap-xep_gd15_v01.json');
  const markdownPath = path.join(reportDir, 'BC_TEP_kiem-toan-cau-truc-truoc-sap-xep_gd15_v01.md');

  writeFileSync(jsonPath, `${JSON.stringify({ summary, inventory, duplicateBasenames, duplicateHashes, rootMarkdown, externalImageReferences, missingTrackedFiles }, null, 2)}\n`);

  const markdown = [
    '# Báo cáo kiểm toán cấu trúc tệp trước sắp xếp — Giai đoạn 15',
    '',
    `- Thời điểm tạo: ${summary.generatedAt}`,
    `- Số tệp tracked đã quét: ${summary.trackedFileCount}`,
    `- Số hình ảnh: ${summary.imageCount}`,
    `- Số Markdown ở thư mục gốc: ${summary.rootMarkdownCount}`,
    `- Số tham chiếu ảnh ngoài: ${summary.externalImageReferenceCount}`,
    `- Nhóm trùng basename: ${summary.duplicateBasenameGroupCount}`,
    `- Nhóm trùng SHA-256: ${summary.duplicateHashGroupCount}`,
    `- Tệp có cảnh báo đặt tên: ${summary.namingIssueCount}`,
    `- Tệp tracked bị thiếu: ${summary.missingTrackedFileCount}`,
    '',
    '## Markdown ở thư mục gốc',
    '',
    ...(rootMarkdown.length ? rootMarkdown.map((item) => `- \`${item}\``) : ['Không có.']),
    '',
    '## Nhóm tệp theo khu vực',
    '',
    '| Khu vực | Số tệp |',
    '|---|---:|',
    ...Object.entries(summary.groupCounts).map(([name, count]) => `| ${name} | ${count} |`),
    '',
    '## Lưu ý',
    '',
    '- Báo cáo chỉ thống kê và không tự xóa hoặc di chuyển tệp.',
    '- Tệp trùng SHA-256 cần được kiểm tra tham chiếu trước khi hợp nhất.',
    '- Tệp code, migration và cấu hình chuẩn không được đổi tên chỉ để dịch sang tiếng Việt.',
    '- Mọi rename phải được thực hiện bằng `git mv` và có bảng đối chiếu old → new.',
    '',
  ].join('\n');
  writeFileSync(markdownPath, markdown);
  console.log(`- Wrote: ${path.relative(repoRoot, markdownPath)}`);
  console.log(`- Wrote: ${path.relative(repoRoot, jsonPath)}`);
}

const blockingIssues = missingTrackedFiles.length;
const strictIssues = namingIssueCount;
if (blockingIssues > 0 || (strict && strictIssues > 0)) {
  console.error(`File organization audit failed with ${blockingIssues + (strict ? strictIssues : 0)} blocking issue(s).`);
  process.exit(1);
}

console.log('File organization audit passed. Warnings are reported for review and do not delete data.');
