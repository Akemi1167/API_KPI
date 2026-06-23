import {
  IsDateString,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

/** Dữ liệu tạo sự kiện cộng/trừ điểm KPI cho nhân viên. */
export class CreateKpiEventDto {
  /** ID nhân viên được ghi nhận sự kiện. */
  @IsMongoId()
  userId: string;

  /** ID kỳ KPI chứa sự kiện. */
  @IsMongoId()
  periodId: string;

  /** ID loại sự kiện (danh mục cộng/trừ điểm). */
  @IsMongoId()
  eventTypeId: string;

  /** Điểm tùy chỉnh; nếu bỏ trống sẽ lấy từ loại sự kiện. */
  @IsOptional()
  @IsNumber()
  points?: number;

  /** Số lần/lượng áp dụng; mặc định 1. */
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  /** Thời điểm xảy ra sự kiện (ISO 8601); mặc định thời điểm tạo. */
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  /** Ghi chú bổ sung, tối đa 1000 ký tự. */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  /** URL minh chứng (ảnh, tài liệu) kèm theo sự kiện. */
  @IsOptional()
  @IsUrl()
  evidenceUrl?: string;
}
