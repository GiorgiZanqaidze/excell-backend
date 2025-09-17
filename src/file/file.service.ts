import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiProperty } from '@nestjs/swagger';
import * as XLSX from 'xlsx';
import { MongoService } from '../mongo/mongo.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { WebSocketService } from '../websocket/websocket.service';
import { UploadStatus } from '../websocket/websocket.enums';

export class TemplateColumn {
  @ApiProperty({
    description: 'Column header name',
    example: 'First Name',
  })
  header: string;

  @ApiProperty({
    description: 'Column key for data mapping',
    example: 'firstName',
  })
  key: string;

  @ApiProperty({
    description: 'Column width in Excel',
    example: 15,
    required: false,
  })
  width?: number;

  @ApiProperty({
    description: 'Data type expected in this column',
    enum: ['string', 'number', 'date', 'boolean'],
    example: 'string',
    required: false,
  })
  type?: 'string' | 'number' | 'date' | 'boolean';

  @ApiProperty({
    description: 'Whether this column is required',
    example: true,
    required: false,
  })
  required?: boolean;

  @ApiProperty({
    description: 'Example value for this column',
    example: 'John',
    required: false,
  })
  example?: string;
}

export class ExcelTemplate {
  @ApiProperty({
    description: 'Template identifier name',
    example: 'users',
  })
  name: string;

  @ApiProperty({
    description: 'Human-readable template description',
    example: 'User Import Template',
  })
  description: string;

  @ApiProperty({
    description: 'Column specifications for this template',
    type: [TemplateColumn],
  })
  columns: TemplateColumn[];

  @ApiProperty({
    description: 'Sample data for demonstration',
    required: false,
    example: [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      },
    ],
  })
  sampleData?: any[];
}

@Injectable()
export class FileService {
  constructor(
    private readonly configService: ConfigService,
    private readonly mongo: MongoService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly webSocketService: WebSocketService,
  ) {}

  /**
   * Get available Excel templates
   */
  getAvailableTemplates(): ExcelTemplate[] {
    return [
      {
        name: 'users',
        description: 'User Import Template',
        columns: [
          {
            header: 'First Name',
            key: 'firstName',
            width: 15,
            type: 'string',
            required: true,
            example: 'John',
          },
          {
            header: 'Last Name',
            key: 'lastName',
            width: 15,
            type: 'string',
            required: true,
            example: 'Doe',
          },
          {
            header: 'Email',
            key: 'email',
            width: 25,
            type: 'string',
            required: true,
            example: 'john.doe@example.com',
          },
          {
            header: 'Phone',
            key: 'phone',
            width: 15,
            type: 'string',
            required: false,
            example: '+995555123456',
          },
          {
            header: 'Birth Date',
            key: 'birthDate',
            width: 12,
            type: 'date',
            required: false,
            example: '1990-01-01',
          },
          {
            header: 'Is Active',
            key: 'isActive',
            width: 10,
            type: 'boolean',
            required: false,
            example: 'true',
          },
        ],
        sampleData: [
          {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+995555123456',
            birthDate: '1990-01-01',
            isActive: true,
          },
          {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            phone: '+995555789012',
            birthDate: '1985-05-15',
            isActive: true,
          },
        ],
      },
      {
        name: 'products',
        description: 'Product Import Template',
        columns: [
          {
            header: 'Product Name',
            key: 'name',
            width: 20,
            type: 'string',
            required: true,
            example: 'Laptop Computer',
          },
          {
            header: 'SKU',
            key: 'sku',
            width: 15,
            type: 'string',
            required: true,
            example: 'LAP-001',
          },
          {
            header: 'Price',
            key: 'price',
            width: 12,
            type: 'number',
            required: true,
            example: '999.99',
          },
          {
            header: 'Category',
            key: 'category',
            width: 15,
            type: 'string',
            required: true,
            example: 'Electronics',
          },
          {
            header: 'Stock Quantity',
            key: 'stock',
            width: 12,
            type: 'number',
            required: false,
            example: '50',
          },
          {
            header: 'Description',
            key: 'description',
            width: 30,
            type: 'string',
            required: false,
            example: 'High-performance laptop for professionals',
          },
        ],
        sampleData: [
          {
            name: 'Laptop Computer',
            sku: 'LAP-001',
            price: 999.99,
            category: 'Electronics',
            stock: 50,
            description: 'High-performance laptop for professionals',
          },
          {
            name: 'Wireless Mouse',
            sku: 'MOU-001',
            price: 29.99,
            category: 'Accessories',
            stock: 100,
            description: 'Ergonomic wireless mouse',
          },
        ],
      },
    ];
  }

  /**
   * Generate Excel template buffer
   */
  generateExcelTemplate(
    templateName: string,
    includeSampleData = false,
  ): Buffer {
    const startedAt = Date.now();
    const templates = this.getAvailableTemplates();
    const template = templates.find((t) => t.name === templateName);

    if (!template) {
      this.logger.warn({
        message: 'template.generate.not_found',
        templateName,
      });
      throw new Error(`Template '${templateName}' not found`);
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create main data sheet
    const headers = template.columns.map((col) => col.header);
    let worksheetData: any[][] = [headers];

    // Add sample data if requested
    if (includeSampleData && template.sampleData) {
      const sampleRows: string[][] = template.sampleData.map((item) =>
        template.columns.map((col) => {
          const value = (item as Record<string, unknown>)[col.key];
          if (value === null || value === undefined) return '';
          if (
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean'
          ) {
            return String(value);
          }
          if (value instanceof Date && !Number.isNaN(value.getTime())) {
            return value.toISOString().slice(0, 10);
          }
          return '';
        }),
      );
      worksheetData = worksheetData.concat(sampleRows);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    const columnWidths = template.columns.map((col) => ({
      wch: col.width || 15,
    }));
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Create instructions sheet
    const instructionsData = [
      ['Excel Import Template Instructions'],
      [''],
      ['Template:', template.name],
      ['Description:', template.description],
      [''],
      ['Column Specifications:'],
      ['Column Name', 'Required', 'Type', 'Example'],
      ...template.columns.map((col) => [
        col.header,
        col.required ? 'Yes' : 'No',
        col.type || 'string',
        col.example || '',
      ]),
      [''],
      ['Instructions:'],
      [
        '1. Fill in the "Data" sheet with your information following the column specifications above',
      ],
      ['2. Required columns must not be empty'],
      ['3. Date format should be YYYY-MM-DD (e.g., 2023-12-31)'],
      ['4. Boolean values should be true/false'],
      ['5. Save the file and upload it to the system'],
      [''],
      ['Notes:'],
      ['- Do not modify the header row in the Data sheet'],
      ['- You can delete this Instructions sheet before uploading'],
      [
        `- Maximum rows allowed: ${this.configService.get('MAX_EXCEL_ROWS') || 10000}`,
      ],
    ];

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
    instructionsSheet['!cols'] = [
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
    ];

    // Style the title
    if (instructionsSheet['A1']) {
      (instructionsSheet['A1'] as XLSX.CellObject).s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'center' },
      };
    }

    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    // Convert to buffer
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    }) as Buffer;

    this.logger.log({
      message: 'template.generate.success',
      templateName,
      includeSample: includeSampleData,
      durationMs: Date.now() - startedAt,
      size: excelBuffer.length,
    });

    return excelBuffer;
  }

  /**
   * Get template info by name
   */
  getTemplateInfo(templateName: string): ExcelTemplate {
    const templates = this.getAvailableTemplates();
    const template = templates.find((t) => t.name === templateName);

    if (!template) {
      this.logger.warn({ message: 'template.info.not_found', templateName });
      throw new Error(`Template '${templateName}' not found`);
    }

    return template;
  }

  /**
   * Export real data from MongoDB to Excel
   */
  async exportDataToExcel(templateName: string, limit = 1000): Promise<Buffer> {
    const startedAt = Date.now();
    const template = this.getTemplateInfo(templateName);

    const collection = this.mongo.getCollection(
      templateName === 'users' ? 'users' : 'products',
    );
    const docs = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 1000)
      .toArray();

    const headers = template.columns.map((col) => col.header);
    const rows: string[][] = docs.map((doc) =>
      template.columns.map((col) => {
        const value = (doc as Record<string, unknown>)[col.key];
        if (value === null || value === undefined) return '';
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          return String(value);
        }
        if (value instanceof Date && !Number.isNaN(value.getTime())) {
          return value.toISOString().slice(0, 10);
        }
        return '';
      }),
    );

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    worksheet['!cols'] = template.columns.map((col) => ({
      wch: col.width || 15,
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    }) as Buffer;

    this.logger.log({
      message: 'export.success',
      templateName,
      limit: Number(limit) || 1000,
      exportedCount: docs.length,
      durationMs: Date.now() - startedAt,
      size: excelBuffer.length,
    });

    return excelBuffer;
  }

  /**
   * Upload Excel, validate and persist into MongoDB with WebSocket progress updates
   */
  async processExcelUpload(
    templateName: string,
    buffer: Buffer,
    jobId?: string,
  ): Promise<{ message: string; processed: number; errors: string[] }> {
    const startedAt = Date.now();
    this.logger.log({
      message: 'upload.process.start',
      templateName,
      size: buffer.length,
      jobId,
    });

    // Emit start progress
    if (jobId) {
      this.webSocketService.emitProgress(jobId, {
        jobId,
        templateName,
        status: UploadStatus.STARTED,
        progress: 0,
        message: 'Starting file processing...',
      });
    }

    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const template = this.getTemplateInfo(templateName);
    const headerKeys = template.columns.map((c) => c.key);
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      header: headerKeys,
      range: 1, // skip header row
      defval: '',
      raw: false,
    });

    const errors: string[] = [];
    const docs: any[] = [];
    const totalRows = rows.length;

    // Emit processing start
    if (jobId) {
      this.webSocketService.emitProgress(jobId, {
        jobId,
        templateName,
        status: UploadStatus.PROCESSING,
        progress: 10,
        message: `Processing ${totalRows} rows...`,
        processed: 0,
        total: totalRows,
      });
    }

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      try {
        if (templateName === 'users') {
          docs.push(this.mapUserRow(row));
        } else if (templateName === 'products') {
          docs.push(this.mapProductRow(row));
        } else {
          throw new Error(`Unsupported template '${templateName}'`);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown processing error';
        // +2 because header row + 1-based index
        errors.push(`Row ${index + 2}: ${message}`);
      }

      // Emit progress every 10 rows or at the end
      if (jobId && (index % 10 === 0 || index === rows.length - 1)) {
        const progress = Math.round(((index + 1) / totalRows) * 80) + 10; // 10-90%
        this.webSocketService.emitProgress(jobId, {
          jobId,
          templateName,
          status: UploadStatus.PROCESSING,
          progress,
          message: `Processed ${index + 1} of ${totalRows} rows`,
          processed: index + 1,
          total: totalRows,
        });
      }
    }

    // Emit database insertion progress
    if (jobId) {
      this.webSocketService.emitProgress(jobId, {
        jobId,
        templateName,
        status: UploadStatus.PROCESSING,
        progress: 90,
        message: 'Saving to database...',
        processed: docs.length,
        total: totalRows,
      });
    }

    if (docs.length > 0) {
      const collection = this.mongo.getCollection(
        templateName === 'users' ? 'users' : 'products',
      );
      await collection.insertMany(docs);
    }

    const result = {
      message: `Processed ${docs.length} of ${rows.length} rows`,
      processed: docs.length,
      errors,
    };

    // Emit completion
    if (jobId) {
      this.webSocketService.emitProgress(jobId, {
        jobId,
        templateName,
        status: UploadStatus.COMPLETED,
        progress: 100,
        message: `Successfully processed ${docs.length} rows`,
        processed: docs.length,
        total: totalRows,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    if (errors.length > 0) {
      this.logger.warn({
        message: 'upload.process.partial',
        templateName,
        processed: docs.length,
        total: rows.length,
        errorsCount: errors.length,
        durationMs: Date.now() - startedAt,
        jobId,
      });
    } else {
      this.logger.log({
        message: 'upload.process.success',
        templateName,
        processed: docs.length,
        total: rows.length,
        durationMs: Date.now() - startedAt,
        jobId,
      });
    }

    return result;
  }

  async getData(templateName: string, page = 1, limit = 10): Promise<any[]> {
    const startedAt = Date.now();
    const collection = this.mongo.getCollection(
      templateName === 'users' ? 'users' : 'products',
    );
    const skip = (Number(page) - 1) * Number(limit);
    const cursor = collection
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const data = await cursor.toArray();
    this.logger.log({
      message: 'data.fetch.success',
      templateName,
      page: Number(page),
      limit: Number(limit),
      returned: data.length,
      durationMs: Date.now() - startedAt,
    });
    return data;
  }

  private parseBoolean(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const n = value.trim().toLowerCase();
      if (['true', '1', 'yes'].includes(n)) return true;
      if (['false', '0', 'no'].includes(n)) return false;
    }
    if (typeof value === 'number') return value !== 0;
    return undefined;
  }

  private parseNumber(value: unknown): number | undefined {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const n = Number(value);
      return Number.isNaN(n) ? undefined : n;
    }
    return undefined;
  }

  private parseDate(value: unknown): Date | undefined {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value === 'string') {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? undefined : d;
    }
    if (typeof value === 'number') {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? undefined : d;
    }
    return undefined;
  }

  private required<T>(value: T | undefined, name: string): T {
    if (value === undefined || value === null || value === '') {
      throw new Error(`Field '${name}' is required`);
    }
    return value;
  }

  private mapUserRow(row: Record<string, unknown>) {
    const firstName = this.required<string>(
      row.firstName as string,
      'firstName',
    );
    const lastName = this.required<string>(row.lastName as string, 'lastName');
    const email = this.required<string>(row.email as string, 'email');
    const phone = (row.phone as string) ?? undefined;
    const birthDate = this.parseDate(row.birthDate);
    const isActive = this.parseBoolean(row.isActive) ?? true;

    return {
      firstName,
      lastName,
      email,
      phone,
      birthDate,
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private mapProductRow(row: Record<string, unknown>) {
    const name = this.required<string>(row.name as string, 'name');
    const sku = this.required<string>(row.sku as string, 'sku');
    const price = this.required<number>(this.parseNumber(row.price), 'price');
    const category = this.required<string>(row.category as string, 'category');
    const stock = this.parseNumber(row.stock) ?? 0;
    const description = (row.description as string) ?? undefined;

    return {
      name,
      sku,
      price,
      category,
      stock,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
