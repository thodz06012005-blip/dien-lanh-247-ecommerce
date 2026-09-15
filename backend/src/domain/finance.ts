export type PaymentEntryType = 'collection' | 'refund' | 'adjustment';

export const signedPaymentAmount = (type: PaymentEntryType, amount: number) =>
  type === 'refund' ? -Math.abs(amount) : type === 'collection' ? Math.abs(amount) : amount;

export const paymentSummary = (total: number, entries: Array<{ type: PaymentEntryType; amount: unknown }>) => {
  const netCollected = entries.reduce((sum, entry) => sum + signedPaymentAmount(entry.type, Number(entry.amount)), 0);
  const collected = Math.max(0, netCollected);
  return {
    total,
    collected,
    debt: Math.max(0, total - collected),
    status: collected <= 0 ? 'unpaid' : collected >= total ? 'paid' : 'partial',
  } as const;
};

export const monthBoundsInVietnam = (month: string) => {
  const [year, monthNumber] = month.split('-').map(Number);
  const start = new Date(`${month}-01T00:00:00+07:00`);
  const nextMonth = monthNumber === 12 ? `${year + 1}-01` : `${year}-${String(monthNumber + 1).padStart(2, '0')}`;
  return { gte: start, lt: new Date(`${nextMonth}-01T00:00:00+07:00`) };
};
