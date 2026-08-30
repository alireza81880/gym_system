import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  Code2, 
  Database, 
  Globe, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  RefreshCw,
  Layers,
  KeyRound,
  Sliders,
  Download,
  PlayCircle,
  Sparkles
} from 'lucide-react';
import { 
  MigrationSourceType, 
  ParseResult, 
  ApiImportConfig 
} from '../../../services/migration/migrationTypes';
import { ExcelImporter } from '../../../services/migration/importers/excelImporter';
import { CsvImporter } from '../../../services/migration/importers/csvImporter';
import { JsonImporter } from '../../../services/migration/importers/jsonImporter';
import { SqlImporter } from '../../../services/migration/importers/sqlImporter';
import { ApiImporter } from '../../../services/migration/importers/apiImporter';
import { VendorImporter } from '../../../services/migration/importers/vendorImporter';
import { SampleExcelGenerator } from '../../../services/migration/sampleExcelGenerator';

interface FileUploaderProps {
  sourceType: MigrationSourceType;
  onDataParsed: (result: ParseResult, file?: File) => void;
  onBack: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  sourceType,
  onDataParsed,
  onBack,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Excel Multi-sheet state
  const [excelSheets, setExcelSheets] = useState<{ name: string; rowCount: number }[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');

  // CSV Delimiter state
  const [csvDelimiter, setCsvDelimiter] = useState<string>(',');
  const [csvRawText, setCsvRawText] = useState<string>('');

  // JSON Path state
  const [jsonPath, setJsonPath] = useState<string>('');
  const [jsonRawText, setJsonRawText] = useState<string>('');

  // SQL State
  const [sqlContent, setSqlContent] = useState<string>('');
  const [sqlTables, setSqlTables] = useState<{ name: string; estimatedRows: number; columns: string[] }[]>([]);
  const [selectedSqlTable, setSelectedSqlTable] = useState<string>('');

  // API Config State
  const [apiConfig, setApiConfig] = useState<ApiImportConfig>({
    endpoint: 'https://api.gymexample.com/v1/members',
    method: 'GET',
    authType: 'bearer',
    bearerToken: '',
    jsonPath: 'data',
  });

  // Vendor State
  const [selectedVendor, setSelectedVendor] = useState<string>('vendor-zkteco');

  // Handle Drag Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Process selected file based on source type
  const processFile = async (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (sourceType === 'xlsx') {
        const result = await ExcelImporter.parse(file);
        if (result.sheets && result.sheets.length > 1) {
          setExcelSheets(result.sheets);
          setSelectedSheet(result.sheets[0].name);
        }
        onDataParsed(result, file);
      } else if (sourceType === 'csv') {
        const text = await file.text();
        setCsvRawText(text);
        const result = CsvImporter.parse(text, file.name);
        if (result.detectedDelimiter) {
          setCsvDelimiter(result.detectedDelimiter);
        }
        onDataParsed(result, file);
      } else if (sourceType === 'json') {
        const text = await file.text();
        setJsonRawText(text);
        const result = JsonImporter.parse(text, file.name, jsonPath);
        onDataParsed(result, file);
      } else if (sourceType === 'sql') {
        const text = await file.text();
        setSqlContent(text);
        const inspection = SqlImporter.inspect(text);
        setSqlTables(inspection.tables);
        if (inspection.tables.length > 0) {
          setSelectedSqlTable(inspection.tables[0].name);
          const result = SqlImporter.extractTableData(text, inspection.tables[0].name);
          onDataParsed(result, file);
        } else {
          throw new Error('هیچ جدولی در فایل پشتیبان SQL شناسایی نشد.');
        }
      }
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Sheet change for Excel
  const handleSheetChange = async (sheetName: string) => {
    if (!selectedFile) return;
    setSelectedSheet(sheetName);
    setIsLoading(true);
    try {
      const result = await ExcelImporter.parse(selectedFile, sheetName);
      onDataParsed(result, selectedFile);
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Delimiter change for CSV
  const handleDelimiterChange = (delim: string) => {
    setCsvDelimiter(delim);
    if (!csvRawText) return;
    try {
      const result = CsvImporter.parse(csvRawText, selectedFile?.name, delim);
      onDataParsed(result, selectedFile || undefined);
    } catch (err) {
      setErrorMessage((err as Error).message);
    }
  };

  // Direct load sample excel workbook for immediate instant testing
  const handleLoadSampleExcelDirectly = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = SampleExcelGenerator.generateSampleWorkbook();
      const sampleFile = new File([data], 'gym_members_sample.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      setSelectedFile(sampleFile);
      const result = await ExcelImporter.parse(sampleFile);
      if (result.sheets && result.sheets.length > 1) {
        setExcelSheets(result.sheets);
        setSelectedSheet(result.sheets[0].name);
      }
      onDataParsed(result, sampleFile);
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Test API connection
  const handleTestApi = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await ApiImporter.fetchFromApi(apiConfig);
      onDataParsed(result);
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="migration-file-uploader">
      {/* Source header summary */}
      <div className="flex items-center justify-between p-4 glass-subtle rounded-xl border border-[var(--gym-border)]">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-lg bg-[var(--gym-brand-soft)] text-[var(--gym-brand)] border border-[var(--gym-border-strong)]">
            {sourceType === 'xlsx' && <FileSpreadsheet className="w-5 h-5" />}
            {sourceType === 'csv' && <FileText className="w-5 h-5" />}
            {sourceType === 'json' && <Code2 className="w-5 h-5" />}
            {sourceType === 'sql' && <Database className="w-5 h-5" />}
            {sourceType === 'api' && <Globe className="w-5 h-5" />}
            {sourceType === 'vendor' && <Building2 className="w-5 h-5" />}
          </span>
          <div>
            <h3 className="text-sm font-bold text-[var(--gym-text)]">
              {sourceType === 'xlsx' && 'بارگذاری فایل اکسل (.xlsx, .xls)'}
              {sourceType === 'csv' && 'بارگذاری فایل CSV متنی (.csv, .txt)'}
              {sourceType === 'json' && 'بارگذاری فایل JSON داده‌های ساختاریافته'}
              {sourceType === 'sql' && 'بارگذاری فایل پشتیبان SQL Dump'}
              {sourceType === 'api' && 'پیکربندی اتصال به API وب‌سرویس'}
              {sourceType === 'vendor' && 'انتخاب کانکتور اختصاصی نرم‌افزار باشگاه'}
            </h3>
            <p className="text-xs text-[var(--gym-text-muted)]">
              داده‌های خام با بالاترین استانداردهای امنیتی بررسی و فقط در حافظه محلی مرورگر پردازش می‌شوند.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="text-xs text-[var(--gym-text-muted)] hover:text-[var(--gym-text)] px-3 py-1.5 rounded-lg border border-[var(--gym-border)] hover:border-[var(--gym-border-strong)] transition-colors glass-subtle"
        >
          تغییر منبع
        </button>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">خطا در پردازش منبع:</span>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* API Form */}
      {sourceType === 'api' ? (
        <div className="p-6 glass-regular rounded-2xl border border-[var(--gym-border)] space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-[var(--gym-text-secondary)]">آدرس وب‌سرویس (API Endpoint URL)</label>
              <input
                type="text"
                dir="ltr"
                value={apiConfig.endpoint}
                onChange={(e) => setApiConfig({ ...apiConfig, endpoint: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-subtle border border-[var(--gym-border)] text-[var(--gym-text)] text-xs focus:border-[var(--gym-brand)] focus:outline-none"
                placeholder="https://api.yourgym.com/api/v1/members"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--gym-text-secondary)]">متد درخواست (HTTP Method)</label>
              <select
                value={apiConfig.method}
                onChange={(e) => setApiConfig({ ...apiConfig, method: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-subtle border border-[var(--gym-border)] text-[var(--gym-text)] text-xs focus:border-[var(--gym-brand)] focus:outline-none"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--gym-text-secondary)]">نوع احراز هویت (Authentication)</label>
              <select
                value={apiConfig.authType}
                onChange={(e) => setApiConfig({ ...apiConfig, authType: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-subtle border border-[var(--gym-border)] text-[var(--gym-text)] text-xs focus:border-[var(--gym-brand)] focus:outline-none"
              >
                <option value="bearer">Bearer Token (توکن استاندارد)</option>
                <option value="api_key">API Key (کلید اختصاصی هدر)</option>
                <option value="basic">Basic Auth (نام کاربری و رمز)</option>
                <option value="none">بدون احراز هویت (Public)</option>
              </select>
            </div>

            {apiConfig.authType === 'bearer' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">توکن Bearer</label>
                <input
                  type="password"
                  dir="ltr"
                  value={apiConfig.bearerToken || ''}
                  onChange={(e) => setApiConfig({ ...apiConfig, bearerToken: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                  placeholder="eyJhbGciOiJIUzI1NiIs..."
                />
              </div>
            )}

            {apiConfig.authType === 'api_key' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">نام هدر API Key</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={apiConfig.apiKeyHeader || 'X-API-KEY'}
                    onChange={(e) => setApiConfig({ ...apiConfig, apiKeyHeader: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">مقدار API Key</label>
                  <input
                    type="password"
                    dir="ltr"
                    value={apiConfig.apiKeyValue || ''}
                    onChange={(e) => setApiConfig({ ...apiConfig, apiKeyValue: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--gym-text-secondary)]">مسیر کلید آرایه داده‌ها (JSON Path اختیاری)</label>
            <input
              type="text"
              dir="ltr"
              value={apiConfig.jsonPath || ''}
              onChange={(e) => setApiConfig({ ...apiConfig, jsonPath: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl glass-subtle border border-[var(--gym-border)] text-[var(--gym-text)] text-xs focus:border-[var(--gym-brand)] focus:outline-none"
              placeholder="data.members یا items"
            />
            <p className="text-[11px] text-[var(--gym-text-muted)]">اگر پاسخ API در فیلد خاصی مانند `data` یا `results` قرار دارد آن را وارد کنید.</p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              id="btn-test-api-fetch"
              onClick={handleTestApi}
              disabled={isLoading || !apiConfig.endpoint}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--gym-brand)] hover:brightness-110 text-[var(--gym-bg)] font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              <span>تست اتصال و دریافت رکوردها</span>
            </button>
          </div>
        </div>
      ) : sourceType === 'vendor' ? (
        /* Vendor selection panel */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VendorImporter.VENDORS.map((v) => {
              const isSelected = selectedVendor === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVendor(v.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'glass-neon border-[var(--gym-brand)] ring-2 ring-[var(--gym-brand-soft)]'
                      : 'glass-subtle border-[var(--gym-border)] hover:border-[var(--gym-border-strong)]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--gym-text)] mb-1">{v.vendorTitleFa}</h4>
                      <p className="text-xs text-[var(--gym-text-muted)] leading-relaxed mb-3">{v.descriptionFa}</p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        v.status === 'supported'
                          ? 'bg-[var(--gym-brand-soft)] text-[var(--gym-brand)] border border-[var(--gym-border-strong)]'
                          : v.status === 'requires_gateway'
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-800'
                          : 'glass-subtle text-[var(--gym-text-muted)] border border-[var(--gym-border)]'
                      }`}
                    >
                      {v.status === 'supported' ? 'پشتیبانی کامل' : v.status === 'requires_gateway' ? 'نیازمند گیت' : 'به‌زودی'}
                    </span>
                  </div>

                  <div className="text-[11px] text-[var(--gym-text-muted)] flex items-center gap-2 pt-2 border-t border-[var(--gym-border)]">
                    <span className="font-semibold text-[var(--gym-text-secondary)]">نسخه‌های تست شده:</span>
                    <span>{v.supportedVersions.join(' ، ')}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 glass-subtle rounded-xl border border-[var(--gym-border)] flex items-center justify-between">
            <span className="text-xs text-[var(--gym-text-muted)]">
              برای واردسازی فایل خروجی این نرم‌افزار، لطفاً فایل اکسل یا CSV را در بخش زیر بارگذاری فرمایید.
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-[var(--gym-brand)] hover:brightness-110 text-[var(--gym-bg)] font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              انتخاب فایل خروجی
            </button>
          </div>
        </div>
      ) : (
        /* File Upload Box */
        <div className="space-y-4">
          {sourceType === 'xlsx' && (
            <div className="p-4 glass-regular border border-[var(--gym-border-strong)] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-[var(--gym-brand-soft)] text-[var(--gym-brand)] border border-[var(--gym-border-strong)]">
                  <FileSpreadsheet className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-[var(--gym-text)]">فایل نمونه استاندارد اکسل (۳۲ عضو با تمام حالات تستی)</h4>
                  <p className="text-[11px] text-[var(--gym-text-muted)]">شامل اعضای فعال، دارای بدهی، کدهای ملی، اعداد فارسی و موارد تکراری</p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  id="btn-download-sample-excel-uploader"
                  onClick={(e) => {
                    e.stopPropagation();
                    SampleExcelGenerator.downloadSampleExcel();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass-subtle hover:bg-[var(--gym-brand-soft)] border border-[var(--gym-border)] text-[var(--gym-text)] text-xs font-semibold transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--gym-brand)]" />
                  <span>دانلود فایل (.xlsx)</span>
                </button>

                <button
                  type="button"
                  id="btn-load-sample-excel-directly"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadSampleExcelDirectly();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--gym-brand)] hover:brightness-110 text-[var(--gym-bg)] text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>تست سریع با فایل نمونه</span>
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            id="file-upload-input"
            accept={
              sourceType === 'xlsx'
                ? '.xlsx, .xls'
                : sourceType === 'csv'
                ? '.csv, .txt'
                : sourceType === 'json'
                ? '.json'
                : '.sql'
            }
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-[var(--gym-brand)] bg-[var(--gym-brand-soft)]'
                : selectedFile
                ? 'border-[var(--gym-border-strong)] glass-regular'
                : 'border-[var(--gym-border)] hover:border-[var(--gym-border-strong)] glass-subtle hover:glass-regular'
            }`}
          >
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[var(--gym-brand-soft)] border border-[var(--gym-border-strong)] text-[var(--gym-brand)] flex items-center justify-center">
                {isLoading ? (
                  <RefreshCw className="w-8 h-8 animate-spin" />
                ) : (
                  <Upload className="w-8 h-8" />
                )}
              </div>

              {selectedFile ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2 text-[var(--gym-text)] font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[var(--gym-brand)]" />
                    <span>{selectedFile.name}</span>
                  </div>
                  <p className="text-xs text-[var(--gym-text-muted)]">
                    حجم فایل: {(selectedFile.size / 1024).toFixed(1)} کیلوبایت • برای تغییر فایل دوباره کلیک کنید
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[var(--gym-text)]">
                    فایل را بکشید و در اینجا رها کنید، یا برای انتخاب کلیک کنید
                  </h4>
                  <p className="text-xs text-[var(--gym-text-muted)]">
                    {sourceType === 'xlsx' && 'پشتیبانی از فایل‌های اکسل مایکروسافت (.xlsx و .xls)'}
                    {sourceType === 'csv' && 'پشتیبانی از فایل‌های متنی با کدگذاری UTF-8 و جداکننده‌های استاندارد'}
                    {sourceType === 'json' && 'پشتیبانی از ساختار JSON آرایه‌ای اعضا یا پشتیبان Gym OS'}
                    {sourceType === 'sql' && 'پشتیبانی از فایل‌های متنی پشتیبان SQL dump پایگاه داده'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Multi-Sheet Selector for Excel */}
          {sourceType === 'xlsx' && excelSheets.length > 1 && (
            <div className="p-4 glass-subtle rounded-xl border border-[var(--gym-border)] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--gym-text-secondary)]">
                <Layers className="w-4 h-4 text-[var(--gym-brand)]" />
                <span>این فایل اکسل دارای {excelSheets.length} شیت مختلف است. شیت مورد نظر برای واردسازی را انتخاب کنید:</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {excelSheets.map((sh) => (
                  <button
                    key={sh.name}
                    type="button"
                    onClick={() => handleSheetChange(sh.name)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      selectedSheet === sh.name
                        ? 'bg-[var(--gym-brand-soft)] text-[var(--gym-brand)] border-[var(--gym-border-strong)] font-bold'
                        : 'glass-subtle text-[var(--gym-text-muted)] border-[var(--gym-border)] hover:text-[var(--gym-text)]'
                    }`}
                  >
                    {sh.name} ({sh.rowCount} ردیف)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Delimiter Selector for CSV */}
          {sourceType === 'csv' && (
            <div className="p-4 glass-subtle rounded-xl border border-[var(--gym-border)] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-[var(--gym-text-secondary)] font-semibold">
                <Sliders className="w-4 h-4 text-[var(--gym-brand)]" />
                <span>جداکننده ستون‌ها (Delimiter):</span>
              </div>
              <div className="flex gap-2">
                {[
                  { label: 'کاما ( , )', value: ',' },
                  { label: 'نقطه ویرگول ( ; )', value: ';' },
                  { label: 'تب ( Tab )', value: '\t' },
                  { label: 'پایپ ( | )', value: '|' },
                ].map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => handleDelimiterChange(d.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      csvDelimiter === d.value
                        ? 'bg-[var(--gym-brand-soft)] text-[var(--gym-brand)] border-[var(--gym-border-strong)] font-bold'
                        : 'glass-subtle text-[var(--gym-text-muted)] border-[var(--gym-border)] hover:text-[var(--gym-text)]'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
