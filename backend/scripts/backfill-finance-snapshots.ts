import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

async function main() {
  const db = prisma as any;
  const requests = await db.serviceRequest.findMany({
    where: { status: 'completed', financeSnapshot: null },
    include: { quotes: { where: { status: 'approved' }, orderBy: { version: 'desc' }, take: 1 } },
  });
  console.log(`${apply ? 'APPLY' : 'DRY-RUN'}: ${requests.length} finance snapshot(s)`);
  for (const request of requests) {
    const quote = request.quotes[0];
    if (!quote || !request.completedAt) { console.log(`SKIP ${request.id}: missing approved quote/completedAt`); continue; }
    const partsCost = Number(quote.parts || 0), rate = 40;
    const data = { serviceRequestId: request.id, approvedQuoteId: quote.id, approvedVersion: quote.version, revenue: request.finalPrice, partsCost, technicianPay: Math.round(Math.max(0, Number(request.finalPrice) - partsCost) * rate / 100), policySnapshot: { technicianPayType: 'percentage', technicianPayRate: rate, includePartsInCommission: false, source: 'legacy-backfill-v1' }, completedAt: request.completedAt };
    console.log(`${request.id}: quote v${quote.version}, revenue=${request.finalPrice}`);
    if (apply) await db.serviceFinanceSnapshot.create({ data });
  }
}

main().finally(() => prisma.$disconnect());
