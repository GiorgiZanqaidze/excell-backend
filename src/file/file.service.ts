import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as XLSX from 'xlsx';

export interface TemplateColumn {
  header: string;
  key: string;
  width?: number;
  type?: 'string' | 'number' | 'date' | 'boolean';
  required?: boolean;
  example?: string;
}

export interface ExcelTemplate {
  name: string;
  description: string;
  columns: TemplateColumn[];
  sampleData?: any[];
}

@Injectable()
export class FileService {
  constructor(private configService: ConfigService) {}

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
    const templates = this.getAvailableTemplates();
    const template = templates.find((t) => t.name === templateName);

    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create main data sheet
    const headers = template.columns.map((col) => col.header);
    let worksheetData: any[][] = [headers];

    // Add sample data if requested
    if (includeSampleData && template.sampleData) {
      const sampleRows = template.sampleData.map((item) =>
        template.columns.map((col) => (item[col.key] as string) || ''),
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
      instructionsSheet['A1'].s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'center' },
      };
    }

    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    // Convert to buffer
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
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
      throw new Error(`Template '${templateName}' not found`);
    }

    return template;
  }
}
