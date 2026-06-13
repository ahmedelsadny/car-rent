import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OwnersService } from './owners.service';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';
import { OwnerGuard } from '../common/guards/owner.guard';

@ApiTags('Owners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('owners')
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  @Post('register')
  @ApiOperation({ summary: 'تسجيل كمعرض / صاحب سيارات' })
  register(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterOwnerDto,
  ) {
    return this.ownersService.register(userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'بروفايل الـ owner' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.ownersService.getProfile(userId);
  }

  @Patch('me')
  @UseGuards(OwnerGuard)
  @ApiOperation({ summary: 'تعديل الملف الشخصي للمعرض' })
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateOwnerDto,
  ) {
    return this.ownersService.updateProfile(userId, dto);
  }

  @Get('me/dashboard')
  @ApiOperation({ summary: 'إحصائيات الـ dashboard' })
  getDashboard(@CurrentUser('id') userId: string) {
    return this.ownersService.getDashboardStats(userId);
  }

  @Get('me/bookings')
  @ApiOperation({ summary: 'آخر الحجوزات' })
  getBookings(@CurrentUser('id') userId: string) {
    return this.ownersService.getRecentBookings(userId);
  }

  // ─── مسارات الآدمين (تحتاج JWT + AdminGuard) ─────────────────────────────

  @Get('admin/pending')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'جلب المعارض المعلقة (للآدمين فقط)' })
  findPendingOwners() {
    return this.ownersService.findPendingOwners();
  }

  @Patch(':id/verify')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'توثيق معرض (للآدمين فقط)' })
  verifyOwner(@Param('id') id: string) {
    return this.ownersService.verifyOwner(id);
  }

  @Patch(':id/unverify')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'إلغاء توثيق معرض (للآدمين فقط)' })
  unverifyOwner(@Param('id') id: string) {
    return this.ownersService.unverifyOwner(id);
  }
}
