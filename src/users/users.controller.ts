import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
    @Body() body: { nationalId: string; imageUrl: string },
  ) {
    return this.usersService.submitNationalId(userId, body.nationalId, body.imageUrl);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'إحصائياتي كعميل' })
  getStats(@CurrentUser('id') userId: string) {
    return this.usersService.getStats(userId);
  }
}
