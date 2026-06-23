import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { KpiEventKind } from '../../common/enums/kpi-event-kind.enum';

export type KpiEventDocument = HydratedDocument<KpiEvent> & {
  createdAt: Date;
  updatedAt: Date;
};

/** Sự kiện cộng/trừ điểm KPI ghi nhận cho nhân viên trong một kỳ. */
@Schema({ timestamps: true })
export class KpiEvent {
  /** Nhân viên được ghi nhận sự kiện. */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  /** Kỳ KPI chứa sự kiện. */
  @Prop({ type: Types.ObjectId, ref: 'KpiPeriod', required: true })
  periodId: Types.ObjectId;

  /** Loại sự kiện (danh mục cộng/trừ điểm). */
  @Prop({ type: Types.ObjectId, ref: 'KpiEventType', required: true })
  eventTypeId: Types.ObjectId;

  /** Phân loại cộng hoặc trừ điểm, sao chép từ loại sự kiện. */
  @Prop({ enum: KpiEventKind, required: true })
  eventKind: KpiEventKind;

  /** Điểm áp dụng cho mỗi đơn vị (trước khi nhân số lượng). */
  @Prop({ required: true })
  points: number;

  /** Số lần/lượng áp dụng. */
  @Prop({ default: 1, min: 1 })
  quantity: number;

  /** Tổng điểm = points × quantity. */
  @Prop({ required: true })
  totalPoints: number;

  /** Thời điểm xảy ra sự kiện. */
  @Prop({ default: Date.now })
  occurredAt: Date;

  /** Ghi chú bổ sung. */
  @Prop({ trim: true, maxlength: 1000 })
  note?: string;

  /** URL minh chứng kèm theo. */
  @Prop({ trim: true })
  evidenceUrl?: string;

  /** Admin tạo sự kiện. */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  /** Bản sao thông tin loại sự kiện tại thời điểm tạo, phòng thay đổi danh mục sau này. */
  @Prop({ type: Object })
  eventTypeSnapshot?: {
    code: string;
    name: string;
  };
}

export const KpiEventSchema = SchemaFactory.createForClass(KpiEvent);
KpiEventSchema.index({ userId: 1, periodId: 1 });
KpiEventSchema.index({ periodId: 1, eventKind: 1 });
