import { Controller, Get, Patch, Param, Body, UseGuards, Post, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { CreateNotificationTemplateDto } from './dto/notification-template.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'جيب كل إشعاراتي' })
  getAll(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUserNotifications(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'علم الإشعار كمقروء' })
  markRead(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(userId, id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'علم كل الإشعارات كمقروءة' })
  markAllRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  // الـ mobile app بيبعت device token عشان يستقبل push notifications
  @Post('device-token')
  @ApiOperation({ summary: 'تسجيل device token للـ push notifications' })
  registerToken(
    @CurrentUser('id') userId: string,
    @Body() body: { token: string; platform: 'ios' | 'android' },
  ) {
    return this.notificationsService.registerDeviceToken(userId, body.token, body.platform);
  }

  // ─── مسارات الآدمين لإدارة قوالب الإشعارات (Admin only) ──────────────────────

  @Get('admin/templates')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'جلب كل قوالب الإشعارات' })
  getTemplates() {
    return this.notificationsService.getTemplates();
  }

  @Post('admin/templates')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'إنشاء أو تحديث قالب إشعار' })
  upsertTemplate(@Body() dto: CreateNotificationTemplateDto) {
    return this.notificationsService.upsertTemplate(dto);
  }

  @Delete('admin/templates/:type')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'حذف قالب إشعار' })
  deleteTemplate(@Param('type') type: string) {
    return this.notificationsService.deleteTemplate(type);
  }
}
