import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';
import { extname, join } from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private s3Client: S3Client | null = null;
  private readonly isR2: boolean;

  constructor(private configService: ConfigService) {
    const provider = this.configService.get<string>('STORAGE_PROVIDER', 'local');
    this.isR2 = provider.toLowerCase() === 'r2';

    if (this.isR2) {
      const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
      const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
      const endpoint = this.configService.get<string>('R2_ENDPOINT');

      if (!accessKeyId || !secretAccessKey || !endpoint) {
        this.logger.error('Cloudflare R2 credentials or endpoint are missing in configuration. Falling back to local storage.');
        this.isR2 = false;
      } else {
        this.s3Client = new S3Client({
          region: 'auto',
          endpoint,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
        this.logger.log('Cloudflare R2 storage provider initialized successfully.');
      }
    } else {
      this.logger.log('Local storage provider initialized.');
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<{ url: string; originalName: string; size: number }> {
    const unique = randomBytes(12).toString('hex');
    const filename = `${unique}${extname(file.originalname)}`;

    if (this.isR2 && this.s3Client) {
      const bucketName = this.configService.get<string>('R2_BUCKET_NAME', 'eazycar');
      const publicUrl = this.configService.get<string>('R2_PUBLIC_URL');

      if (!bucketName) {
        throw new Error('R2_BUCKET_NAME is not configured.');
      }

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: filename,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      // إذا لم يكن هناك publicUrl مهيأ، سنصيغ الرابط الافتراضي للـ R2
      const url = publicUrl
        ? `${publicUrl.replace(/\/$/, '')}/${filename}`
        : `https://${bucketName}.r2.cloudflarestorage.com/${filename}`;

      return {
        url,
        originalName: file.originalname,
        size: file.size,
      };
    } else {
      // التخزين المحلي (Local storage)
      const uploadsDir = join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = join(uploadsDir, filename);
      await fs.promises.writeFile(filePath, file.buffer);

      const baseUrl = this.configService.get<string>('APP_URL') || `http://localhost:${this.configService.get<string>('PORT') || 3000}`;
      return {
        url: `${baseUrl.replace(/\/$/, '')}/uploads/${filename}`,
        originalName: file.originalname,
        size: file.size,
      };
    }
  }
}
