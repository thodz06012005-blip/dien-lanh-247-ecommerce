import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CountRow {
  total: bigint | number;
}

async function count(sql: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<CountRow[]>(sql);
  return Number(rows[0]?.total ?? 0);
}

async function assertCount(label: string, sql: string, minimum = 1) {
  const value = await count(sql);
  if (value < minimum) {
    throw new Error(`${label}: expected at least ${minimum}, received ${value}`);
  }
  console.log(`✓ ${label}: ${value}`);
}

async function assertZero(label: string, sql: string) {
  const value = await count(sql);
  if (value !== 0) {
    throw new Error(`${label}: expected 0, received ${value}`);
  }
  console.log(`✓ ${label}`);
}

async function main() {
  await assertCount('managed services seeded', 'SELECT COUNT(*) AS total FROM Service');
  await assertCount('managed projects seeded', 'SELECT COUNT(*) AS total FROM Project');
  await assertCount('managed posts seeded', 'SELECT COUNT(*) AS total FROM Post');
  await assertCount('media seeded', 'SELECT COUNT(*) AS total FROM Media');
  await assertCount('tags seeded', 'SELECT COUNT(*) AS total FROM Tag');

  await assertZero(
    'service slugs are unique',
    'SELECT COUNT(*) AS total FROM (SELECT slug FROM Service GROUP BY slug HAVING COUNT(*) > 1) duplicate_slugs',
  );
  await assertZero(
    'project slugs are unique',
    'SELECT COUNT(*) AS total FROM (SELECT slug FROM Project GROUP BY slug HAVING COUNT(*) > 1) duplicate_slugs',
  );
  await assertZero(
    'post slugs are unique',
    'SELECT COUNT(*) AS total FROM (SELECT slug FROM Post GROUP BY slug HAVING COUNT(*) > 1) duplicate_slugs',
  );
  await assertZero(
    'tag slugs are unique',
    'SELECT COUNT(*) AS total FROM (SELECT slug FROM Tag GROUP BY slug HAVING COUNT(*) > 1) duplicate_slugs',
  );

  await assertCount(
    'public services are published and due',
    "SELECT COUNT(*) AS total FROM Service WHERE status = 'PUBLISHED' AND (publishedAt IS NULL OR publishedAt <= NOW())",
  );
  await assertCount(
    'project album relation exists',
    'SELECT COUNT(*) AS total FROM ProjectMedia',
  );
  await assertCount(
    'post tag relation exists',
    'SELECT COUNT(*) AS total FROM PostTag',
  );

  const categoryColumns = await count(
    "SELECT COUNT(*) AS total FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Category' AND COLUMN_NAME IN ('categoryType','isActive','sortOrder','seoTitle','seoDescription')",
  );
  if (categoryColumns !== 5) throw new Error(`Category migration incomplete: ${categoryColumns}/5 columns`);

  const serviceCategoryColumns = await count(
    "SELECT COUNT(*) AS total FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ServiceCategory' AND COLUMN_NAME IN ('summary','coverMediaId','isActive','isFeatured','sortOrder','seoTitle','seoDescription')",
  );
  if (serviceCategoryColumns !== 7) {
    throw new Error(`ServiceCategory migration incomplete: ${serviceCategoryColumns}/7 columns`);
  }

  console.log('Phase 5 database migration and seed verification passed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
