import { BadRequestException } from '@nestjs/common';
import type { CreateQuoteDto, QuoteLineDto } from './dto/operations.dto';

const toCents = (value: number) => Math.round((Number(value) + Number.EPSILON) * 100);
const fromCents = (value: number) => Number((value / 100).toFixed(2));

export interface CalculatedQuoteLine extends QuoteLineDto {
  lineTotal: number;
}

export interface CalculatedQuote {
  lines: CalculatedQuoteLine[];
  laborSubtotal: number;
  materialSubtotal: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export function calculateQuote(dto: CreateQuoteDto): CalculatedQuote {
  if (!dto.lines.length) throw new BadRequestException('Báo giá phải có ít nhất một dòng');

  const lines = dto.lines.map((line) => {
    const quantityMilli = Math.round(Number(line.quantity) * 1000);
    const unitPriceCents = toCents(Number(line.unitPrice));
    const lineTotalCents = Math.round((quantityMilli * unitPriceCents) / 1000);
    if (!Number.isFinite(lineTotalCents) || lineTotalCents < 0) {
      throw new BadRequestException('Dòng báo giá không hợp lệ');
    }
    return { ...line, lineTotal: fromCents(lineTotalCents) };
  });

  const laborCents = lines
    .filter((line) => line.lineType === 'LABOR')
    .reduce((sum, line) => sum + toCents(line.lineTotal), 0);
  const materialCents = lines
    .filter((line) => line.lineType === 'MATERIAL')
    .reduce((sum, line) => sum + toCents(line.lineTotal), 0);
  const subtotalCents = laborCents + materialCents;

  let discountCents = 0;
  if (dto.discountType === 'PERCENT') {
    if (dto.discountValue > 100) throw new BadRequestException('Giảm giá phần trăm không vượt quá 100%');
    discountCents = Math.round((subtotalCents * dto.discountValue) / 100);
  } else {
    discountCents = toCents(dto.discountValue);
  }
  discountCents = Math.min(Math.max(discountCents, 0), subtotalCents);

  const taxableCents = subtotalCents - discountCents;
  const taxCents = Math.round((taxableCents * dto.taxRate) / 100);
  const totalCents = taxableCents + taxCents;

  return {
    lines,
    laborSubtotal: fromCents(laborCents),
    materialSubtotal: fromCents(materialCents),
    subtotal: fromCents(subtotalCents),
    discountAmount: fromCents(discountCents),
    taxAmount: fromCents(taxCents),
    totalAmount: fromCents(totalCents),
  };
}
