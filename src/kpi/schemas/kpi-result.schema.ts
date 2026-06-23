import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { KpiRating } from '../../common/enums/kpi-rating.enum';

export type KpiResultDocument = HydratedDocument<KpiResult> & {
  createdAt: Date;
  updatedAt: Date;
};

/** Kết quả KPI tổng hợp của nhân viên trong một kỳ. */
@Schema({ timestamps: true })
export class KpiResult {
  /** Nhân viên được tính KPI. */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  /** Kỳ KPI áp dụng. */
  @Prop({ type: Types.ObjectId, ref: 'KpiPeriod', required: true })
  periodId: Types.ObjectId;

  /** Điểm gốc lấy từ kỳ KPI. */
  @Prop({ required: true })
  baseScore: number;

  /** Tổng điểm cộng thô (chưa áp dụng giới hạn). */
  @Prop({ required: true })
  rawBonusPoints: number;

  /** Điểm cộng sau khi áp dụng giới hạn tối đa. */
  @Prop({ required: true })
  bonusPoints: number;

  /** Tổng điểm trừ. */
  @Prop({ required: true })
  penaltyPoints: number;

  /** Điểm cuối = baseScore + bonusPoints - penaltyPoints. */
  @Prop({ required: true })
  finalScore: number;

  /** Xếp loại KPI (A, B, C, D). */
  @Prop({ enum: KpiRating, required: true })
  rating: KpiRating;

  /** Phần trăm thưởng tương ứng với xếp loại. */
  @Prop({ required: true })
  rewardPercent: number;

  /** Đã được admin duyệt kết quả. */
  @Prop({ default: false })
  isApproved: boolean;

  /** Đã khóa, không cho phép tính lại hoặc sửa. */
  @Prop({ default: false })
  isLocked: boolean;

  /** Admin duyệt kết quả. */
  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  /** Admin thực hiện tính toán. */
  @Prop({ type: Types.ObjectId, ref: 'User' })
  calculatedBy?: Types.ObjectId;

  /** Admin khóa kết quả. */
  @Prop({ type: Types.ObjectId, ref: 'User' })
  lockedBy?: Types.ObjectId;

  /** Thời điểm khóa kết quả. */
  @Prop()
  lockedAt?: Date;
}

export const KpiResultSchema = SchemaFactory.createForClass(KpiResult);
KpiResultSchema.index({ userId: 1, periodId: 1 }, { unique: true });
KpiResultSchema.index({ periodId: 1, finalScore: -1 });
