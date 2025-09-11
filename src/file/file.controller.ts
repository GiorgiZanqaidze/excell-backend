import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiProduces,
} from '@nestjs/swagger';
import { Response } from 'express';
import { FileService, ExcelTemplate } from './file.service';

@ApiTags('file')
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get('templates')
  @ApiOperation({
    summary: 'Get available Excel templates',
    description:
      'Returns a list of all available Excel templates with their specifications',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available templates',
    type: [ExcelTemplate],
  })
  getTemplates(): ExcelTemplate[] {
    return this.fileService.getAvailableTemplates();
  }

  @Get('templates/:templateName')
  @ApiOperation({
    summary: 'Get template information',
    description: 'Get detailed information about a specific Excel template',
  })
  @ApiParam({
    name: 'templateName',
    description: 'Name of the template (e.g., users, products)',
    example: 'users',
  })
  @ApiResponse({
    status: 200,
    description: 'Template information',
    type: ExcelTemplate,
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  getTemplateInfo(@Param('templateName') templateName: string): ExcelTemplate {
    try {
      return this.fileService.getTemplateInfo(templateName);
    } catch (error) {
      throw new HttpException(error, HttpStatus.NOT_FOUND);
    }
  }

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
      throw new HttpException(error, HttpStatus.NOT_FOUND);
    }
  }
}
