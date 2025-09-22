import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { LoggerService } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { WebSocketService } from '../websocket/websocket.service';
import { FileService } from './file.service';

export type UploadJobData = {
  templateName: string;
  // Base64-encoded Excel file buffer
  buffer: string;
  jobId?: string;
};

@Processor('file')
@Injectable()
export class FileProcessor extends WorkerHost {
  constructor(
    private readonly fileService: FileService,
    private readonly webSocketService: WebSocketService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    super();
  }

  async process(job: Job<UploadJobData>): Promise<unknown> {
    if (job.name === 'upload-excel') {
      const { templateName, buffer, jobId } = job.data;
      const actualJobId = jobId || job.id?.toString() || 'unknown';

      this.logger.log({
        message: 'queue.upload.received',
        templateName,
        jobId: actualJobId,
      });

      try {
        const fileBuffer = Buffer.from(buffer as unknown as string, 'base64');
        const result = await this.fileService.processExcelUpload(
          templateName as unknown as string,
          fileBuffer,
          actualJobId,
        );

        // Emit completion via WebSocket
        this.webSocketService.emitCompletion(actualJobId, result);

        this.logger.log({
          message: 'queue.upload.processed',
          templateName,
          jobId: actualJobId,
          result,
        });
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;

        // Emit error via WebSocket
        this.webSocketService.emitError(actualJobId, errorMessage);

        this.logger.error({
          message: 'queue.upload.failed',
          templateName,
          jobId: actualJobId,
          error: errorMessage,
          stack: errorStack,
        });
        throw error;
      }
    }
    return undefined;
  }
}
