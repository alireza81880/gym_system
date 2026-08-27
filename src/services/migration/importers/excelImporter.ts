import * as XLSX from 'xlsx';
import { ParseResult } from '../migrationTypes';
import { MigrationNormalizers } from '../normalizers';

export class ExcelImporter {
  /**
   * Parse XLSX / XLS file using SheetJS and extract multi-sheet info
   */
  static async parse(file: File, selectedSheetName?: string): Promise<ParseResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('فایل اکسل انتخاب شده فاقد شیت (Sheet) معتبر است.');
          }

          // Build sheets metadata
          const sheets = workbook.SheetNames.map(name => {
            const ws = workbook.Sheets[name];
            const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
            const rowCount = Math.max(0, range.e.r - range.s.r);
            return { name, rowCount };
          });

          // Select sheet (requested sheet or first sheet)
          const sheetToRead = selectedSheetName && workbook.Sheets[selectedSheetName]
            ? selectedSheetName
            : workbook.SheetNames[0];

          const worksheet = workbook.Sheets[sheetToRead];
          const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

          if (!rawRows || rawRows.length === 0) {
            resolve({
              columns: [],
              rows: [],
              totalRows: 0,
              sheets,
              selectedSheet: sheetToRead,
              sourceType: 'xlsx',
              fileName: file.name,
              fileSize: file.size,
            });
            return;
          }

          // Extract and sanitize column names
          const columns = Object.keys(rawRows[0]).map(col => MigrationNormalizers.cleanString(col));

          // Clean row values
          const cleanRows = rawRows.map(row => {
            const cleanObj: Record<string, any> = {};
            Object.entries(row).forEach(([key, val]) => {
              const cleanKey = MigrationNormalizers.cleanString(key);
              cleanObj[cleanKey] = typeof val === 'string' ? MigrationNormalizers.cleanString(val) : val;
            });
            return cleanObj;
          });

          resolve({
            columns,
            rows: cleanRows,
            totalRows: cleanRows.length,
            sheets,
            selectedSheet: sheetToRead,
            sourceType: 'xlsx',
            fileName: file.name,
            fileSize: file.size,
          });
        } catch (err) {
          reject(new Error(`خطا در بازخوانی فایل اکسل: ${(err as Error).message}`));
        }
      };

      reader.onerror = () => reject(new Error('خطا در خواندن فایل از حافظه محلی'));
      reader.readAsArrayBuffer(file);
    });
  }
}
