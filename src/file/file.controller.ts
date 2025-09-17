import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  HttpException,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiProduces,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Response, Request } from 'express';
import { FileService, ExcelTemplate } from './file.service';
import { FileInterceptor } from '@nestjs/platform-express';
import type { FileFilterCallback } from 'multer';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, JobsOptions } from 'bullmq';
type FileJobPayload = { templateName: string; buffer: string; jobId?: string };

const excelFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  if (
    file.mimetype.includes('spreadsheet') ||
    file.originalname.endsWith('.xlsx') ||
    file.originalname.endsWith('.xls')
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

@ApiTags('file')
@Controller('file')
export class FileController {
  constructor(
    private readonly fileService: FileService,
    @InjectQueue('file')
    private readonly fileQueue: Queue<FileJobPayload, unknown, string>,
  ) {}

  @Get('templates/:templateName/download')
  @ApiOperation({
    summary: 'Download Excel template',
    description: 'Download an Excel template file, optionally with sample data',
  })
  @ApiParam({
    name: 'templateName',
    description: 'Name of the template to download',
    example: 'users',
  })
  @ApiQuery({
    name: 'includeSample',
    description: 'Include sample data in the template',
    required: false,
    example: 'true',
    enum: ['true', 'false'],
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiResponse({
    status: 200,
    description: 'Excel file download',
    headers: {
      'Content-Type': {
        description: 'MIME type for Excel files',
        schema: { type: 'string' },
      },
      'Content-Disposition': {
        description: 'File attachment header',
        schema: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  downloadTemplate(
    @Param('templateName') templateName: string,
    @Query('includeSample') includeSample: string,
    @Res() res: Response,
  ) {
    try {
      const includeSampleData = includeSample === 'true';
      const buffer = this.fileService.generateExcelTemplate(
        templateName,
        includeSampleData,
      );

      const template = this.fileService.getTemplateInfo(templateName);
      const filename = `${template.name}_template${includeSampleData ? '_with_sample' : ''}.xlsx`;

      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length,
      });

      res.send(buffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HttpException(message, HttpStatus.NOT_FOUND);
    }
  }

  @Get('export/:templateName')
  @ApiOperation({ summary: 'Export real data to Excel' })
  @ApiParam({ name: 'templateName', example: 'users' })
  @ApiQuery({ name: 'limit', required: false, example: 1000 })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiResponse({ status: 200, description: 'Excel file download' })
  async exportData(
    @Param('templateName') templateName: string,
    @Query('limit') limit = 1000,
    @Res() res: Response,
  ) {
    try {
      const buffer = await this.fileService.exportDataToExcel(
        templateName,
        Number(limit),
      );

      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${templateName}_export.xlsx"`,
        'Content-Length': buffer.length,
      });

      res.send(buffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('upload/:templateName/async')
  @ApiOperation({ summary: 'Upload Excel asynchronously using BullMQ' })
  @ApiParam({ name: 'templateName', example: 'users' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Excel file payload',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: excelFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadAsync(
    @Param('templateName') templateName: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }
    const options: JobsOptions = {
      removeOnComplete: true,
      attempts: 1,
    };
    const jobId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const job = await this.fileQueue.add(
      'upload-excel',
      {
        templateName,
        buffer: file.buffer.toString('base64'),
        jobId,
      },
      options,
    );

    return { jobId: job.id, status: 'queued' };
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get job status/result' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  async getJobStatus(@Param('id') id: string) {
    const job = await this.fileQueue.getJob(id);
    if (!job) {
      throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    }

    const state = await job.getState();
    const progress = job.progress;
    const attemptsMade = job.attemptsMade;
    const returnvalue = job.returnvalue;
    const failedReason = job.failedReason;

    return { id, state, progress, attemptsMade, returnvalue, failedReason };
  }

  @Get('data/:templateName')
  @ApiOperation({ summary: 'Get paginated data from DB' })
  @ApiParam({ name: 'templateName', example: 'users' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  async getData(
    @Param('templateName') templateName: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.fileService.getData(templateName, Number(page), Number(limit));
  }
}
