import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { KpiPeriodStatus } from '../../common/enums/kpi-period-status.enum';

/** Tham số truy vấn danh sách kỳ KPI có phân trang. */
export class FindKpiPeriodsQueryDto extends PaginationQueryDto {
  /** Lọc theo trạng thái kỳ (OPEN, CLOSED, LOCKED). */
  @IsOptional()
  @IsEnum(KpiPeriodStatus)
  status?: KpiPeriodStatus;

  /** Lọc theo năm. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year?: number;

  /** Lọc theo tháng (1–12). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}
