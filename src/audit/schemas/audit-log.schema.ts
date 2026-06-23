import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AuditAction } from '../../common/enums/audit-action.enum';

export type AuditLogDocument = HydratedDocument<AuditLog> & {
  createdAt: Date;
  updatedAt: Date;
};

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ enum: AuditAction, required: true })
  action: AuditAction;

  @Prop({ required: true, trim: true })
  entityType: string;

  @Prop({ trim: true })
  entityId?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  performedBy?: Types.ObjectId;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ performedBy: 1, createdAt: -1 });
