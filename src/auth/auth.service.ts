import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuditAction } from '../common/enums/audit-action.enum';
import { CurrentUserPayload } from '../common/interfaces/current-user-payload.interface';
import { AuditLogsService } from '../audit/audit-logs.service';
import { UsersService } from '../users/users.service';
import { toUserResponse } from '../users/utils/user.mapper';
import { getJwtExpiresIn } from '../common/utils/jwt.util';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user) {
      this.logger.warn(
        `Đăng nhập thất bại: email không tồn tại (${dto.email})`,
      );
      await this.auditLogsService.log({
        action: AuditAction.LOGIN_FAILED,
        entityType: 'User',
        metadata: { email: dto.email, reason: 'email_not_found' },
      });
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (!user.isActive) {
      this.logger.warn(`Đăng nhập thất bại: tài khoản bị khóa (${dto.email})`);
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    const isPasswordValid = await this.usersService.comparePassword(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      this.logger.warn(`Đăng nhập thất bại: sai mật khẩu (${dto.email})`);
      await this.auditLogsService.log({
        action: AuditAction.LOGIN_FAILED,
        entityType: 'User',
        entityId: user._id.toString(),
        metadata: { email: dto.email, reason: 'invalid_password' },
      });
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const payload: CurrentUserPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(
        { sub: payload.id, email: payload.email, role: payload.role },
        {
          expiresIn: getJwtExpiresIn(
            this.configService.getOrThrow<string>('JWT_EXPIRES_IN'),
          ),
        },
      ),
      user: toUserResponse(user),
    };
  }

  async getProfile(user: CurrentUserPayload) {
    return this.usersService.findOne(user.id);
  }

  async changePassword(user: CurrentUserPayload, dto: ChangePasswordDto) {
    return this.usersService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
