import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { AuditAction } from '../common/enums/audit-action.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { buildPaginatedResult } from '../common/utils/pagination.util';
import { AuditLogsService } from '../audit/audit-logs.service';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import { toUserResponse } from './utils/user.mapper';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(dto: CreateUserDto) {
    await this.ensureEmailUnique(dto.email);
    await this.ensureEmployeeCodeUnique(dto.employeeCode);

    const passwordHash = await this.hashPassword(dto.password);
    const user = await this.userModel.create({
      employeeCode: dto.employeeCode,
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      role: dto.role,
      positionName: dto.positionName,
      departmentName: dto.departmentName,
      managerId: dto.managerId,
    });

    return toUserResponse(user);
  }

  async findAll(query: FindUsersQueryDto) {
    const filter: Record<string, unknown> = {};

    if (query.role) {
      filter.role = query.role;
    }

    if (query.keyword) {
      filter.$or = [
        { fullName: { $regex: query.keyword, $options: 'i' } },
        { employeeCode: { $regex: query.keyword, $options: 'i' } },
        { email: { $regex: query.keyword, $options: 'i' } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ [query.sortBy]: sortDirection })
        .skip(skip)
        .limit(query.limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return buildPaginatedResult(
      users.map(toUserResponse),
      total,
      query.page,
      query.limit,
    );
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return toUserResponse(user);
  }

  async findByEmailWithPassword(email: string) {
    return this.userModel
      .findOne({ email: email.trim().toLowerCase() })
      .select('+passwordHash')
      .exec();
  }

  async findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async findByIdWithPassword(id: string) {
    return this.userModel.findById(id).select('+passwordHash').exec();
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'Mật khẩu mới phải khác mật khẩu hiện tại',
      );
    }

    const user = await this.findByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (!user.isActive) {
      throw new BadRequestException('Tài khoản đã bị khóa');
    }

    const isCurrentPasswordValid = await this.comparePassword(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }

    user.passwordHash = await this.hashPassword(newPassword);
    await user.save();

    await this.auditLogsService.log({
      action: AuditAction.PASSWORD_CHANGED,
      entityType: 'User',
      entityId: userId,
      performedBy: userId,
    });

    return { message: 'Đổi mật khẩu thành công' };
  }

  async resetPassword(userId: string, newPassword: string, adminId: string) {
    const user = await this.findByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    user.passwordHash = await this.hashPassword(newPassword);
    await user.save();

    await this.auditLogsService.log({
      action: AuditAction.PASSWORD_RESET,
      entityType: 'User',
      entityId: userId,
      performedBy: adminId,
    });

    return { message: 'Đặt lại mật khẩu thành công' };
  }

  async findActiveByRole(role: UserRole) {
    return this.userModel.find({ role, isActive: true }).exec();
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (dto.email && dto.email !== user.email) {
      await this.ensureEmailUnique(dto.email);
    }

    if (dto.employeeCode && dto.employeeCode !== user.employeeCode) {
      await this.ensureEmployeeCodeUnique(dto.employeeCode);
    }

    Object.assign(user, dto);
    await user.save();

    return toUserResponse(user);
  }

  async setActiveStatus(id: string, isActive: boolean) {
    const user = await this.userModel
      .findByIdAndUpdate(id, { isActive }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    await this.auditLogsService.log({
      action: isActive
        ? AuditAction.USER_ACTIVATED
        : AuditAction.USER_DEACTIVATED,
      entityType: 'User',
      entityId: id,
      metadata: { isActive },
    });

    return toUserResponse(user);
  }

  async hashPassword(password: string) {
    const saltRounds =
      Number(this.configService.get<string>('BCRYPT_SALT_ROUNDS')) || 10;
    return bcrypt.hash(password, saltRounds);
  }

  /** Tạo mới hoặc đồng bộ mật khẩu admin seed để đăng nhập luôn khớp seed data. */
  async upsertSeedAdmin(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.userModel
      .findOne({ email })
      .select('+passwordHash')
      .exec();

    if (existing) {
      existing.passwordHash = await this.hashPassword(dto.password);
      existing.fullName = dto.fullName;
      existing.role = dto.role ?? UserRole.ADMIN;
      if (dto.positionName !== undefined) {
        existing.positionName = dto.positionName;
      }
      if (dto.departmentName !== undefined) {
        existing.departmentName = dto.departmentName;
      }
      existing.isActive = true;
      await existing.save();
      return { user: toUserResponse(existing), created: false };
    }

    const user = await this.create({ ...dto, email });
    return { user, created: true };
  }

  async comparePassword(password: string, passwordHash: string) {
    return bcrypt.compare(password, passwordHash);
  }

  private async ensureEmailUnique(email: string) {
    const existing = await this.userModel.findOne({ email }).exec();
    if (existing) {
      throw new ConflictException('Email đã tồn tại');
    }
  }

  private async ensureEmployeeCodeUnique(employeeCode: string) {
    const existing = await this.userModel.findOne({ employeeCode }).exec();
    if (existing) {
      throw new ConflictException('Mã nhân viên đã tồn tại');
    }
  }
}
