import { IsMongoId } from 'class-validator';

/** Tham số xem chi tiết quá trình cộng/trừ điểm KPI của nhân viên trong một kỳ. */
export class KpiResultBreakdownQueryDto {
  /** ID nhân viên. */
  @IsMongoId()
  userId: string;

  /** ID kỳ KPI. */
  @IsMongoId()
  periodId: string;
}
