import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAdminAuth } from '../../common/decorators/api-admin-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { CurrentUserPayload } from '../../common/interfaces/current-user-payload.interface';
import { CreateKpiEventDto } from '../dto/create-kpi-event.dto';
import { FindKpiEventsQueryDto } from '../dto/find-kpi-events-query.dto';
import { KpiEventsService } from '../services/kpi-events.service';

@ApiTags('KPI Events')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('kpi-events')
export class KpiEventsController {
  constructor(private readonly kpiEventsService: KpiEventsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo sự kiện cộng/trừ điểm KPI' })
  create(
    @Body() dto: CreateKpiEventDto,
    @CurrentUser() admin: CurrentUserPayload,
  ) {
    return this.kpiEventsService.create(dto, admin.id);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách sự kiện KPI (phân trang)' })
  findAll(@Query() query: FindKpiEventsQueryDto) {
    return this.kpiEventsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết sự kiện KPI theo ID' })
  findOne(@Param('id') id: string) {
    return this.kpiEventsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa sự kiện KPI (chỉ khi kỳ đang OPEN)' })
  remove(@Param('id') id: string, @CurrentUser() admin: CurrentUserPayload) {
    return this.kpiEventsService.remove(id, admin.id);
  }
}
