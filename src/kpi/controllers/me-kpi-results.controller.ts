import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SWAGGER_JWT_NAME } from '../../common/decorators/api-admin-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { CurrentUserPayload } from '../../common/interfaces/current-user-payload.interface';
import { FindKpiResultsQueryDto } from '../dto/find-kpi-results-query.dto';
import { MeKpiResultBreakdownQueryDto } from '../dto/me-kpi-result-breakdown-query.dto';
import { KpiResultsService } from '../services/kpi-results.service';

@ApiTags('My KPI')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth(SWAGGER_JWT_NAME)
@Controller('me/kpi-results')
export class MeKpiResultsController {
  constructor(private readonly kpiResultsService: KpiResultsService) {}

  @Get()
  @ApiOperation({ summary: 'Xem kết quả KPI của chính mình' })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  findMyResults(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: FindKpiResultsQueryDto,
  ) {
    return this.kpiResultsService.findMyResults(user.id, query);
  }

  @Get('breakdown')
  @ApiOperation({
    summary: 'Xem chi tiết quá trình cộng/trừ điểm KPI của chính mình',
  })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  findMyBreakdown(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: MeKpiResultBreakdownQueryDto,
  ) {
    return this.kpiResultsService.getBreakdown(user.id, query.periodId);
  }

  @Get(':id/breakdown')
  @ApiOperation({
    summary: 'Xem chi tiết quá trình cộng/trừ điểm theo kết quả KPI của mình',
  })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  findMyBreakdownById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.kpiResultsService.getBreakdownById(id, user.id);
  }
}
