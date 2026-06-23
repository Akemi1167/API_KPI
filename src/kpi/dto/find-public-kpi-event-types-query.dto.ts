import { IsEnum, IsOptional } from 'class-validator';
import { KpiEventKind } from '../../common/enums/kpi-event-kind.enum';

/** Tham số lọc danh mục cộng/trừ điểm KPI công khai. */
export class FindPublicKpiEventTypesQueryDto {
  /** Lọc theo loại: cộng điểm (BONUS) hoặc trừ điểm (PENALTY). */
  @IsOptional()
  @IsEnum(KpiEventKind)
  eventKind?: KpiEventKind;
}
