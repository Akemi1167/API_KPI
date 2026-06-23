import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { KpiPeriodStatus } from '../../common/enums/kpi-period-status.enum';

export type KpiPeriodDocument = HydratedDocument<KpiPeriod> & {
  createdAt: Date;
  updatedAt: Date;
};

/** Kỳ KPI xác định khung thời gian tính điểm. */
@Schema({ timestamps: true })
export class KpiPeriod {
  /** Mã kỳ KPI, duy nhất trong hệ thống. */
  @Prop({ required: true, unique: true, trim: true })
  code: string;

  /** Tên hiển thị của kỳ KPI. */
  @Prop({ required: true, trim: true })
  name: string;

  /** Năm của kỳ. */
  @Prop({ required: true })
  year: number;

  /** Tháng của kỳ (1–12). */
  @Prop({ required: true, min: 1, max: 12 })
  month: number;

  /** Ngày bắt đầu kỳ. */
  @Prop({ required: true })
  startDate: Date;

  /** Ngày kết thúc kỳ. */
  @Prop({ required: true })
  endDate: Date;

  /** Trạng thái kỳ: OPEN (đang mở), CLOSED (đã đóng), LOCKED (đã khóa). */
  @Prop({ enum: KpiPeriodStatus, default: KpiPeriodStatus.OPEN })
  status: KpiPeriodStatus;

  /** Điểm gốc làm cơ sở tính KPI cho kỳ này. */
  @Prop({ default: 100, min: 0 })
  baseScore: number;
}

export const KpiPeriodSchema = SchemaFactory.createForClass(KpiPeriod);
KpiPeriodSchema.index({ year: 1, month: 1 }, { unique: true });
KpiPeriodSchema.index({ status: 1, startDate: -1 });
