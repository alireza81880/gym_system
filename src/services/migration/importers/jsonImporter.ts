import { ParseResult } from '../migrationTypes';
import { MigrationNormalizers } from '../normalizers';

export class JsonImporter {
  /**
   * Checks if the parsed structure or JSON string is a Gym OS complete system backup
   */
  static isGymOsBackup(parsed: any): boolean {
    if (!parsed || typeof parsed !== 'object') return false;
    if (parsed.platform && typeof parsed.platform === 'string' && parsed.platform.toLowerCase().includes('gym os')) {
      return true;
    }
    if (parsed.gym_os_backup_version !== undefined) return true;
    if (parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data)) {
      if (parsed.data.gym_os_students || parsed.data.students || parsed.data.members) return true;
    }
    if (parsed._meta && parsed._meta.engine) return true;
    return false;
  }

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
        } else if (parsed.data && typeof parsed.data === 'object') {
          // Handle Gym OS Backup data container
          if (Array.isArray(parsed.data.gym_os_students)) {
            targetArray = parsed.data.gym_os_students;
          } else if (Array.isArray(parsed.data.students)) {
            targetArray = parsed.data.students;
          } else if (Array.isArray(parsed.data.members)) {
            targetArray = parsed.data.members;
          } else {
            targetArray = [parsed];
          }
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
