import { IsMongoId } from 'class-validator';

/** Tham số nhân viên xem chi tiết KPI của chính mình theo kỳ. */
export class MeKpiResultBreakdownQueryDto {
  /** ID kỳ KPI. */
  @IsMongoId()
  periodId: string;
}
