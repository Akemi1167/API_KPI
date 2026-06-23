import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { KpiEventKind } from '../../common/enums/kpi-event-kind.enum';

/** Dữ liệu tạo loại sự kiện KPI (cộng hoặc trừ điểm). */
export class CreateKpiEventTypeDto {
  /** Mã loại sự kiện, duy nhất trong hệ thống. */
  @IsString()
  @IsNotEmpty()
  code: string;

  /** Tên hiển thị của loại sự kiện. */
  @IsString()
  @IsNotEmpty()
  name: string;

  /** Mô tả chi tiết (tùy chọn). */
  @IsOptional()
  @IsString()
  description?: string;

  /** Phân loại: cộng điểm (BONUS) hoặc trừ điểm (PENALTY). */
  @IsEnum(KpiEventKind)
  eventKind: KpiEventKind;

  /** Điểm mặc định áp dụng khi tạo sự kiện, trước khi nhân số lượng. */
  @IsNumber()
  defaultPoints: number;
}
