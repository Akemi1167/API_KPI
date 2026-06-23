import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { KpiEventKind } from '../../common/enums/kpi-event-kind.enum';

/** Tham số truy vấn danh sách sự kiện KPI có phân trang. */
export class FindKpiEventsQueryDto extends PaginationQueryDto {
  /** Lọc theo nhân viên. */
  @IsOptional()
  @IsMongoId()
  userId?: string;

  /** Lọc theo kỳ KPI. */
  @IsOptional()
  @IsMongoId()
  periodId?: string;

  /** Lọc theo loại sự kiện: cộng hoặc trừ điểm. */
  @IsOptional()
  @IsEnum(KpiEventKind)
  eventKind?: KpiEventKind;
}
