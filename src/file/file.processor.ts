import { Inject, Injectable } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { FileService } from './file.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import type { LoggerService } from '@nestjs/common';

export type UploadJobData = {
  templateName: string;
  // Base64-encoded Excel file buffer
  buffer: string;
};

@Processor('file')
@Injectable()
export class FileProcessor extends WorkerHost {
  constructor(
    private readonly fileService: FileService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    super();
  }

  async process(job: Job<UploadJobData>): Promise<unknown> {
    if (job.name === 'upload-excel') {
      const { templateName, buffer } = job.data;
      this.logger.log({
        message: 'queue.upload.received',
        templateName,
        jobId: job.id,
      });
      const fileBuffer = Buffer.from(buffer as unknown as string, 'base64');
      const result = await this.fileService.processExcelUpload(
        templateName as unknown as string,
        fileBuffer,
      );
      this.logger.log({
        message: 'queue.upload.processed',
        templateName,
        jobId: job.id,
        result,
      });
      return result;
    }
    return undefined;
  }
}
