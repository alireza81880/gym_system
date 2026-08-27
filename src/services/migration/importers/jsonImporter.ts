import { ParseResult } from '../migrationTypes';
import { MigrationNormalizers } from '../normalizers';

export class JsonImporter {
  /**
   * Parse JSON string and extract records from arrays or nested paths
   */
  static parse(
    jsonString: string,
    fileName?: string,
    jsonPath?: string
  ): ParseResult {
    try {
      const cleanStr = jsonString.replace(/^\uFEFF/, '').trim();
      const parsed = JSON.parse(cleanStr);
      let targetArray: Record<string, any>[] = [];

      if (jsonPath && jsonPath.trim()) {
        const parts = jsonPath.trim().split('.');
        let current = parsed;
        for (const p of parts) {
          if (current && current[p] !== undefined) {
            current = current[p];
          }
        }
        if (Array.isArray(current)) {
          targetArray = current;
        } else if (current && typeof current === 'object') {
          targetArray = [current];
        }
      } else if (Array.isArray(parsed)) {
        targetArray = parsed;
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.members)) {
          targetArray = parsed.members;
        } else if (Array.isArray(parsed.students)) {
          targetArray = parsed.students;
        } else if (Array.isArray(parsed.users)) {
          targetArray = parsed.users;
        } else if (Array.isArray(parsed.data)) {
          targetArray = parsed.data;
        } else if (parsed.data && Array.isArray(parsed.data.members)) {
          targetArray = parsed.data.members;
        } else if (Array.isArray(parsed.items)) {
          targetArray = parsed.items;
        } else {
          targetArray = [parsed];
        }
      }

      if (targetArray.length === 0) {
        return {
          columns: [],
          rows: [],
          totalRows: 0,
          sourceType: 'json',
          fileName,
        };
      }

      // Collect all unique keys as columns
      const rawColumns = Array.from(
        new Set(targetArray.flatMap(obj => Object.keys(obj)))
      );
      const columns = rawColumns.map(c => MigrationNormalizers.cleanString(c));

      // Sanitize rows
      const cleanRows = targetArray.map(obj => {
        const row: Record<string, any> = {};
        columns.forEach(col => {
          const val = obj[col];
          row[col] = typeof val === 'string' ? MigrationNormalizers.cleanString(val) : (val ?? '');
        });
        return row;
      });

      return {
        columns,
        rows: cleanRows,
        totalRows: cleanRows.length,
        sourceType: 'json',
        fileName,
      };
    } catch (err) {
      throw new Error(`فرمت فایل JSON نامعتبر است: ${(err as Error).message}`);
    }
  }
}
