import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KpiPeriodStatus } from '../../common/enums/kpi-period-status.enum';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import { CreateKpiPeriodDto } from '../dto/create-kpi-period.dto';
import { FindKpiPeriodsQueryDto } from '../dto/find-kpi-periods-query.dto';
import { UpdateKpiPeriodDto } from '../dto/update-kpi-period.dto';
import { KpiPeriod, KpiPeriodDocument } from '../schemas/kpi-period.schema';

@Injectable()
export class KpiPeriodsService {
  constructor(
    @InjectModel(KpiPeriod.name)
    private readonly kpiPeriodModel: Model<KpiPeriodDocument>,
  ) {}

  async create(dto: CreateKpiPeriodDto) {
    this.validateDateRange(dto.startDate, dto.endDate);

    const start = new Date(dto.startDate);
    const year = dto.year ?? start.getFullYear();
    const month = dto.month ?? start.getMonth() + 1;
    const code = dto.code ?? `KPI-${year}-${String(month).padStart(2, '0')}`;

    await this.ensurePeriodUnique(year, month, code);

    const period = await this.kpiPeriodModel.create({
      code,
      name: dto.name,
      year,
      month,
      startDate: start,
      endDate: new Date(dto.endDate),
      baseScore: dto.baseScore ?? 100,
    });

    return this.toResponse(period);
  }

  async findAll(query: FindKpiPeriodsQueryDto) {
    const filter: Record<string, unknown> = {};

    if (query.status) filter.status = query.status;
    if (query.year) filter.year = query.year;
    if (query.month) filter.month = query.month;

    if (query.keyword) {
      filter.$or = [
        { name: { $regex: query.keyword, $options: 'i' } },
        { code: { $regex: query.keyword, $options: 'i' } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;

    const [periods, total] = await Promise.all([
      this.kpiPeriodModel
        .find(filter)
        .sort({ [query.sortBy]: sortDirection })
        .skip(skip)
        .limit(query.limit)
        .exec(),
      this.kpiPeriodModel.countDocuments(filter).exec(),
    ]);

    return buildPaginatedResult(
      periods.map((period) => this.toResponse(period)),
      total,
      query.page,
      query.limit,
    );
  }

  async findOne(id: string) {
    const period = await this.kpiPeriodModel.findById(id).exec();
    if (!period) {
      throw new NotFoundException('Không tìm thấy kỳ KPI');
    }
    return this.toResponse(period);
  }

  async findByIdOrFail(id: string) {
    const period = await this.kpiPeriodModel.findById(id).exec();
    if (!period) {
      throw new NotFoundException('Không tìm thấy kỳ KPI');
    }
    return period;
  }

  async update(id: string, dto: UpdateKpiPeriodDto) {
    const period = await this.kpiPeriodModel.findById(id).exec();
    if (!period) {
      throw new NotFoundException('Không tìm thấy kỳ KPI');
    }

    if (period.status !== KpiPeriodStatus.OPEN) {
      throw new BadRequestException('Chỉ có thể cập nhật kỳ KPI đang mở');
    }

    if (dto.startDate || dto.endDate) {
      this.validateDateRange(
        dto.startDate ?? period.startDate.toISOString(),
        dto.endDate ?? period.endDate.toISOString(),
      );
    }

    if (dto.code && dto.code !== period.code) {
      const existing = await this.kpiPeriodModel
        .findOne({ code: dto.code })
        .exec();
      if (existing) {
        throw new ConflictException('Mã kỳ KPI đã tồn tại');
      }
      period.code = dto.code;
    }

    if (dto.name) period.name = dto.name;
    if (dto.startDate) period.startDate = new Date(dto.startDate);
    if (dto.endDate) period.endDate = new Date(dto.endDate);
    if (dto.baseScore !== undefined) period.baseScore = dto.baseScore;

    if (dto.year !== undefined) period.year = dto.year;
    if (dto.month !== undefined) period.month = dto.month;

    if (dto.year !== undefined || dto.month !== undefined) {
      await this.ensurePeriodUnique(
        period.year,
        period.month,
        period.code,
        period._id.toString(),
      );
    }

    await period.save();
    return this.toResponse(period);
  }

  async close(id: string) {
    const period = await this.kpiPeriodModel.findById(id).exec();
    if (!period) {
      throw new NotFoundException('Không tìm thấy kỳ KPI');
    }

    if (period.status !== KpiPeriodStatus.OPEN) {
      throw new BadRequestException('Kỳ KPI đã khóa hoặc đã đóng');
    }

    period.status = KpiPeriodStatus.CLOSED;
    await period.save();

    return this.toResponse(period);
  }

  async lock(id: string) {
    const period = await this.kpiPeriodModel.findById(id).exec();
    if (!period) {
      throw new NotFoundException('Không tìm thấy kỳ KPI');
    }

    period.status = KpiPeriodStatus.LOCKED;
    await period.save();

    return this.toResponse(period);
  }

  private async ensurePeriodUnique(
    year: number,
    month: number,
    code: string,
    excludeId?: string,
  ) {
    const filter: Record<string, unknown> = {
      $or: [{ year, month }, { code }],
    };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const existing = await this.kpiPeriodModel.findOne(filter).exec();
    if (existing) {
      throw new ConflictException('Kỳ KPI tháng/năm hoặc mã kỳ đã tồn tại');
    }
  }

  private validateDateRange(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new BadRequestException('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
    }
  }

  private toResponse(period: KpiPeriodDocument) {
    return {
      id: period._id.toString(),
      code: period.code,
      name: period.name,
      year: period.year,
      month: period.month,
      startDate: period.startDate,
      endDate: period.endDate,
      status: period.status,
      baseScore: period.baseScore,
      createdAt: period.createdAt,
      updatedAt: period.updatedAt,
    };
  }
}
