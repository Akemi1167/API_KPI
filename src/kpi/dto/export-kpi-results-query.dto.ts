import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

/** Tham số xuất báo cáo Excel KPI toàn bộ nhân viên theo kỳ. */
export class ExportKpiResultsQueryDto {
  /** Kỳ KPI cần xuất báo cáo. */
  @ApiProperty({ description: 'ID kỳ KPI' })
  @IsMongoId()
  periodId: string;
}
