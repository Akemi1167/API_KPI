import { UserDocument } from '../schemas/user.schema';

export function toUserResponse(user: UserDocument) {
  return {
    id: user._id.toString(),
    employeeCode: user.employeeCode,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    positionName: user.positionName,
    departmentName: user.departmentName,
    managerId: user.managerId?.toString(),
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
