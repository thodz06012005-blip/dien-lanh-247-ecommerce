import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
export class QuoteDecisionDto { @IsEnum(['approved','rejected']) decision:'approved'|'rejected'; @IsOptional() @IsString() evidence?:string; }
export class PhoneQuoteDecisionDto extends QuoteDecisionDto { @IsEnum(['phone']) channel:'phone'; @IsString() @MinLength(3) note:string; }
export class RecordPaymentDto { @IsNumber() @Min(1) amount:number; @IsString() method:string; @IsOptional() @IsString() reference?:string; }
export class CompleteQuoteRefDto { @IsString() quoteId:string; @IsInt() @Min(1) version:number; }
