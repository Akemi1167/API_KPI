import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { FindPublicKpiEventTypesQueryDto } from '../dto/find-public-kpi-event-types-query.dto';
import { KpiEventTypesService } from '../services/kpi-event-types.service';

@ApiTags('Public KPI Catalog')
@Public()
@Controller('public/kpi-event-types')
export class PublicKpiEventTypesController {
  constructor(private readonly kpiEventTypesService: KpiEventTypesService) {}

  @Get()
  @ApiOperation({
    summary: 'Xem danh mục loại cộng/trừ điểm KPI (công khai)',
    description:
      'Trả về các loại cộng/trừ điểm đang áp dụng kèm diễn giải, dùng cho nhân viên tra cứu quy chế KPI.',
  })
  findCatalog(@Query() query: FindPublicKpiEventTypesQueryDto) {
    return this.kpiEventTypesService.findPublicCatalog(query);
  }
}
