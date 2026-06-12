import {
  Controller, Post, UseInterceptors, UploadedFile,
  ParseFilePipe, MaxFileSizeValidator, FileTypeValidator,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

// حفظ الملفات على الـ disk في مجلد uploads/
const storage = diskStorage({
  destination: join(process.cwd(), 'uploads'),
  filename: (_req, file, cb) => {
    const unique = randomBytes(12).toString('hex');
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor() {}

  @Post('image')
  @ApiOperation({ summary: 'رفع صورة (بطاقة / رخصة / أي صورة)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage }))
  uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // حد أقصى 5 ميجابايت
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          // صور فقط
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    return {
      url: `${baseUrl}/uploads/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
    };
  }
}
