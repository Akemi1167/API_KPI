import { PartialType } from '@nestjs/mapped-types';
import { CreateKpiEventTypeDto } from './create-kpi-event-type.dto';

/** Dữ liệu cập nhật loại sự kiện KPI; tất cả trường đều tùy chọn. */
export class UpdateKpiEventTypeDto extends PartialType(CreateKpiEventTypeDto) {}
