import { Injectable } from '@nestjs/common';

@Injectable()
export class FileProcessorService {
  getHello(): string {
    return 'Hello World!';
  }
}
