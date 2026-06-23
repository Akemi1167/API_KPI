import { IsMongoId } from 'class-validator';

/** Dữ liệu yêu cầu tính kết quả KPI cho một nhân viên trong một kỳ. */
export class CalculateKpiResultDto {
  /** ID nhân viên cần tính KPI. */
  @IsMongoId()
  userId: string;

  /** ID kỳ KPI áp dụng. */
  @IsMongoId()
  periodId: string;
}
