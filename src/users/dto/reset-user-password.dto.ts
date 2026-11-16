import { IsString } from 'class-validator';
import { IsStrongPassword } from '../../common/utils/password-policy.util';

/** Admin đặt lại mật khẩu cho người dùng. */
export class ResetUserPasswordDto {
  /** Mật khẩu mới (mạnh: ≥8 ký tự, hoa/thường/số/ký tự đặc biệt). */
  @IsString()
  @IsStrongPassword()
  newPassword: string;
}
