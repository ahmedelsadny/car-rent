import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { isUUID } from 'class-validator';

@Injectable()
export class ParseUUIDPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isUUID(value)) {
      throw new BadRequestException('معرف (ID) غير صحيح، يجب أن يكون بتنسيق UUID');
    }
    return value;
  }
}
