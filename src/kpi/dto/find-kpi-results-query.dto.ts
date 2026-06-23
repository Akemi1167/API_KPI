import { IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** Tham số truy vấn danh sách kết quả KPI có phân trang. */
export class FindKpiResultsQueryDto extends PaginationQueryDto {
  /** Lọc theo nhân viên. */
  @IsOptional()
  @IsMongoId()
  userId?: string;

  /** Lọc theo kỳ KPI. */
  @IsOptional()
  @IsMongoId()
  periodId?: string;
}
