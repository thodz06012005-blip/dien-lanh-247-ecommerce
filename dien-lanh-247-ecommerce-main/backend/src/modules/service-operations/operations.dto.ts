import { IsArray, IsIn, IsInt, IsOptional, IsString, Length, Matches, Max, MaxLength, Min, ArrayMaxSize } from 'class-validator';
export class TechnicianLoginDto {
  @IsString() @Matches(/^(?:0\d{9}|\+84\d{9})$/) phone: string;
  @IsString() @Matches(/^\d{6}$/) pin: string;
}
export class TechnicianAccessDto { @IsString() @Matches(/^\d{6}$/) pin: string; }
export class DecisionDto {
  @IsIn(['accepted', 'rejected']) decision: 'accepted' | 'rejected';
  @IsOptional() @IsString() @Length(3, 1000) reason?: string;
}
export class ProgressDto { @IsIn(['in_progress']) status: 'in_progress'; }
export class InspectionDto {
  @IsInt() @Min(0) @Max(9999999999) estimatedPrice: number;
  @IsString() @Length(3, 1000) diagnosis: string;
  @IsIn(['pending', 'approved', 'rejected']) customerApprovalStatus: string;
}
export class AdminInspectionDto {
  @IsInt() @Min(0) @Max(9999999999) estimatedPrice: number;
  @IsString() @Length(3, 1000) inspectionNote: string;
  @IsIn(['pending', 'approved', 'rejected']) customerApprovalStatus: string;
}
export class CompleteDto {
  @IsInt() @Min(0) @Max(9999999999) finalPrice: number;
  @IsString() @Length(3, 1000) completionNote: string;
  @IsIn(['paid', 'unpaid']) paymentStatus: string;
  @IsOptional() @IsArray() @ArrayMaxSize(4) @IsString({ each: true }) @MaxLength(250000, { each: true }) photos?: string[];
}
export class FinanceUpdateDto {
  @IsInt() @Min(0) @Max(9999999999) partsCost: number;
  @IsInt() @Min(0) @Max(9999999999) amountCollected: number;
  @IsIn(['paid', 'unpaid', 'partial']) paymentStatus: string;
  @IsOptional() @IsString() @MaxLength(1000) note?: string;
}
export class SettlementDto {
  @IsIn(['pending', 'settled']) status: string;
  @IsOptional() @IsString() @MaxLength(1000) note?: string;
}
