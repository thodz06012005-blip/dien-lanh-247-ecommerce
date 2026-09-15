import type { FinancePolicy } from './business-config';
export interface FinanceSnapshot { version: number; recordedAt: string; source: string; policy: FinancePolicy; revenue: number; partsCost: number; commissionBase: number; technicianPay: number; }
export function createFinanceSnapshot(request: { finalPrice?: unknown; partsCost?: unknown }, finance: FinancePolicy, recordedAt?: string, source?: string): FinanceSnapshot;
export function calculateTechnicianPay(request: { finalPrice?: unknown; partsCost?: unknown; financeSnapshot?: FinanceSnapshot | null }, finance: FinancePolicy): number;
export function ensureFinanceSnapshots(db: any, now?: string): boolean;
export function buildReport(db: any, month: string): any;
export function exportFinanceXml(report: any, month: string): string;

export function businessDate(value: string | Date | null | undefined): string;
