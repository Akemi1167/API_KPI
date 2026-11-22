import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SWAGGER_JWT_NAME } from '../../common/decorators/api-admin-auth.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FindKpiPeriodsQueryDto } from '../dto/find-kpi-periods-query.dto';
import { KpiPeriodsService } from '../services/kpi-periods.service';

@ApiTags('My KPI')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth(SWAGGER_JWT_NAME)
@Controller('me/kpi-periods')
export class MeKpiPeriodsController {
  constructor(private readonly kpiPeriodsService: KpiPeriodsService) {}

  @Get()
  @ApiOperation({ summary: 'Xem danh sách kỳ KPI của cổng nhân viên' })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  findAll(@Query() query: FindKpiPeriodsQueryDto) {
    return this.kpiPeriodsService.findAll(query);
  }
}
