import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { KpiPeriodStatus } from '../../common/enums/kpi-period-status.enum';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import { validateEventPoints } from '../../common/utils/kpi-calculate.util';
import { AuditLogsService } from '../../audit/audit-logs.service';
import { UsersService } from '../../users/users.service';
import { CreateKpiEventDto } from '../dto/create-kpi-event.dto';
import { FindKpiEventsQueryDto } from '../dto/find-kpi-events-query.dto';
import { KpiEvent, KpiEventDocument } from '../schemas/kpi-event.schema';
import { KpiEventTypesService } from './kpi-event-types.service';
import { KpiPeriodsService } from './kpi-periods.service';

@Injectable()
export class KpiEventsService {
  private readonly logger = new Logger(KpiEventsService.name);

  constructor(
    @InjectModel(KpiEvent.name)
    private readonly kpiEventModel: Model<KpiEventDocument>,
    private readonly kpiPeriodsService: KpiPeriodsService,
    private readonly kpiEventTypesService: KpiEventTypesService,
    private readonly usersService: UsersService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(dto: CreateKpiEventDto, adminId: string) {
    const period = await this.kpiPeriodsService.findByIdOrFail(dto.periodId);

    if (period.status !== KpiPeriodStatus.OPEN) {
      throw new BadRequestException('Kỳ KPI đã khóa hoặc đã đóng');
    }

    const user = await this.usersService.findById(dto.userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const eventType = await this.kpiEventTypesService.findByIdOrFail(
      dto.eventTypeId,
    );
    if (!eventType.isActive) {
      throw new NotFoundException('Loại cộng/trừ điểm không hợp lệ');
    }

    const points = dto.points ?? eventType.defaultPoints;
    validateEventPoints(eventType.eventKind, points);

    const quantity = dto.quantity ?? 1;
    const event = await this.kpiEventModel.create({
      userId: dto.userId,
      periodId: dto.periodId,
      eventTypeId: dto.eventTypeId,
      eventKind: eventType.eventKind,
      points,
      quantity,
      totalPoints: points * quantity,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      note: dto.note,
      evidenceUrl: dto.evidenceUrl,
      createdBy: adminId,
      eventTypeSnapshot: {
        code: eventType.code,
        name: eventType.name,
      },
    });

    this.logger.log(
      `Admin ${adminId} tạo KPI event ${event._id.toString()} cho user ${dto.userId}`,
    );

    await this.auditLogsService.log({
      action: AuditAction.KPI_EVENT_CREATED,
      entityType: 'KpiEvent',
      entityId: event._id.toString(),
      performedBy: adminId,
      metadata: { userId: dto.userId, periodId: dto.periodId },
    });

    return this.toResponse(event);
  }

  async findAll(query: FindKpiEventsQueryDto) {
    const filter: Record<string, unknown> = {};

    if (query.userId) filter.userId = query.userId;
    if (query.periodId) filter.periodId = query.periodId;
    if (query.eventKind) filter.eventKind = query.eventKind;

    const skip = (query.page - 1) * query.limit;
    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;

    const [events, total] = await Promise.all([
      this.kpiEventModel
        .find(filter)
        .sort({ [query.sortBy]: sortDirection })
        .skip(skip)
        .limit(query.limit)
        .exec(),
      this.kpiEventModel.countDocuments(filter).exec(),
    ]);

    return buildPaginatedResult(
      events.map((event) => this.toResponse(event)),
      total,
      query.page,
      query.limit,
    );
  }

  async findOne(id: string) {
    const event = await this.kpiEventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException('Không tìm thấy KPI event');
    }
    return this.toResponse(event);
  }

  async remove(id: string, adminId: string) {
    const event = await this.kpiEventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException('Không tìm thấy KPI event');
    }

    const period = await this.kpiPeriodsService.findByIdOrFail(
      event.periodId.toString(),
    );

    if (period.status !== KpiPeriodStatus.OPEN) {
      throw new BadRequestException('Kỳ KPI đã khóa hoặc đã đóng');
    }

    await event.deleteOne();
    this.logger.log(`Admin ${adminId} xóa KPI event ${id}`);

    await this.auditLogsService.log({
      action: AuditAction.KPI_EVENT_DELETED,
      entityType: 'KpiEvent',
      entityId: id,
      performedBy: adminId,
      metadata: {
        userId: event.userId.toString(),
        periodId: event.periodId.toString(),
      },
    });

    return { deleted: true };
  }

  async findByUserAndPeriod(userId: string, periodId: string) {
    return this.kpiEventModel
      .find({ userId, periodId })
      .sort({ occurredAt: 1 })
      .exec();
  }

  toResponse(event: KpiEventDocument) {
    return {
      id: event._id.toString(),
      userId: event.userId.toString(),
      periodId: event.periodId.toString(),
      eventTypeId: event.eventTypeId.toString(),
      eventKind: event.eventKind,
      points: event.points,
      quantity: event.quantity,
      totalPoints: event.totalPoints,
      occurredAt: event.occurredAt,
      note: event.note,
      evidenceUrl: event.evidenceUrl,
      eventTypeSnapshot: event.eventTypeSnapshot,
      createdBy: event.createdBy.toString(),
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
}
