import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAdminAuth } from '../../common/decorators/api-admin-auth.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateKpiPeriodDto } from '../dto/create-kpi-period.dto';
import { FindKpiPeriodsQueryDto } from '../dto/find-kpi-periods-query.dto';
import { UpdateKpiPeriodDto } from '../dto/update-kpi-period.dto';
import { KpiPeriodsService } from '../services/kpi-periods.service';

@ApiTags('KPI Periods')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('kpi-periods')
export class KpiPeriodsController {
  constructor(private readonly kpiPeriodsService: KpiPeriodsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo kỳ KPI mới' })
  create(@Body() dto: CreateKpiPeriodDto) {
    return this.kpiPeriodsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách kỳ KPI (phân trang)' })
  findAll(@Query() query: FindKpiPeriodsQueryDto) {
    return this.kpiPeriodsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết kỳ KPI theo ID' })
  findOne(@Param('id') id: string) {
    return this.kpiPeriodsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật kỳ KPI (chỉ khi đang OPEN)' })
  update(@Param('id') id: string, @Body() dto: UpdateKpiPeriodDto) {
    return this.kpiPeriodsService.update(id, dto);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Đóng kỳ KPI' })
  close(@Param('id') id: string) {
    return this.kpiPeriodsService.close(id);
  }

  @Patch(':id/lock')
  @ApiOperation({ summary: 'Khóa kỳ KPI' })
  lock(@Param('id') id: string) {
    return this.kpiPeriodsService.lock(id);
  }
}
