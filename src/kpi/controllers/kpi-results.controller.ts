import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ApiAdminAuth } from '../../common/decorators/api-admin-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { CurrentUserPayload } from '../../common/interfaces/current-user-payload.interface';
import { CalculateKpiResultDto } from '../dto/calculate-kpi-result.dto';
import { ExportKpiResultsQueryDto } from '../dto/export-kpi-results-query.dto';
import { FindKpiResultsQueryDto } from '../dto/find-kpi-results-query.dto';
import { KpiResultBreakdownQueryDto } from '../dto/kpi-result-breakdown-query.dto';
import { KpiResultsService } from '../services/kpi-results.service';

@ApiTags('KPI Results')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('kpi-results')
export class KpiResultsController {
  constructor(private readonly kpiResultsService: KpiResultsService) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Tính hoặc tính lại kết quả KPI cho nhân viên' })
  calculate(
    @Body() dto: CalculateKpiResultDto,
    @CurrentUser() admin: CurrentUserPayload,
  ) {
    return this.kpiResultsService.calculate(dto, admin.id);
  }

  @Post('calculate-period/:periodId')
  @ApiOperation({ summary: 'Tính KPI hàng loạt cho tất cả nhân viên trong kỳ' })
  calculateForPeriod(
    @Param('periodId') periodId: string,
    @CurrentUser() admin: CurrentUserPayload,
  ) {
    return this.kpiResultsService.calculateForPeriod(periodId, admin.id);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách kết quả KPI (phân trang)' })
  findAll(@Query() query: FindKpiResultsQueryDto) {
    return this.kpiResultsService.findAll(query);
  }

  @Get('export')
  @ApiOperation({
    summary: 'Xuất báo cáo Excel KPI toàn bộ nhân viên theo kỳ',
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async exportEmployeesExcel(
    @Query() query: ExportKpiResultsQueryDto,
    @CurrentUser() admin: CurrentUserPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, filename } =
      await this.kpiResultsService.exportEmployeesExcel(
        query.periodId,
        admin.id,
      );

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  @Get('breakdown')
  @ApiOperation({
    summary: 'Xem chi tiết quá trình cộng/trừ điểm theo nhân viên và kỳ KPI',
  })
  getBreakdown(@Query() query: KpiResultBreakdownQueryDto) {
    return this.kpiResultsService.getBreakdown(query.userId, query.periodId);
  }

  @Get(':id/breakdown')
  @ApiOperation({
    summary: 'Xem chi tiết quá trình cộng/trừ điểm theo kết quả KPI',
  })
  getBreakdownById(@Param('id') id: string) {
    return this.kpiResultsService.getBreakdownById(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết kết quả KPI theo ID' })
  findOne(@Param('id') id: string) {
    return this.kpiResultsService.findOne(id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Duyệt kết quả KPI' })
  approve(@Param('id') id: string, @CurrentUser() admin: CurrentUserPayload) {
    return this.kpiResultsService.approve(id, admin.id);
  }

  @Patch(':id/lock')
  @ApiOperation({ summary: 'Khóa kết quả KPI' })
  lock(@Param('id') id: string, @CurrentUser() admin: CurrentUserPayload) {
    return this.kpiResultsService.lock(id, admin.id);
  }
}
