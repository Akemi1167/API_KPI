import { IsString, MinLength } from 'class-validator';

/** Admin đặt lại mật khẩu cho người dùng. */
export class ResetUserPasswordDto {
  /** Mật khẩu mới (tối thiểu 6 ký tự). */
  @IsString()
  @MinLength(6)
  newPassword: string;
}
