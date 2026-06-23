import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KpiEventKind } from '../../common/enums/kpi-event-kind.enum';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import { CreateKpiEventTypeDto } from '../dto/create-kpi-event-type.dto';
import { FindKpiEventTypesQueryDto } from '../dto/find-kpi-event-types-query.dto';
import { FindPublicKpiEventTypesQueryDto } from '../dto/find-public-kpi-event-types-query.dto';
import { UpdateKpiEventTypeDto } from '../dto/update-kpi-event-type.dto';
import {
  KpiEventType,
  KpiEventTypeDocument,
} from '../schemas/kpi-event-type.schema';

@Injectable()
export class KpiEventTypesService {
  constructor(
    @InjectModel(KpiEventType.name)
    private readonly kpiEventTypeModel: Model<KpiEventTypeDocument>,
  ) {}

  async create(dto: CreateKpiEventTypeDto) {
    await this.ensureCodeUnique(dto.code);
    const eventType = await this.kpiEventTypeModel.create(dto);
    return this.toResponse(eventType);
  }

  async findAll(query: FindKpiEventTypesQueryDto) {
    const filter: Record<string, unknown> = {};

    if (query.eventKind) {
      filter.eventKind = query.eventKind;
    }

    if (query.keyword) {
      filter.name = { $regex: query.keyword, $options: 'i' };
    }

    const skip = (query.page - 1) * query.limit;
    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;

    const [eventTypes, total] = await Promise.all([
      this.kpiEventTypeModel
        .find(filter)
        .sort({ [query.sortBy]: sortDirection })
        .skip(skip)
        .limit(query.limit)
        .exec(),
      this.kpiEventTypeModel.countDocuments(filter).exec(),
    ]);

    return buildPaginatedResult(
      eventTypes.map((eventType) => this.toResponse(eventType)),
      total,
      query.page,
      query.limit,
    );
  }

  async findOne(id: string) {
    const eventType = await this.kpiEventTypeModel.findById(id).exec();
    if (!eventType) {
      throw new NotFoundException('Không tìm thấy loại cộng/trừ điểm');
    }
    return this.toResponse(eventType);
  }

  async findPublicCatalog(query: FindPublicKpiEventTypesQueryDto) {
    const filter: Record<string, unknown> = { isActive: true };

    if (query.eventKind) {
      filter.eventKind = query.eventKind;
    }

    const eventTypes = await this.kpiEventTypeModel
      .find(filter)
      .sort({ eventKind: 1, name: 1 })
      .exec();

    const items = eventTypes.map((eventType) => this.toPublicResponse(eventType));
    const bonus = items.filter((item) => item.eventKind === KpiEventKind.BONUS);
    const penalty = items.filter(
      (item) => item.eventKind === KpiEventKind.PENALTY,
    );

    return {
      items,
      grouped: { bonus, penalty },
      total: items.length,
    };
  }

  async findByIdOrFail(id: string) {
    const eventType = await this.kpiEventTypeModel.findById(id).exec();
    if (!eventType) {
      throw new NotFoundException('Loại cộng/trừ điểm không hợp lệ');
    }
    return eventType;
  }

  async update(id: string, dto: UpdateKpiEventTypeDto) {
    const eventType = await this.kpiEventTypeModel.findById(id).exec();

    if (!eventType) {
      throw new NotFoundException('Không tìm thấy loại cộng/trừ điểm');
    }

    if (dto.code && dto.code !== eventType.code) {
      await this.ensureCodeUnique(dto.code, id);
    }

    Object.assign(eventType, dto);
    await eventType.save();

    return this.toResponse(eventType);
  }

  async deactivate(id: string) {
    const eventType = await this.kpiEventTypeModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();

    if (!eventType) {
      throw new NotFoundException('Không tìm thấy loại cộng/trừ điểm');
    }

    return this.toResponse(eventType);
  }

  private async ensureCodeUnique(code: string, excludeId?: string) {
    const filter: Record<string, unknown> = { code };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const existing = await this.kpiEventTypeModel.findOne(filter).exec();
    if (existing) {
      throw new ConflictException(
        `Mã loại cộng/trừ điểm "${code}" đã tồn tại`,
      );
    }
  }

  private toPublicResponse(eventType: KpiEventTypeDocument) {
    return {
      id: eventType._id.toString(),
      code: eventType.code,
      name: eventType.name,
      description: eventType.description ?? '',
      explanation:
        eventType.description?.trim() ||
        `Áp dụng khi nhân viên ${eventType.name.toLowerCase()}.`,
      eventKind: eventType.eventKind,
      defaultPoints: eventType.defaultPoints,
    };
  }

  private toResponse(eventType: KpiEventTypeDocument) {
    return {
      id: eventType._id.toString(),
      code: eventType.code,
      name: eventType.name,
      description: eventType.description,
      eventKind: eventType.eventKind,
      defaultPoints: eventType.defaultPoints,
      isActive: eventType.isActive,
      createdAt: eventType.createdAt,
      updatedAt: eventType.updatedAt,
    };
  }
}
