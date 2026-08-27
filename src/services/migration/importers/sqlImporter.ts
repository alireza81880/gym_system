import { ParseResult } from '../migrationTypes';
import { MigrationNormalizers } from '../normalizers';

export interface SqlTableInspection {
  name: string;
  estimatedRows: number;
  columns: string[];
  sampleRows: Record<string, any>[];
}

export class SqlImporter {
  /**
   * Inspect and safely parse SQL Dump without evaluating arbitrary scripts
   */
  static inspect(sqlContent: string): {
    tables: SqlTableInspection[];
    detectedDialect: 'MySQL/MariaDB' | 'PostgreSQL' | 'SQLite' | 'Standard SQL';
  } {
    const cleanSql = sqlContent.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '');
    
    // Detect SQL dialect
    let detectedDialect: 'MySQL/MariaDB' | 'PostgreSQL' | 'SQLite' | 'Standard SQL' = 'Standard SQL';
    if (/ENGINE=InnoDB|AUTO_INCREMENT/i.test(sqlContent)) {
      detectedDialect = 'MySQL/MariaDB';
    } else if (/SET\s+client_encoding|pg_dump/i.test(sqlContent)) {
      detectedDialect = 'PostgreSQL';
    } else if (/PRAGMA\s+foreign_keys/i.test(sqlContent)) {
      detectedDialect = 'SQLite';
    }

    const tableNames: string[] = [];
    const tableColumns: Record<string, string[]> = {};
    const tableRows: Record<string, Record<string, any>[]> = {};

    // 1. Detect CREATE TABLE statements
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`|"|')?([a-zA-Z0-9_]+)(?:`|"|')?\s*\(([\s\S]*?)\);/gi;
    let match;

    while ((match = createTableRegex.exec(cleanSql)) !== null) {
      const tableName = match[1];
      const columnDefs = match[2];
      tableNames.push(tableName);
      tableRows[tableName] = [];

      const cols = columnDefs
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('PRIMARY') && !line.startsWith('KEY') && !line.startsWith('CONSTRAINT') && !line.startsWith('UNIQUE') && !line.startsWith('FOREIGN'))
        .map(line => {
          const firstWord = line.split(/\s+/)[0].replace(/[`"']/g, '').trim();
          return firstWord;
        })
        .filter(c => c && c.length > 0);

      tableColumns[tableName] = cols;
    }

    // 2. Parse INSERT INTO statements for each table
    tableNames.forEach(tbl => {
      const insertRegex = new RegExp(`INSERT\\s+INTO\\s+(?:\`|"|')?${tbl}(?:\`|"|')?\\s*(?:\\(([^)]+)\\))?\\s*VALUES\\s*([\\s\\S]*?);`, 'gi');
      let insMatch;

      while ((insMatch = insertRegex.exec(cleanSql)) !== null) {
        const explicitCols = insMatch[1]
          ? insMatch[1].split(',').map(c => c.trim().replace(/[`"']/g, ''))
          : tableColumns[tbl] || [];
        
        const valuesSection = insMatch[2];
        const rowRegex = /\(([^)]+)\)/g;
        let rMatch;

        while ((rMatch = rowRegex.exec(valuesSection)) !== null && tableRows[tbl].length < 2000) {
          const rawVals = rMatch[1].split(',').map(v => {
            const trimmed = v.trim();
            if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
              return trimmed.slice(1, -1).replace(/\\'/g, "'");
            }
            if (trimmed.toUpperCase() === 'NULL') return '';
            return trimmed;
          });

          const rowObj: Record<string, any> = {};
          explicitCols.forEach((c, idx) => {
            rowObj[c] = rawVals[idx] !== undefined ? MigrationNormalizers.cleanString(rawVals[idx]) : '';
          });
          tableRows[tbl].push(rowObj);
        }
      }
    });

    const tables: SqlTableInspection[] = tableNames.map(name => ({
      name,
      estimatedRows: tableRows[name]?.length || 0,
      columns: tableColumns[name] || [],
      sampleRows: (tableRows[name] || []).slice(0, 5),
    }));

    return {
      tables,
      detectedDialect,
    };
  }

  /**
   * Extract rows from a selected table in the SQL dump
   */
  static extractTableData(sqlContent: string, selectedTableName: string): ParseResult {
    const inspection = this.inspect(sqlContent);
    const tbl = inspection.tables.find(t => t.name === selectedTableName);

    if (!tbl) {
      throw new Error(`جدول "${selectedTableName}" در فایل SQL یافت نشد.`);
    }

    return {
      columns: tbl.columns,
      rows: tbl.sampleRows,
      totalRows: tbl.estimatedRows,
      sourceType: 'sql',
    };
  }
}
