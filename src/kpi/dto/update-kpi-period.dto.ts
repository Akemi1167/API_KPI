import { PartialType } from '@nestjs/mapped-types';
import { CreateKpiPeriodDto } from './create-kpi-period.dto';

/** Dữ liệu cập nhật kỳ KPI; tất cả trường đều tùy chọn. */
export class UpdateKpiPeriodDto extends PartialType(CreateKpiPeriodDto) {}
