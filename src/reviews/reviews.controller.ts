import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'كتابة تقييم بعد الإيجار' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(userId, dto);
  }

  @Get('car/:carId')
  @ApiOperation({ summary: 'تقييمات سيارة معينة' })
  getCarReviews(@Param('carId') carId: string) {
    return this.reviewsService.getCarReviews(carId);
  }

  @Get('owner/:userId')
  @ApiOperation({ summary: 'تقييمات معرض معين' })
  getOwnerReviews(@Param('userId') userId: string) {
    return this.reviewsService.getOwnerReviews(userId);
  }
}
