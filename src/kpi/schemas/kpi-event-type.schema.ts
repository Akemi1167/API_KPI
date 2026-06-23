import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { KpiEventKind } from '../../common/enums/kpi-event-kind.enum';

export type KpiEventTypeDocument = HydratedDocument<KpiEventType> & {
  createdAt: Date;
  updatedAt: Date;
};

/** Danh mục loại sự kiện cộng/trừ điểm KPI. */
@Schema({ timestamps: true })
export class KpiEventType {
  /** Mã loại sự kiện, duy nhất trong hệ thống. */
  @Prop({ required: true, unique: true, trim: true })
  code: string;

  /** Tên hiển thị của loại sự kiện. */
  @Prop({ required: true, trim: true })
  name: string;

  /** Mô tả chi tiết (tùy chọn). */
  @Prop({ trim: true })
  description?: string;

  /** Phân loại: cộng điểm (BONUS) hoặc trừ điểm (PENALTY). */
  @Prop({ enum: KpiEventKind, required: true })
  eventKind: KpiEventKind;

  /** Điểm mặc định áp dụng khi tạo sự kiện. */
  @Prop({ required: true })
  defaultPoints: number;

  /** Trạng thái kích hoạt; loại bị vô hiệu hóa không dùng cho sự kiện mới. */
  @Prop({ default: true })
  isActive: boolean;
}

export const KpiEventTypeSchema = SchemaFactory.createForClass(KpiEventType);
KpiEventTypeSchema.index({ eventKind: 1, isActive: 1 });
