import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { KpiEventKind } from '../../common/enums/kpi-event-kind.enum';

/** Tham số truy vấn danh sách loại sự kiện KPI có phân trang. */
export class FindKpiEventTypesQueryDto extends PaginationQueryDto {
  /** Lọc theo loại: cộng điểm (BONUS) hoặc trừ điểm (PENALTY). */
  @IsOptional()
  @IsEnum(KpiEventKind)
  eventKind?: KpiEventKind;
}
