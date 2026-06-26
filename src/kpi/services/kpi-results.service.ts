import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { KpiPeriodStatus } from '../../common/enums/kpi-period-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import { KpiEventKind } from '../../common/enums/kpi-event-kind.enum';
import {
  calculateKpiScore,
} from '../../common/utils/kpi-calculate.util';
import { buildKpiResultsExcelBuffer } from '../../common/utils/kpi-results-excel.util';
import { toUserResponse } from '../../users/utils/user.mapper';
import { AuditLogsService } from '../../audit/audit-logs.service';
import { UsersService } from '../../users/users.service';
import { CalculateKpiResultDto } from '../dto/calculate-kpi-result.dto';
import { FindKpiResultsQueryDto } from '../dto/find-kpi-results-query.dto';
import { KpiResult, KpiResultDocument } from '../schemas/kpi-result.schema';
import { KpiEventsService } from './kpi-events.service';
import { KpiPeriodsService } from './kpi-periods.service';

@Injectable()
export class KpiResultsService {
  private readonly logger = new Logger(KpiResultsService.name);

  constructor(
    @InjectModel(KpiResult.name)
    private readonly kpiResultModel: Model<KpiResultDocument>,
    private readonly kpiPeriodsService: KpiPeriodsService,
    private readonly kpiEventsService: KpiEventsService,
    private readonly usersService: UsersService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async calculate(dto: CalculateKpiResultDto, adminId: string) {
    const result = await this.calculateForUser(
      dto.userId,
      dto.periodId,
      adminId,
    );

    await this.auditLogsService.log({
      action: AuditAction.KPI_RESULT_CALCULATED,
      entityType: 'KpiResult',
      entityId: result.id,
      performedBy: adminId,
      metadata: { userId: dto.userId, periodId: dto.periodId },
    });

    return result;
  }

  async calculateForPeriod(periodId: string, adminId: string) {
    const period = await this.kpiPeriodsService.findByIdOrFail(periodId);

    if (period.status === KpiPeriodStatus.LOCKED) {
      throw new BadRequestException('Kỳ KPI đã bị khóa, không thể tính lại');
    }

    const employees = await this.usersService.findActiveByRole(
      UserRole.EMPLOYEE,
    );
    const results = [];

    for (const employee of employees) {
      const result = await this.calculateForUser(
        employee._id.toString(),
        periodId,
        adminId,
      );
      results.push(result);
    }

    this.logger.log(
      `Admin ${adminId} tính KPI hàng loạt cho kỳ ${periodId}, ${results.length} nhân viên`,
    );

    await this.auditLogsService.log({
      action: AuditAction.KPI_RESULT_CALCULATED_PERIOD,
      entityType: 'KpiPeriod',
      entityId: periodId,
      performedBy: adminId,
      metadata: { totalCalculated: results.length },
    });

    return { total: results.length, results };
  }

  async findAll(query: FindKpiResultsQueryDto) {
    const filter: Record<string, unknown> = {};

    if (query.userId) filter.userId = query.userId;
    if (query.periodId) filter.periodId = query.periodId;

    const skip = (query.page - 1) * query.limit;
    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;

    const [results, total] = await Promise.all([
      this.kpiResultModel
        .find(filter)
        .sort({ [query.sortBy]: sortDirection })
        .skip(skip)
        .limit(query.limit)
        .exec(),
      this.kpiResultModel.countDocuments(filter).exec(),
    ]);

    return buildPaginatedResult(
      results.map((result) => this.toResponse(result)),
      total,
      query.page,
      query.limit,
    );
  }

  async findMyResults(userId: string, query: FindKpiResultsQueryDto) {
    return this.findAll({ ...query, userId });
  }

  async findOne(id: string) {
    const result = await this.kpiResultModel.findById(id).exec();
    if (!result) {
      throw new NotFoundException('Không tìm thấy kết quả KPI');
    }
    return this.toResponse(result);
  }

  async getBreakdown(userId: string, periodId: string) {
    return this.buildBreakdown(userId, periodId);
  }

  async getBreakdownById(id: string, requestUserId?: string) {
    const result = await this.kpiResultModel.findById(id).exec();
    if (!result) {
      throw new NotFoundException('Không tìm thấy kết quả KPI');
    }

    if (requestUserId && result.userId.toString() !== requestUserId) {
      throw new ForbiddenException('Không có quyền xem kết quả KPI này');
    }

    return this.buildBreakdown(
      result.userId.toString(),
      result.periodId.toString(),
      result,
    );
  }

  async exportEmployeesExcel(periodId: string, adminId: string) {
    const period = await this.kpiPeriodsService.findByIdOrFail(periodId);
    const employees = await this.usersService.findActiveByRole(UserRole.EMPLOYEE);
    const results = await this.kpiResultModel.find({ periodId }).exec();
    const resultsByUserId = new Map(
      results.map((result) => [result.userId.toString(), result]),
    );
    const exportedAt = new Date();

    const { buffer, filename } = await buildKpiResultsExcelBuffer({
      period,
      employees,
      resultsByUserId,
      exportedAt,
    });

    this.logger.log(
      `Admin ${adminId} xuất báo cáo Excel KPI kỳ ${periodId}, ${employees.length} nhân viên`,
    );

    await this.auditLogsService.log({
      action: AuditAction.KPI_RESULT_EXPORTED,
      entityType: 'KpiPeriod',
      entityId: periodId,
      performedBy: adminId,
      metadata: {
        filename,
        totalEmployees: employees.length,
        totalResults: results.length,
      },
    });

    return { buffer, filename };
  }

  async approve(id: string, adminId: string) {
    const result = await this.kpiResultModel.findById(id).exec();
    if (!result) {
      throw new NotFoundException('Không tìm thấy kết quả KPI');
    }

    if (result.isLocked) {
      throw new BadRequestException('Kết quả KPI đã bị khóa');
    }

    const period = await this.kpiPeriodsService.findByIdOrFail(
      result.periodId.toString(),
    );

    if (period.status === KpiPeriodStatus.LOCKED) {
      throw new BadRequestException('Kỳ KPI đã bị khóa');
    }

    result.isApproved = true;
    result.approvedBy = new Types.ObjectId(adminId);
    await result.save();

    this.logger.log(`Admin ${adminId} duyệt KPI result ${id}`);

    await this.auditLogsService.log({
      action: AuditAction.KPI_RESULT_APPROVED,
      entityType: 'KpiResult',
      entityId: id,
      performedBy: adminId,
    });

    return this.toResponse(result);
  }

  async lock(id: string, adminId: string) {
    const result = await this.kpiResultModel.findById(id).exec();
    if (!result) {
      throw new NotFoundException('Không tìm thấy kết quả KPI');
    }

    if (result.isLocked) {
      throw new BadRequestException('Kết quả KPI đã bị khóa');
    }

    result.isLocked = true;
    result.lockedBy = new Types.ObjectId(adminId);
    result.lockedAt = new Date();
    await result.save();

    this.logger.log(`Admin ${adminId} khóa KPI result ${id}`);

    await this.auditLogsService.log({
      action: AuditAction.KPI_RESULT_LOCKED,
      entityType: 'KpiResult',
      entityId: id,
      performedBy: adminId,
    });

    return this.toResponse(result);
  }

  private async buildBreakdown(
    userId: string,
    periodId: string,
    resultDoc?: KpiResultDocument,
  ) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const period = await this.kpiPeriodsService.findByIdOrFail(periodId);
    const events = await this.kpiEventsService.findByUserAndPeriod(
      userId,
      periodId,
    );
    const mappedEvents = events.map((event) =>
      this.kpiEventsService.toResponse(event),
    );

    const score = calculateKpiScore(
      period.baseScore,
      events.map((event) => ({
        eventKind: event.eventKind,
        totalPoints: event.totalPoints,
      })),
    );

    const bonusEvents = mappedEvents.filter(
      (event) => event.eventKind === KpiEventKind.BONUS,
    );
    const penaltyEvents = mappedEvents.filter(
      (event) => event.eventKind === KpiEventKind.PENALTY,
    );

    const savedResult =
      resultDoc ??
      (await this.kpiResultModel.findOne({ userId, periodId }).exec());

    return {
      user: toUserResponse(user),
      period: {
        id: period._id.toString(),
        code: period.code,
        name: period.name,
        year: period.year,
        month: period.month,
        startDate: period.startDate,
        endDate: period.endDate,
        status: period.status,
        baseScore: period.baseScore,
      },
      result: savedResult ? this.toResponse(savedResult) : null,
      summary: {
        ...score,
        totalEvents: mappedEvents.length,
        bonusEventCount: bonusEvents.length,
        penaltyEventCount: penaltyEvents.length,
      },
      statisticsByEventType: this.buildEventTypeStatistics(mappedEvents),
      bonusEvents: [...bonusEvents].sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      ),
      penaltyEvents: [...penaltyEvents].sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      ),
      timeline: this.buildTimeline(period.baseScore, mappedEvents),
    };
  }

  private buildEventTypeStatistics(
    events: ReturnType<KpiEventsService['toResponse']>[],
  ) {
    const grouped = new Map<
      string,
      {
        eventTypeId: string;
        code: string;
        name: string;
        eventKind: KpiEventKind;
        count: number;
        totalPoints: number;
      }
    >();

    for (const event of events) {
      const key = event.eventTypeId;
      const existing = grouped.get(key);

      if (existing) {
        existing.count += 1;
        existing.totalPoints += event.totalPoints;
        continue;
      }

      grouped.set(key, {
        eventTypeId: event.eventTypeId,
        code: event.eventTypeSnapshot?.code ?? key,
        name: event.eventTypeSnapshot?.name ?? 'Không xác định',
        eventKind: event.eventKind,
        count: 1,
        totalPoints: event.totalPoints,
      });
    }

    return [...grouped.values()].sort((a, b) => b.totalPoints - a.totalPoints);
  }

  private buildTimeline(
    baseScore: number,
    events: ReturnType<KpiEventsService['toResponse']>[],
  ) {
    let runningRawBonus = 0;
    let runningPenalty = 0;

    return events.map((event) => {
      if (event.eventKind === KpiEventKind.BONUS) {
        runningRawBonus += event.totalPoints;
      } else {
        runningPenalty += event.totalPoints;
      }

      const runningBonus = runningRawBonus;

      return {
        ...event,
        runningRawBonusPoints: runningRawBonus,
        runningBonusPoints: runningBonus,
        runningPenaltyPoints: runningPenalty,
        runningFinalScore: baseScore + runningBonus + runningPenalty,
      };
    });
  }

  private async calculateForUser(
    userId: string,
    periodId: string,
    adminId: string,
  ) {
    const period = await this.kpiPeriodsService.findByIdOrFail(periodId);

    if (period.status === KpiPeriodStatus.LOCKED) {
      throw new BadRequestException('Kỳ KPI đã bị khóa, không thể tính lại');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const existing = await this.kpiResultModel
      .findOne({ userId, periodId })
      .exec();

    if (existing?.isLocked) {
      throw new BadRequestException(
        `Kết quả KPI của user ${userId} đã bị khóa, không thể tính lại`,
      );
    }

    const events = await this.kpiEventsService.findByUserAndPeriod(
      userId,
      periodId,
    );

    const score = calculateKpiScore(
      period.baseScore,
      events.map((event) => ({
        eventKind: event.eventKind,
        totalPoints: event.totalPoints,
      })),
    );

    const result = await this.kpiResultModel
      .findOneAndUpdate(
        { userId, periodId },
        {
          ...score,
          calculatedBy: new Types.ObjectId(adminId),
          isApproved: false,
          isLocked: false,
          approvedBy: undefined,
          lockedBy: undefined,
          lockedAt: undefined,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();

    this.logger.log(
      `Admin ${adminId} tính KPI result cho user ${userId}, kỳ ${periodId}`,
    );

    return this.toResponse(result);
  }

  private toResponse(result: KpiResultDocument) {
    return {
      id: result._id.toString(),
      userId: result.userId.toString(),
      periodId: result.periodId.toString(),
      baseScore: result.baseScore,
      rawBonusPoints: result.rawBonusPoints,
      bonusPoints: result.bonusPoints,
      penaltyPoints: result.penaltyPoints,
      finalScore: result.finalScore,
      rating: result.rating,
      rewardPercent: result.rewardPercent,
      isApproved: result.isApproved,
      isLocked: result.isLocked,
      approvedBy: result.approvedBy?.toString(),
      calculatedBy: result.calculatedBy?.toString(),
      lockedBy: result.lockedBy?.toString(),
      lockedAt: result.lockedAt,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }
}
