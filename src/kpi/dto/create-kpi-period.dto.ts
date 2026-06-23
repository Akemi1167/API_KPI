import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/** Dữ liệu tạo kỳ KPI mới. */
export class CreateKpiPeriodDto {
  /** Mã kỳ KPI; nếu bỏ trống hệ thống tự sinh. */
  @IsOptional()
  @IsString()
  code?: string;

  /** Tên hiển thị của kỳ KPI. */
  @IsString()
  @IsNotEmpty()
  name: string;

  /** Năm của kỳ; nếu bỏ trống lấy từ startDate. */
  @IsOptional()
  @IsInt()
  @Min(2000)
  year?: number;

  /** Tháng của kỳ (1–12); nếu bỏ trống lấy từ startDate. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  /** Ngày bắt đầu kỳ (ISO 8601). */
  @IsDateString()
  startDate: string;

  /** Ngày kết thúc kỳ (ISO 8601). */
  @IsDateString()
  endDate: string;

  /** Điểm gốc làm cơ sở tính KPI; mặc định 100. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseScore?: number;
}
