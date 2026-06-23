import { UserRole } from '../../common/enums/user-role.enum';

/** Dữ liệu khởi tạo tài khoản admin mặc định cho môi trường dev/local. */
export const ADMIN_USER_SEED = {
  employeeCode: 'ADMIN001',
  fullName: 'System Admin',
  email: 'admin@example.com',
  password: 'Admin@123',
  role: UserRole.ADMIN,
  positionName: 'Quản trị hệ thống',
  departmentName: 'Phòng Phát triển Phần mềm',
} as const;
