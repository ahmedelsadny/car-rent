import { Controller, Get, Patch, Post, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SubmitNationalIdDto } from './dto/submit-national-id.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'الـ profile الخاص بي' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'تعديل الـ profile' })
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Post('me/national-id')
  @ApiOperation({ summary: 'رفع صورة الهوية للتحقق' })
  submitNationalId(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitNationalIdDto,
  ) {
    return this.usersService.submitNationalId(userId, dto.nationalId, dto.imageUrl);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'إحصائياتي كعميل' })
  getStats(@CurrentUser('id') userId: string) {
    return this.usersService.getStats(userId);
  }

  // ─── مسارات الآدمين (تحتاج JWT + AdminGuard) ─────────────────────────────

  @Get('admin/dashboard-stats')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'إحصائيات لوحة التحكم الكاملة للمنصة (للآدمين فقط)' })
  getAdminDashboardStats() {
    return this.usersService.getAdminDashboardStats();
  }

  @Get('admin/pending-verification')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'جلب طلبات التوثيق المعلقة للعملاء (للآدمين فقط)' })
  findPendingVerifications() {
    return this.usersService.findPendingVerifications();
  }

  @Patch(':id/verify')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'توثيق حساب عميل (للآدمين فقط)' })
  verifyUser(@Param('id') id: string) {
    return this.usersService.verifyUser(id);
  }

  @Patch(':id/reject-verification')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'رفض طلب توثيق عميل (للآدمين فقط)' })
  rejectUserVerification(@Param('id') id: string) {
    return this.usersService.rejectUserVerification(id);
  }
}

