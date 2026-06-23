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
import { CreateKpiEventTypeDto } from '../dto/create-kpi-event-type.dto';
import { FindKpiEventTypesQueryDto } from '../dto/find-kpi-event-types-query.dto';
import { UpdateKpiEventTypeDto } from '../dto/update-kpi-event-type.dto';
import { KpiEventTypesService } from '../services/kpi-event-types.service';

@ApiTags('KPI Event Types')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('kpi-event-types')
export class KpiEventTypesController {
  constructor(private readonly kpiEventTypesService: KpiEventTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo loại cộng/trừ điểm' })
  create(@Body() dto: CreateKpiEventTypeDto) {
    return this.kpiEventTypesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách loại cộng/trừ điểm (phân trang)' })
  findAll(@Query() query: FindKpiEventTypesQueryDto) {
    return this.kpiEventTypesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết loại cộng/trừ điểm theo ID' })
  findOne(@Param('id') id: string) {
    return this.kpiEventTypesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật loại cộng/trừ điểm' })
  update(@Param('id') id: string, @Body() dto: UpdateKpiEventTypeDto) {
    return this.kpiEventTypesService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Vô hiệu hóa loại cộng/trừ điểm' })
  deactivate(@Param('id') id: string) {
    return this.kpiEventTypesService.deactivate(id);
  }
}
