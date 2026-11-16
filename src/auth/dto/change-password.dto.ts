import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from '../../common/utils/password-policy.util';

/** Đổi mật khẩu tài khoản đang đăng nhập. */
export class ChangePasswordDto {
  /** Mật khẩu hiện tại. */
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  /** Mật khẩu mới (mạnh: ≥8 ký tự, hoa/thường/số/ký tự đặc biệt). */
  @IsString()
  @IsStrongPassword()
  newPassword: string;
}
