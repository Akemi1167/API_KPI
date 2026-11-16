import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserRole } from '../../common/enums/user-role.enum';

export type UserDocument = HydratedDocument<User> & {
  createdAt: Date;
  updatedAt: Date;
};

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, trim: true })
  employeeCode: string;

  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ enum: UserRole, default: UserRole.EMPLOYEE })
  role: UserRole;

  @Prop({ trim: true })
  positionName?: string;

  @Prop({ trim: true, default: 'Phòng Phát triển Phần mềm' })
  departmentName: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  managerId?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  /** Số lần đăng nhập sai liên tiếp. */
  @Prop({ default: 0, select: false })
  failedLoginAttempts: number;

  /** Khóa đăng nhập đến thời điểm này (chống dò mật khẩu). */
  @Prop({ type: Date, default: null, select: false })
  lockUntil?: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ lockUntil: 1 });
