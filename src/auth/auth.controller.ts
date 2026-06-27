import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SWAGGER_JWT_NAME } from '../common/decorators/api-admin-auth.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { CurrentUserPayload } from '../common/interfaces/current-user-payload.interface';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập và nhận JWT token' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth(SWAGGER_JWT_NAME)
  @ApiOperation({ summary: 'Lấy thông tin tài khoản hiện tại' })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getProfile(user);
  }

  @Patch('change-password')
  @ApiBearerAuth(SWAGGER_JWT_NAME)
  @ApiOperation({
    summary: 'Đổi mật khẩu tài khoản đang đăng nhập (admin và nhân viên)',
  })
  @ApiUnauthorizedResponse({
    description: 'Chưa đăng nhập, token không hợp lệ hoặc mật khẩu hiện tại sai',
  })
  changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user, dto);
  }
}
