import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiAdminAuth } from '../common/decorators/api-admin-auth.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { CurrentUserPayload } from '../common/interfaces/current-user-payload.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo người dùng mới' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách người dùng (phân trang)' })
  findAll(@Query() query: FindUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết người dùng theo ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Kích hoạt tài khoản người dùng' })
  activate(@Param('id') id: string) {
    return this.usersService.setActiveStatus(id, true);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Khóa tài khoản người dùng' })
  deactivate(@Param('id') id: string) {
    return this.usersService.setActiveStatus(id, false);
  }

  @Patch(':id/password')
  @ApiOperation({ summary: 'Admin đặt lại mật khẩu cho người dùng' })
  resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetUserPasswordDto,
    @CurrentUser() admin: CurrentUserPayload,
  ) {
    return this.usersService.resetPassword(id, dto.newPassword, admin.id);
  }
}
