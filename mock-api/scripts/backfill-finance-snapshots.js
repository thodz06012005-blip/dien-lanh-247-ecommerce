const { readDB, writeDB } = require('../utils/db');
const { freezeSnapshot } = require('../domain/finance');
const apply = process.argv.includes('--apply'), db = readDB(), before = (db.serviceFinanceSnapshots || []).length;
for (const request of db.serviceRequests || []) {
  if (request.status !== 'completed' || !request.completedAt || (db.serviceFinanceSnapshots || []).some(row => row.serviceRequestId === request.id)) continue;
  const quote=(db.serviceQuotes||[]).filter(row=>row.serviceRequestId===request.id&&row.status==='approved').sort((a,b)=>b.version-a.version)[0];
  if (!quote) { console.log(`SKIP ${request.id}: missing approved quote`); continue; }
  freezeSnapshot(db,request,quote,request.completedAt);
  console.log(`${apply?'APPLY':'DRY-RUN'} ${request.id}: quote v${quote.version}`);
}
console.log(`${(db.serviceFinanceSnapshots||[]).length-before} snapshot(s)`);
if (apply) writeDB(db);
