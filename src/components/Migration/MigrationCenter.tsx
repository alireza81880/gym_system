import React, { useState, useRef } from 'react';
import { 
  ArrowRightLeft, 
  FileSpreadsheet, 
  FileCode, 
  Database, 
  Globe, 
  Upload, 
  Check, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw, 
  Play, 
  Save, 
  Trash2, 
  FileText, 
  Layers, 
  Sparkles, 
  Eye, 
  Filter, 
  ChevronRight, 
  Info,
  Key,
  Smartphone,
  CreditCard,
  UserCheck,
  Zap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { 
  MigrationService, 
  ParseResult, 
  ImportValidationItem 
} from '../../services/migrationService';
import { 
  ImportMappingProfile, 
  DuplicateResolution, 
  ApiImportConfig, 
  Student 
} from '../../types';
import { ValidationService } from '../../services/validationService';

type IngestionSource = 'xlsx' | 'csv' | 'json' | 'sql' | 'api' | 'zkteco';

export const MigrationCenter: React.FC = () => {
  const { 
    students, 
    customFields, 
    mappingProfiles, 
    saveMappingProfile, 
    deleteMappingProfile, 
    migrationReports, 
    migrationSnapshots, 
    executeMigration, 
    rollbackMigration,
    formatMoney,
    formatNum
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Tab & Workflow Step
  const [activeSource, setActiveSource] = useState<IngestionSource>('xlsx');
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'report'>('upload');

  // Uploaded / Parsed Data
  const [fileName, setFileName] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParseResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mapping State
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [newProfileName, setNewProfileName] = useState<string>('');

  // Validated Items & Duplicates
  const [validatedItems, setValidatedItems] = useState<ImportValidationItem[]>([]);
  const [globalConflictResolution, setGlobalConflictResolution] = useState<DuplicateResolution>('merge');
  const [rowConflictResolutions, setRowConflictResolutions] = useState<Record<string, DuplicateResolution>>({});

  // Filter in Preview Table
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'duplicate' | 'warning' | 'error'>('all');

  // API Config State
  const [apiConfig, setApiConfig] = useState<ApiImportConfig>({
    endpoint: 'https://api.legacygym.example.com/v1/members',
    method: 'GET',
    authType: 'bearer',
    bearerToken: '',
    jsonPath: 'data',
  });

  // SQL Content State
  const [sqlText, setSqlText] = useState<string>('');
  const [sqlInspection, setSqlInspection] = useState<{ tables: { name: string; estimatedRows: number; columns: string[] }[] } | null>(null);

  // Migration Execution Result
  const [latestReportId, setLatestReportId] = useState<string | null>(null);

  // ----------------------------------------------------
  // FILE PARSING HANDLERS
  // ----------------------------------------------------
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    setFileName(file.name);

    try {
      let result: ParseResult;
      const lowerName = file.name.toLowerCase();

      if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        result = await MigrationService.parseXlsx(file);
      } else if (lowerName.endsWith('.csv') || lowerName.endsWith('.txt')) {
        const text = await file.text();
        result = MigrationService.parseCsv(text);
      } else if (lowerName.endsWith('.json')) {
        const text = await file.text();
        result = MigrationService.parseJson(text);
      } else if (lowerName.endsWith('.sql')) {
        const text = await file.text();
        setSqlText(text);
        const inspection = MigrationService.inspectSqlBackup(text);
        setSqlInspection(inspection);
        setIsLoading(false);
        return;
      } else {
        throw new Error('فرمت فایل پشتیبانی نمی‌شود. لطفاً فایل XLSX، CSV، JSON یا SQL بارگذاری نمایید.');
      }

      if (result.rows.length === 0) {
        throw new Error('فایل بارگذاری شده حاوی هیچ ردیف داده‌ای نیست.');
      }

      setParsedData(result);

      // Auto Suggest Mappings
      const suggested = MigrationService.suggestMappings(result.columns);
      setColumnMappings(suggested);

      setStep('mapping');
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiFetch = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await MigrationService.fetchFromApi(apiConfig);
      if (res.rows.length === 0) {
        throw new Error('پاسخ دریافتی از API حاوی ردیف داده معتبری نبود.');
      }
      setParsedData(res);
      setFileName(`API: ${apiConfig.endpoint}`);
      const suggested = MigrationService.suggestMappings(res.columns);
      setColumnMappings(suggested);
      setStep('mapping');
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------
  // MAPPING & PROFILE ACTIONS
  // ----------------------------------------------------
  const handleApplyProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
    const profile = mappingProfiles.find(p => p.id === profileId);
    if (profile && parsedData) {
      const newMap: Record<string, string> = {};
      parsedData.columns.forEach(col => {
        if (profile.mappings[col]) {
          newMap[col] = profile.mappings[col];
        }
      });
      setColumnMappings(newMap);
    }
  };

  const handleSaveCurrentProfile = () => {
    if (!newProfileName.trim()) return;
    const profile: ImportMappingProfile = {
      id: `profile-${Date.now()}`,
      name: newProfileName.trim(),
      sourceType: activeSource,
      mappings: columnMappings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveMappingProfile(profile);
    setSelectedProfileId(profile.id);
    setNewProfileName('');
  };

  const handleProceedToPreview = () => {
    if (!parsedData) return;
    setIsLoading(true);

    const validation = MigrationService.validateAndPreview(
      parsedData.rows,
      columnMappings,
      students
    );

    setValidatedItems(validation);

    // Initialize row resolutions
    const resolutions: Record<string, DuplicateResolution> = {};
    validation.forEach(v => {
      if (v.isDuplicate && v.duplicateMatch) {
        resolutions[v.duplicateMatch.id] = globalConflictResolution;
      }
    });
    setRowConflictResolutions(resolutions);

    setIsLoading(false);
    setStep('preview');
  };

  // ----------------------------------------------------
  // EXECUTION & ROLLBACK
  // ----------------------------------------------------
  const handleExecuteMigration = () => {
    if (validatedItems.length === 0) return;
    setIsLoading(true);

    try {
      const report = executeMigration(
        validatedItems,
        rowConflictResolutions,
        {
          sourceType: activeSource,
          fileName,
        }
      );
      setLatestReportId(report.id);
      setStep('report');
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRollback = (snapshotId: string) => {
    if (window.confirm('آیا از بازگردانی داده‌ها به نسخه قبل از این واردسازی اطمینان دارید؟ تغییرات اعمال شده بازگردانی خواهند شد.')) {
      const ok = rollbackMigration(snapshotId);
      if (ok) {
        alert('بازگردانی اطلاعات با موفقیت انجام شد.');
      } else {
        alert('خطا در بازگردانی نسخه پشتیبان.');
      }
    }
  };

  const resetWorkflow = () => {
    setParsedData(null);
    setValidatedItems([]);
    setFileName('');
    setErrorMessage(null);
    setStep('upload');
  };

  // Calculated Stats
  const validCount = validatedItems.filter(i => i.isValid && !i.isDuplicate && i.warnings.length === 0).length;
  const duplicateCount = validatedItems.filter(i => i.isDuplicate).length;
  const warningCount = validatedItems.filter(i => i.warnings.length > 0 && i.isValid).length;
  const errorCount = validatedItems.filter(i => !i.isValid).length;

  const filteredItems = validatedItems.filter(item => {
    if (previewFilter === 'valid') return item.isValid && !item.isDuplicate && item.warnings.length === 0;
    if (previewFilter === 'duplicate') return item.isDuplicate;
    if (previewFilter === 'warning') return item.warnings.length > 0 && item.isValid;
    if (previewFilter === 'error') return !item.isValid;
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <ArrowRightLeft className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              مرکز جامع انتقال و مهاجرت داده‌ها
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-normal">Data Bridge Pro</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              مهاجرت بدون قطعی اعضا، بدهی‌ها، کارت‌های تردد و کمدها از نرم‌افزارهای قدیمی، اکسل، ZKTeco، CSV و دیتابیس
            </p>
          </div>
        </div>

        {step !== 'upload' && (
          <button
            onClick={resetWorkflow}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm border border-slate-700 transition-all self-start md:self-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>شروع انتقال جدید</span>
          </button>
        )}
      </div>

      {/* Workflow Progress Breadcrumb */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { key: 'upload', title: '۱. بارگذاری و منبع داده', icon: Upload },
          { key: 'mapping', title: '۲. نگاشت فیلدها', icon: ArrowRightLeft },
          { key: 'preview', title: '۳. اعتبارسنجی و تکراری‌ها', icon: Eye },
          { key: 'report', title: '۴. گزارش نهایی', icon: CheckCircle2 },
        ].map((s) => {
          const Icon = s.icon;
          const isActive = step === s.key;
          return (
            <div
              key={s.key}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-md shadow-indigo-500/5'
                  : 'bg-slate-900/40 border-slate-800/60 text-slate-500'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                isActive ? 'bg-indigo-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold">{s.title}</span>
            </div>
          );
        })}
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STEP 1: SOURCE SELECTION & UPLOAD                    */}
      {/* ---------------------------------------------------- */}
      {step === 'upload' && (
        <div className="space-y-6">
          {/* Source Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { id: 'xlsx', title: 'فایل اکسل (XLSX)', icon: FileSpreadsheet, badge: 'پراستفاده' },
              { id: 'zkteco', title: 'سامانه ZKTeco', icon: Smartphone, badge: 'BioSecurity' },
              { id: 'csv', title: 'فایل متن CSV', icon: FileCode, badge: 'UTF-8' },
              { id: 'json', title: 'فایل دیتابیس JSON', icon: FileText, badge: 'GymOS' },
              { id: 'sql', title: 'پشتیبان SQL', icon: Database, badge: 'MySQL / PG' },
              { id: 'api', title: 'وب سرویس REST API', icon: Globe, badge: 'Live Connect' },
            ].map((src) => {
              const Icon = src.icon;
              const isSelected = activeSource === src.id;
              return (
                <button
                  key={src.id}
                  onClick={() => setActiveSource(src.id as IngestionSource)}
                  className={`relative p-4 rounded-2xl border text-right transition-all flex flex-col justify-between h-28 ${
                    isSelected
                      ? 'bg-gradient-to-br from-indigo-500/15 to-indigo-950/40 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      {src.badge}
                    </span>
                  </div>
                  <span className="text-xs font-bold mt-2">{src.title}</span>
                </button>
              );
            })}
          </div>

          {/* Upload & Source Box */}
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
            {/* XLSX / CSV / JSON / ZKTeco Upload Zone */}
            {(activeSource === 'xlsx' || activeSource === 'csv' || activeSource === 'json' || activeSource === 'zkteco') && (
              <div className="space-y-6">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-3xl p-10 text-center cursor-pointer transition-all bg-slate-800/30 hover:bg-slate-800/60 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.json,.sql,.txt"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4 transition-all">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    فایل مورد نظر را اینجا بکشید یا برای انتخاب کلیک کنید
                  </h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    پشتیبانی کامل از فایل‌های اکسل فارسی (.xlsx, .xls)، فایل‌های متنی (.csv) و فرمت JSON
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                    <span className="text-xs px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                      UTF-8 Encoded
                    </span>
                    <span className="text-xs px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                      تشخیص خودکار ستون‌های فارسی
                    </span>
                    <span className="text-xs px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                      پشتیبانی تا ۵۰,۰۰۰ رکورد
                    </span>
                  </div>
                </div>

                {/* Preset Profiles Showcase */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    قالب‌های استاندارد آماده برای بارگذاری آسان:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {MigrationService.PRESET_PROFILES.map((prof) => (
                      <div
                        key={prof.id}
                        className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            <h5 className="text-xs font-bold text-white">{prof.name}</h5>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2">{prof.description}</p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-700/40 text-[10px] text-slate-500 font-mono">
                          {Object.keys(prof.mappings).length} فیلد نگاشت شده
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* REST API Connector */}
            {activeSource === 'api' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">اتصال مستقیم به API وب‌سرویس باشگاه</h3>
                  <p className="text-xs text-slate-400">دریافت لیست اعضا و تراکنش‌ها از طریق وب‌سرویس REST با احراز هویت امن</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Endpoint URL</label>
                    <input
                      type="text"
                      value={apiConfig.endpoint}
                      onChange={(e) => setApiConfig({ ...apiConfig, endpoint: e.target.value })}
                      placeholder="https://api.gym.com/api/v1/members"
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">JSON Array Path</label>
                    <input
                      type="text"
                      value={apiConfig.jsonPath || ''}
                      onChange={(e) => setApiConfig({ ...apiConfig, jsonPath: e.target.value })}
                      placeholder="data / members / items"
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Authentication Type</label>
                    <select
                      value={apiConfig.authType}
                      onChange={(e) => setApiConfig({ ...apiConfig, authType: e.target.value as any })}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="bearer">Bearer Token (JWT)</option>
                      <option value="api_key">API Key Header</option>
                      <option value="basic">Basic Auth</option>
                      <option value="none">None (Public)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Token / Secret</label>
                    <input
                      type="password"
                      value={apiConfig.bearerToken || ''}
                      onChange={(e) => setApiConfig({ ...apiConfig, bearerToken: e.target.value })}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleApiFetch}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all"
                >
                  <Globe className="w-4 h-4" />
                  <span>{isLoading ? 'در حال برقراری ارتباط...' : 'دریافت داده‌ها از وب‌سرویس'}</span>
                </button>
              </div>
            )}

            {/* SQL Dump Inspector */}
            {activeSource === 'sql' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">بازخوانی بک‌آپ SQL پایگاه داده قبلی</h3>
                  <p className="text-xs text-slate-400">فایل .sql حاوی جداول کاربران نرم‌افزار قبلی را بارگذاری یا متن آن را الصاق کنید.</p>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center cursor-pointer hover:border-indigo-500 transition-all bg-slate-800/30"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".sql,.txt"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <Database className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                  <span className="text-xs text-white font-bold block">انتخاب فایل پشتیبان SQL</span>
                  <span className="text-[11px] text-slate-400">MySQL Dump / PostgreSQL Export</span>
                </div>

                {sqlInspection && sqlInspection.tables.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300">جداول شناسایی شده در فایل بک‌آپ:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {sqlInspection.tables.map((tbl) => (
                        <div key={tbl.name} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs">
                          <div className="font-bold text-indigo-300 font-mono">{tbl.name}</div>
                          <div className="text-[11px] text-slate-400 mt-1">تعداد ستون‌ها: {tbl.columns.length}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-1">
                            {tbl.columns.slice(0, 4).join(', ')}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Past Migration History */}
          {migrationReports.length > 0 && (
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-indigo-400" />
                تاریخچه مهاجرت‌ها و نسخه‌های پشتیبان خودکار
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 pr-4 font-semibold">شناسه / فایل</th>
                      <th className="pb-3 font-semibold">منبع</th>
                      <th className="pb-3 font-semibold">تاریخ و زمان</th>
                      <th className="pb-3 font-semibold text-center">وارد شده</th>
                      <th className="pb-3 font-semibold text-center">به‌روزرسانی</th>
                      <th className="pb-3 font-semibold text-center">خطا</th>
                      <th className="pb-3 pl-4 font-semibold text-left">عملیات بازگردانی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {migrationReports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-slate-800/30 transition-all">
                        <td className="py-3.5 pr-4 font-medium text-white">
                          <div>{rep.fileName || rep.sourceType}</div>
                          <span className="text-[10px] text-slate-500 font-mono">{rep.id}</span>
                        </td>
                        <td className="py-3.5 text-slate-300 font-mono uppercase">{rep.sourceType}</td>
                        <td className="py-3.5 text-slate-400">
                          {new Date(rep.timestamp).toLocaleString('fa-IR')}
                        </td>
                        <td className="py-3.5 text-center font-bold text-emerald-400 font-mono">
                          +{rep.importedCount}
                        </td>
                        <td className="py-3.5 text-center font-bold text-cyan-400 font-mono">
                          {rep.updatedCount}
                        </td>
                        <td className="py-3.5 text-center font-bold text-red-400 font-mono">
                          {rep.errorCount}
                        </td>
                        <td className="py-3.5 pl-4 text-left">
                          {rep.rollbackAvailable ? (
                            <button
                              onClick={() => handleRollback(rep.migrationId)}
                              className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-all inline-flex items-center gap-1.5"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>بازگردانی ۱-کلیک</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500">بازگردانی شده / ناموجود</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STEP 2: FIELD MAPPING TABLE                          */}
      {/* ---------------------------------------------------- */}
      {step === 'mapping' && parsedData && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
                تنظیم و تطبیق ستون‌ها (Field Mapping)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                تعداد {parsedData.rows.length} ردیف با {parsedData.columns.length} ستون شناسایی شد. فیلدهای منبع را به فیلدهای استاندارد Gym OS متصل کنید.
              </p>
            </div>

            {/* Profile Selector */}
            <div className="flex items-center gap-3">
              <select
                value={selectedProfileId}
                onChange={(e) => handleApplyProfile(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="">انتخاب قالب نگاشت آماده...</option>
                {mappingProfiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mapping Grid */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 pr-4 font-semibold">ستون در فایل مبدا ({fileName})</th>
                    <th className="pb-3 font-semibold">نمونه داده (ردیف ۱)</th>
                    <th className="pb-3 font-semibold text-center">اتصال به</th>
                    <th className="pb-3 pl-4 font-semibold">فیلد هدف در سامانه Gym OS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {parsedData.columns.map((col) => {
                    const sampleVal = parsedData.rows[0]?.[col] ?? '—';
                    const currentTarget = columnMappings[col] || '';

                    return (
                      <tr key={col} className="hover:bg-slate-800/30 transition-all">
                        <td className="py-3.5 pr-4 font-bold text-white font-mono">
                          {col}
                        </td>
                        <td className="py-3.5 text-slate-400 font-mono text-[11px] max-w-xs truncate">
                          {String(sampleVal)}
                        </td>
                        <td className="py-3.5 text-center text-indigo-400">
                          →
                        </td>
                        <td className="py-3.5 pl-4">
                          <select
                            value={currentTarget}
                            onChange={(e) => setColumnMappings({ ...columnMappings, [col]: e.target.value })}
                            className={`w-full max-w-xs px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                              currentTarget
                                ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300 font-semibold'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                          >
                            <option value="">-- نادیده گرفتن این ستون --</option>
                            <optgroup label="مشخصات هویتی و عمومی">
                              <option value="fullName">نام و نام خانوادگی کامل</option>
                              <option value="firstName">نام کوچک</option>
                              <option value="lastName">نام خانوادگی</option>
                              <option value="memberNumber">شماره عضویت / شماره پرونده</option>
                              <option value="nationalId">کد ملی (۱۰ رقمی)</option>
                              <option value="birthDate">تاریخ تولد</option>
                            </optgroup>
                            <optgroup label="اطلاعات تماس">
                              <option value="phone">شماره تلفن همراه (موبایل)</option>
                              <option value="emergencyPhone">شماره تماس اضطراری</option>
                            </optgroup>
                            <optgroup label="اشتراک و مالی">
                              <option value="registrationDate">تاریخ ثبت‌نام / شروع دوره</option>
                              <option value="expireDate">تاریخ انقضای عضویت</option>
                              <option value="packageType">نوع پکیج / نام دوره</option>
                              <option value="totalFee">مبلغ کل شهریه</option>
                              <option value="paidAmount">مبلغ پرداختی</option>
                              <option value="remainingDebt">مانده بدهی</option>
                            </optgroup>
                            <optgroup label="سخت‌افزار و تردد">
                              <option value="rfidCardUid">شناسه کارت RFID / دستبند</option>
                              <option value="sessionsTotal">تعداد کل جلسات مجاز</option>
                              <option value="sessionsAttended">تعداد جلسات استفاده شده</option>
                            </optgroup>
                            <optgroup label="یادداشت‌ها و فیلدهای سفارشی">
                              <option value="notes">توضیحات و یادداشت عمومی</option>
                              <option value="medicalNotes">نکات پزشکی و منع تمرین</option>
                              {customFields.map(cf => (
                                <option key={cf.id} value={`custom:${cf.key}`}>فیلد سفارشی: {cf.label}</option>
                              ))}
                            </optgroup>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Save Profile Box & Next Button */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="نام قالب نگاشت برای ذخیره (مثال: اکسل باشگاه سالن ۲)"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 w-64"
                />
                <button
                  onClick={handleSaveCurrentProfile}
                  disabled={!newProfileName.trim()}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-all disabled:opacity-40"
                >
                  <Save className="w-4 h-4 inline-block ml-1" />
                  ذخیره قالب
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep('upload')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  بازگشت
                </button>
                <button
                  onClick={handleProceedToPreview}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all"
                >
                  <span>مرحله بعدی: پیش‌نمایش و اعتبارسنجی</span>
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STEP 3: PREVIEW & DUPLICATE MERGE ENGINE             */}
      {/* ---------------------------------------------------- */}
      {step === 'preview' && (
        <div className="space-y-6">
          {/* Summary Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-xs text-slate-400">کل ردیف‌ها</span>
              <p className="text-xl font-bold text-white mt-1 font-mono">{validatedItems.length}</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <span className="text-xs text-emerald-400">آماده و بدون نقص</span>
              <p className="text-xl font-bold text-emerald-300 mt-1 font-mono">{validCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-center">
              <span className="text-xs text-indigo-400">عضو تکراری (نیاز به ادغام)</span>
              <p className="text-xl font-bold text-indigo-300 mt-1 font-mono">{duplicateCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
              <span className="text-xs text-amber-400">هشدار اصلاح</span>
              <p className="text-xl font-bold text-amber-300 mt-1 font-mono">{warningCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-center">
              <span className="text-xs text-red-400">خطای بحرانی (نامعتبر)</span>
              <p className="text-xl font-bold text-red-300 mt-1 font-mono">{errorCount}</p>
            </div>
          </div>

          {/* Duplicate Conflict Strategy Bar */}
          {duplicateCount > 0 && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 to-slate-900 border border-indigo-500/40 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">سیاست ادغام رکوردهای تکراری (Duplicate Conflict Strategy)</h4>
                  <p className="text-xs text-slate-400">تطبیق بر اساس شماره عضویت، کد ملی، شماره موبایل و شباهت نام</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 font-medium">سیاست کلی:</span>
                <select
                  value={globalConflictResolution}
                  onChange={(e) => {
                    const res = e.target.value as DuplicateResolution;
                    setGlobalConflictResolution(res);
                    const updated: Record<string, DuplicateResolution> = {};
                    validatedItems.forEach(v => {
                      if (v.isDuplicate && v.duplicateMatch) {
                        updated[v.duplicateMatch.id] = res;
                      }
                    });
                    setRowConflictResolutions(updated);
                  }}
                  className="px-3 py-2 bg-slate-800 border border-indigo-500/50 rounded-xl text-white text-xs font-semibold focus:outline-none"
                >
                  <option value="merge">ادغام هوشمند فیلدها (پیشنهادی)</option>
                  <option value="use_imported">جایگزینی کامل با رکورد جدید فایل</option>
                  <option value="keep_existing">حفظ عضو موجود و صرف‌نظر از ردیف جدید</option>
                  <option value="skip">رد کردن کامل رکوردهای تکراری</option>
                </select>
              </div>
            </div>
          )}

          {/* Filter Bar & Table */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-300">نمایش:</span>
                {(['all', 'valid', 'duplicate', 'warning', 'error'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setPreviewFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      previewFilter === f
                        ? 'bg-indigo-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f === 'all' && `همه (${validatedItems.length})`}
                    {f === 'valid' && `بدون خطا (${validCount})`}
                    {f === 'duplicate' && `تکراری (${duplicateCount})`}
                    {f === 'warning' && `هشدار (${warningCount})`}
                    {f === 'error' && `خطادار (${errorCount})`}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto max-h-[480px]">
              <table className="w-full text-right text-xs">
                <thead className="sticky top-0 bg-slate-900 z-10 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="pb-3 pr-3 font-semibold">ردیف</th>
                    <th className="pb-3 font-semibold">وضعیت</th>
                    <th className="pb-3 font-semibold">نام و مشخصات</th>
                    <th className="pb-3 font-semibold">شماره عضویت</th>
                    <th className="pb-3 font-semibold">کد ملی</th>
                    <th className="pb-3 font-semibold">موبایل</th>
                    <th className="pb-3 font-semibold">شهریه / بدهی</th>
                    <th className="pb-3 pl-3 font-semibold text-left">نحوه برخورد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredItems.map((item) => {
                    const isDup = item.isDuplicate && item.duplicateMatch;
                    const res = isDup ? (rowConflictResolutions[item.duplicateMatch!.id] || 'merge') : null;

                    return (
                      <tr 
                        key={item.rowIndex} 
                        className={`hover:bg-slate-800/30 transition-all ${
                          !item.isValid ? 'bg-red-500/5' : isDup ? 'bg-indigo-500/5' : item.warnings.length > 0 ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        <td className="py-3 pr-3 font-mono text-slate-500">
                          #{item.rowIndex}
                        </td>
                        <td className="py-3">
                          {item.status === 'valid' && (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              معتبر
                            </span>
                          )}
                          {item.status === 'duplicate' && (
                            <span className="inline-flex items-center gap-1 text-indigo-400 font-medium" title={`تطبیق با ${item.duplicateMatch?.fullName}`}>
                              <Sparkles className="w-3.5 h-3.5" />
                              تکراری ({item.matchReason})
                            </span>
                          )}
                          {item.status === 'warning' && (
                            <span className="inline-flex items-center gap-1 text-amber-400 font-medium" title={item.warnings.join(' • ')}>
                              <AlertTriangle className="w-3.5 h-3.5" />
                              هشدار
                            </span>
                          )}
                          {item.status === 'error' && (
                            <span className="inline-flex items-center gap-1 text-red-400 font-medium" title={item.errors.join(' • ')}>
                              <AlertCircle className="w-3.5 h-3.5" />
                              خطا
                            </span>
                          )}
                        </td>
                        <td className="py-3 font-bold text-white">
                          <div>{item.mappedMember.fullName || '—'}</div>
                          {item.warnings.length > 0 && (
                            <div className="text-[10px] text-amber-400 font-normal">{item.warnings[0]}</div>
                          )}
                          {item.errors.length > 0 && (
                            <div className="text-[10px] text-red-400 font-normal">{item.errors[0]}</div>
                          )}
                        </td>
                        <td className="py-3 text-slate-300 font-mono">
                          {item.mappedMember.memberNumber || '—'}
                        </td>
                        <td className="py-3 text-slate-300 font-mono">
                          {item.mappedMember.nationalId || '—'}
                        </td>
                        <td className="py-3 text-slate-300 font-mono">
                          {item.mappedMember.phone || '—'}
                        </td>
                        <td className="py-3 font-mono">
                          <span className="text-emerald-400 font-bold">{formatMoney(item.mappedMember.paidAmount || 0)}</span>
                          {item.mappedMember.remainingDebt ? (
                            <span className="text-red-400 text-[11px] mr-1 block">بدهی: {formatMoney(item.mappedMember.remainingDebt)}</span>
                          ) : null}
                        </td>
                        <td className="py-3 pl-3 text-left">
                          {isDup ? (
                            <select
                              value={res || 'merge'}
                              onChange={(e) => setRowConflictResolutions({
                                ...rowConflictResolutions,
                                [item.duplicateMatch!.id]: e.target.value as DuplicateResolution
                              })}
                              className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-[11px] text-white focus:outline-none"
                            >
                              <option value="merge">ادغام فیلدها</option>
                              <option value="use_imported">جایگزینی</option>
                              <option value="keep_existing">نادیده گرفتن</option>
                              <option value="skip">رد کردن</option>
                            </select>
                          ) : item.isValid ? (
                            <span className="text-[11px] text-emerald-400 font-medium">عضو جدید</span>
                          ) : (
                            <span className="text-[11px] text-red-400">رد می‌شود</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-800">
              <button
                onClick={() => setStep('mapping')}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                اصلاح نگاشت ستون‌ها
              </button>

              <button
                onClick={handleExecuteMigration}
                disabled={isLoading || validatedItems.length === 0}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-500 hover:from-emerald-400 hover:to-indigo-400 text-slate-950 font-extrabold text-xs shadow-xl shadow-emerald-500/20 transition-all"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>شروع نهایی انتقال و ثبت در پایگاه داده</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STEP 4: MIGRATION REPORT & SUMMARY                   */}
      {/* ---------------------------------------------------- */}
      {step === 'report' && latestReportId && (
        <div className="space-y-6">
          {(() => {
            const report = migrationReports.find(r => r.id === latestReportId) || migrationReports[0];
            if (!report) return null;

            return (
              <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white">مهاجرت داده‌ها با موفقیت کامل انجام شد!</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    نسخه پشتیبان خودکار (Snapshot #{report.migrationId}) ایجاد شد تا در صورت تمایل بتوانید با یک کلیک به عقب بازگردید.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
                  <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                    <span className="text-xs text-slate-400">اعضای جدید ثبت شده</span>
                    <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">+{report.importedCount}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                    <span className="text-xs text-slate-400">اعضای ادغام شده</span>
                    <p className="text-2xl font-bold text-cyan-400 mt-1 font-mono">{report.updatedCount}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                    <span className="text-xs text-slate-400">ردیف‌های صرف‌نظر شده</span>
                    <p className="text-2xl font-bold text-slate-300 mt-1 font-mono">{report.skippedCount}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                    <span className="text-xs text-slate-400">خطاهای رد شده</span>
                    <p className="text-2xl font-bold text-red-400 mt-1 font-mono">{report.errorCount}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
                  {report.rollbackAvailable && (
                    <button
                      onClick={() => handleRollback(report.migrationId)}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>بازگردانی این انتقال (Rollback)</span>
                    </button>
                  )}

                  <button
                    onClick={resetWorkflow}
                    className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all"
                  >
                    <span>انتقال فایل جدید یا اتمام</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
