import { ParseResult } from '../migrationTypes';
import { MigrationNormalizers } from '../normalizers';

export class CsvImporter {
  /**
   * Parse CSV text with Persian text encoding and delimiter auto-detection
   */
  static parse(
    text: string, 
    fileName?: string, 
    forcedDelimiter?: string
  ): ParseResult {
    if (!text || !text.trim()) {
      return {
        columns: [],
        rows: [],
        totalRows: 0,
        sourceType: 'csv',
        fileName,
      };
    }

    // Clean zero width spaces and BOM
    const cleanText = text.replace(/^\uFEFF/, '').trim();
    const lines = cleanText.split(/\r?\n/).filter(line => line.trim().length > 0);

    if (lines.length === 0) {
      return {
        columns: [],
        rows: [],
        totalRows: 0,
        sourceType: 'csv',
        fileName,
      };
    }

    // Auto-detect delimiter if not forced
    const firstLine = lines[0];
    const candidateDelimiters = [',', ';', '\t', '|'];
    let delimiter = forcedDelimiter || ',';

    if (!forcedDelimiter) {
      let maxCount = 0;
      for (const d of candidateDelimiters) {
        const count = (firstLine.match(new RegExp(`\\${d}`, 'g')) || []).length;
        if (count > maxCount) {
          maxCount = count;
          delimiter = d;
        }
      }
    }

    // Parse CSV line with quotes support
    const parseLine = (line: string): string[] => {
      const values: string[] = [];
      let currentValue = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          values.push(currentValue.trim().replace(/^"|"$/g, '').trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim().replace(/^"|"$/g, '').trim());
      return values;
    };

    const rawColumns = parseLine(lines[0]);
    const columns = rawColumns.map(c => MigrationNormalizers.cleanString(c));
    const rows: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const vals = parseLine(lines[i]);
      const rowObj: Record<string, any> = {};
      columns.forEach((col, idx) => {
        rowObj[col] = vals[idx] !== undefined ? MigrationNormalizers.cleanString(vals[idx]) : '';
      });
      rows.push(rowObj);
    }

    return {
      columns,
      rows,
      totalRows: rows.length,
      detectedDelimiter: delimiter,
      sourceType: 'csv',
      fileName,
    };
  }
}
