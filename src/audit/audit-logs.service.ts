import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditAction } from '../common/enums/audit-action.enum';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

export interface CreateAuditLogInput {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  performedBy?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(input: CreateAuditLogInput) {
    return this.auditLogModel.create({
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      performedBy: input.performedBy
        ? new Types.ObjectId(input.performedBy)
        : undefined,
      metadata: input.metadata,
    });
  }
}
