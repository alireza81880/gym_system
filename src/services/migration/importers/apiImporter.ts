import { ApiImportConfig, ParseResult } from '../migrationTypes';
import { MigrationNormalizers } from '../normalizers';

export class ApiImporter {
  /**
   * Test API connectivity and fetch data with authentication headers
   */
  static async fetchFromApi(config: ApiImportConfig): Promise<ParseResult> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(config.customHeaders || {}),
      };

      if (config.authType === 'bearer' && config.bearerToken) {
        headers['Authorization'] = `Bearer ${config.bearerToken.trim()}`;
      } else if (config.authType === 'api_key' && config.apiKeyHeader && config.apiKeyValue) {
        headers[config.apiKeyHeader.trim()] = config.apiKeyValue.trim();
      } else if (config.authType === 'basic' && config.username && config.password) {
        headers['Authorization'] = `Basic ${btoa(`${config.username}:${config.password}`)}`;
      }

      const response = await fetch(config.endpoint, {
        method: config.method || 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`خطای سرور سرویس‌دهنده خارجی HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      let targetArray: Record<string, any>[] = [];

      if (config.jsonPath && config.jsonPath.trim()) {
        const parts = config.jsonPath.trim().split('.');
        let current = json;
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
      } else if (Array.isArray(json)) {
        targetArray = json;
      } else if (json && typeof json === 'object') {
        if (Array.isArray(json.data)) targetArray = json.data;
        else if (Array.isArray(json.members)) targetArray = json.members;
        else if (Array.isArray(json.students)) targetArray = json.students;
        else if (Array.isArray(json.users)) targetArray = json.users;
        else if (Array.isArray(json.results)) targetArray = json.results;
        else targetArray = [json];
      }

      if (targetArray.length === 0) {
        return {
          columns: [],
          rows: [],
          totalRows: 0,
          sourceType: 'api',
        };
      }

      const rawColumns = Array.from(
        new Set(targetArray.flatMap(obj => Object.keys(obj)))
      );
      const columns = rawColumns.map(c => MigrationNormalizers.cleanString(c));

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
        sourceType: 'api',
      };
    } catch (err) {
      throw new Error(`خطا در برقراری ارتباط با وب‌سرویس API: ${(err as Error).message}`);
    }
  }
}
