import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';
import { IsStrongPassword } from '../../common/utils/password-policy.util';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  employeeCode: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsStrongPassword()
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  positionName?: string;

  @IsOptional()
  @IsString()
  departmentName?: string;

  @IsOptional()
  @IsMongoId()
  managerId?: string;
}
