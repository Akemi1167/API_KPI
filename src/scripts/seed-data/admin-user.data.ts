import { UserRole } from '../../common/enums/user-role.enum';
import { generateStrongPassword } from '../../common/utils/generate-password.util';

export interface AdminUserSeed {
  employeeCode: string;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  positionName: string;
  departmentName: string;
  passwordGenerated: boolean;
}

/**
 * Lấy cấu hình admin từ env.
 * - ADMIN_EMAIL / ADMIN_PASSWORD ưu tiên cho production.
 * - Nếu không có ADMIN_PASSWORD: sinh mật khẩu mạnh (reset) hoặc fallback dev.
 */
export function getAdminUserSeed(options?: {
  forceGeneratePassword?: boolean;
}): AdminUserSeed {
  const forceGeneratePassword = options?.forceGeneratePassword === true;
  const email =
    process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'admin@example.com';
  const envPassword = process.env.ADMIN_PASSWORD?.trim();

  let password: string;
  let passwordGenerated = false;

  if (envPassword) {
    password = envPassword;
  } else if (forceGeneratePassword || process.env.NODE_ENV === 'production') {
    password = generateStrongPassword(16);
    passwordGenerated = true;
  } else {
    password = 'Admin@123';
  }

  return {
    employeeCode: process.env.ADMIN_EMPLOYEE_CODE?.trim() || 'ADMIN001',
    fullName: process.env.ADMIN_FULL_NAME?.trim() || 'System Admin',
    email,
    password,
    role: UserRole.ADMIN,
    positionName: process.env.ADMIN_POSITION_NAME?.trim() || 'Quản trị hệ thống',
    departmentName:
      process.env.ADMIN_DEPARTMENT_NAME?.trim() || 'Phòng Phát triển Phần mềm',
    passwordGenerated,
  };
}

/** Seed mặc định cho log startup (không sinh mật khẩu mới mỗi lần import). */
export const ADMIN_USER_SEED = getAdminUserSeed();
