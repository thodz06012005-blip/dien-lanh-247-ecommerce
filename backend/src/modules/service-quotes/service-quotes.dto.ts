import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
export class QuoteDecisionDto { @IsEnum(['approved','rejected']) decision:'approved'|'rejected'; @IsOptional() @IsString() evidence?:string; }
export class PhoneQuoteDecisionDto extends QuoteDecisionDto { @IsEnum(['phone']) channel:'phone'; @IsString() @MinLength(3) note:string; }
export class CompleteQuoteRefDto { @IsString() quoteId:string; @IsInt() @Min(1) version:number; }
