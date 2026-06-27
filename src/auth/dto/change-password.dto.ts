import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/** Đổi mật khẩu tài khoản đang đăng nhập. */
export class ChangePasswordDto {
  /** Mật khẩu hiện tại. */
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  /** Mật khẩu mới (tối thiểu 6 ký tự). */
  @IsString()
  @MinLength(6)
  newPassword: string;
}
