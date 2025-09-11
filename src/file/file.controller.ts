import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { FileService, ExcelTemplate } from './file.service';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  /**
   * Get list of available templates
   */
  @Get('templates')
  getTemplates(): ExcelTemplate[] {
    return this.fileService.getAvailableTemplates();
  }

  /**
   * Get specific template information
   */
  @Get('templates/:templateName')
  getTemplateInfo(@Param('templateName') templateName: string): ExcelTemplate {
    try {
      return this.fileService.getTemplateInfo(templateName);
    } catch (error) {
      throw new HttpException(error, HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Download Excel template
   */
  @Get('templates/:templateName/download')
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
      throw new HttpException(error, HttpStatus.NOT_FOUND);
    }
  }
}
