import { Controller, Get } from '@nestjs/common';
import { FileProcessorService } from './file-processor.service';

@Controller()
export class FileProcessorController {
  constructor(private readonly fileProcessorService: FileProcessorService) {}

  @Get()
  getHello(): string {
    return this.fileProcessorService.getHello();
  }
}
