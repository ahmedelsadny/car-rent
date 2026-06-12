import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OwnersService } from './owners.service';
import { RegisterOwnerDto } from './dto/register-owner.dto';

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
}
