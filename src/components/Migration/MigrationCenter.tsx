import React, { useState } from 'react';
import { 
  Database, 
  History, 
  Bookmark, 
  ArrowRight, 
  ShieldCheck, 
  FileSpreadsheet, 
  Sparkles,
  Layers,
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { 
  MigrationSourceType, 
  MigrationStep, 
  ParseResult, 
  ImportValidationItem, 
  DuplicateResolution,
  MigrationReport,
  MigrationProgressState,
  CurrencyUnit,
  ImportMode,
  HistoricalMigrationScope
} from '../../services/migration/migrationTypes';
import { MigrationEngine } from '../../services/migration/migrationEngine';
import { SourceSelector } from './components/SourceSelector';
import { FileUploader } from './components/FileUploader';
import { FileAnalyzer } from './components/FileAnalyzer';
import { FieldMappingEditor } from './components/FieldMappingEditor';
import { DuplicateReviewModal } from './components/DuplicateReviewModal';
import { MigrationPreview } from './components/MigrationPreview';
import { MigrationProgressModal } from './components/MigrationProgressModal';
import { MigrationReportModal } from './components/MigrationReportModal';
import { MigrationHistory } from './components/MigrationHistory';
import { MappingProfileManager } from './components/MappingProfileManager';

export const MigrationCenter: React.FC = () => {
  const { 
    students, 
    coaches, 
    organizationInfo, 
    activeBranchId, 
    mappingProfiles, 
    saveMappingProfile, 
    deleteMappingProfile, 
    migrationReports, 
    rollbackMigration,
    executeMigration 
  } = useAppContext();

  // Primary top-level navigation
  const [activeMainTab, setActiveMainTab] = useState<'wizard' | 'history' | 'profiles'>('wizard');

  // Wizard state
  const [currentStep, setCurrentStep] = useState<MigrationStep>('source');
  const [sourceType, setSourceType] = useState<MigrationSourceType>('xlsx');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Mapping state
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [fullNameMode, setFullNameMode] = useState<'split' | 'preserve'>('split');
  const [currencyUnit, setCurrencyUnit] = useState<CurrencyUnit>('toman');
  const [preserveMemberNumbers, setPreserveMemberNumbers] = useState<boolean>(true);
  
  // Execution modes
  const [importMode, setImportMode] = useState<ImportMode>('create_and_update');
  const [scope, setScope] = useState<HistoricalMigrationScope>('members_only');

  // Validation & Duplicate state
  const [validatedItems, setValidatedItems] = useState<ImportValidationItem[]>([]);
  const [conflictResolutions, setConflictResolutions] = useState<Record<string, DuplicateResolution>>({});

  // Real progress state
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [progressState, setProgressState] = useState<MigrationProgressState>({
    currentStepTitle: '',
    currentStepIndex: 1,
    totalSteps: 5,
    overallPercentage: 0,
    recordsProcessed: 0,
    recordsTotal: 0,
    currentErrors: 0,
    elapsedSeconds: 0,
    isCancelled: false,
  });

  // Completed Report state
  const [latestReport, setLatestReport] = useState<MigrationReport | null>(null);

  // ----------------------------------------------------
  // Step Navigation Handlers
  // ----------------------------------------------------
  const handleDataParsed = (result: ParseResult, file?: File) => {
    setParseResult(result);
    if (file) setSelectedFile(file);
    setCurrentStep('analyze');
  };

  const handleProceedToMapping = () => {
    if (!parseResult) return;
    // Pre-suggest mappings
    const suggested = MigrationEngine.validateRows(
      parseResult.rows.slice(0, 10),
      {},
      students,
      { fullNameMode, currencyUnit }
    );
    setCurrentStep('map');
  };

  const handleProceedToValidation = () => {
    if (!parseResult) return;
    // Validate all rows
    const validated = MigrationEngine.validateRows(
      parseResult.rows,
      mappings,
      students,
      { fullNameMode, currencyUnit }
    );
    setValidatedItems(validated);

    const dupCount = validated.filter(i => i.isDuplicate).length;
    if (dupCount > 0) {
      setCurrentStep('duplicates');
    } else {
      setCurrentStep('preview');
    }
  };

  const handleSaveCustomProfile = (profileName: string) => {
    saveMappingProfile({
      id: `profile-${Date.now()}`,
      name: profileName,
      sourceType,
      mappings,
      fullNameMode,
      currencyUnit,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleApplyBatchDuplicateResolution = (
    resolution: DuplicateResolution,
    confidenceFilter?: 'HIGH' | 'ALL'
  ) => {
    const updated = { ...conflictResolutions };
    validatedItems.forEach(item => {
      if (item.isDuplicate && item.duplicateMatch) {
        if (!confidenceFilter || confidenceFilter === 'ALL' || item.confidence === confidenceFilter) {
          updated[item.duplicateMatch.id] = resolution;
        }
      }
    });
    setConflictResolutions(updated);
  };

  // ----------------------------------------------------
  // Execution Handler with Real Chunking
  // ----------------------------------------------------
  const handleStartImportExecution = async () => {
    if (isImporting) return;
    setIsImporting(true);

    try {
      const report = await executeMigration(
        validatedItems,
        conflictResolutions,
        {
          sourceType,
          fileName: selectedFile?.name || parseResult?.fileName,
          importMode,
          scope,
          currencyUnit,
          preserveMemberNumbers,
        },
        (progress) => {
          setProgressState(progress);
        }
      );

      setLatestReport(report);
      setCurrentStep('report');
    } catch (err) {
      console.error('Migration execution error:', err);
      alert(`انتقال اطلاعات ناموفق بود: ${(err as Error).message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleResetToStart = () => {
    setCurrentStep('source');
    setParseResult(null);
    setSelectedFile(null);
    setMappings({});
    setValidatedItems([]);
    setConflictResolutions({});
    setLatestReport(null);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto" id="gym-migration-center-page">
      {/* Top Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-950/40">
              <Database className="w-7 h-7" />
            </span>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                مرکز انتقال اطلاعات (Migration Center)
              </h1>
              <p className="text-xs text-emerald-400 font-bold">
                انتقال اطلاعات از سیستم قبلی
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400 pt-1 leading-relaxed max-w-2xl">
            میتوانید اطلاعات اعضا و سوابق باشگاه را از فایل یا سیستم قبلی وارد کنید. فرآیند به صورت کاملاً ایزوله با پشتیبان‌گیری خودکار و بدون تداخل با پذیرش سریع انجام می‌گیرد.
          </p>
        </div>

        {/* Top-level Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 self-start md:self-center shadow-lg">
          <button
            type="button"
            onClick={() => setActiveMainTab('wizard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'wizard'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>شروع انتقال داده</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'history'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>تاریخچه و Rollback</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('profiles')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'profiles'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>الگوهای نگاشت</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeMainTab === 'history' ? (
        <MigrationHistory
          reports={migrationReports}
          onRollback={rollbackMigration}
          onStartNewMigration={() => {
            setActiveMainTab('wizard');
            handleResetToStart();
          }}
          onViewReport={(rep) => {
            setLatestReport(rep);
            setCurrentStep('report');
            setActiveMainTab('wizard');
          }}
        />
      ) : activeMainTab === 'profiles' ? (
        <MappingProfileManager
          userProfiles={mappingProfiles}
          onSaveProfile={saveMappingProfile}
          onDeleteProfile={deleteMappingProfile}
        />
      ) : (
        /* Wizard Flow */
        <div className="space-y-6">
          {/* Step Breadcrumb indicator (only shown if not on report screen) */}
          {currentStep !== 'report' && (
            <div className="flex items-center justify-between overflow-x-auto pb-2 border-b border-slate-800/80 text-xs">
              {[
                { id: 'source', label: '۱. منبع داده' },
                { id: 'upload', label: '۲. بارگذاری منبع' },
                { id: 'analyze', label: '۳. تحلیل ساختار' },
                { id: 'map', label: '۴. نگاشت فیلدها' },
                { id: 'duplicates', label: '۵. بررسی تکراری‌ها' },
                { id: 'preview', label: '۶. پیش‌نمایش و تأیید' },
              ].map((st, idx) => {
                const isCurrent = currentStep === st.id;
                return (
                  <div key={st.id} className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        isCurrent
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}
                    >
                      {st.label}
                    </span>
                    {idx < 5 && <span className="text-slate-700">←</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Active Wizard Step Component */}
          {currentStep === 'source' && (
            <SourceSelector
              selectedSource={sourceType}
              onSelectSource={setSourceType}
              onNext={() => setCurrentStep('upload')}
            />
          )}

          {currentStep === 'upload' && (
            <FileUploader
              sourceType={sourceType}
              onDataParsed={handleDataParsed}
              onBack={() => setCurrentStep('source')}
            />
          )}

          {currentStep === 'analyze' && parseResult && (
            <FileAnalyzer
              parseResult={parseResult}
              onNext={handleProceedToMapping}
              onBack={() => setCurrentStep('upload')}
            />
          )}

          {currentStep === 'map' && parseResult && (
            <FieldMappingEditor
              parseResult={parseResult}
              mappings={mappings}
              fullNameMode={fullNameMode}
              currencyUnit={currencyUnit}
              preserveMemberNumbers={preserveMemberNumbers}
              onUpdateMappings={setMappings}
              onUpdateFullNameMode={setFullNameMode}
              onUpdateCurrencyUnit={setCurrencyUnit}
              onUpdatePreserveMemberNumbers={setPreserveMemberNumbers}
              onSaveProfile={handleSaveCustomProfile}
              onNext={handleProceedToValidation}
              onBack={() => setCurrentStep('analyze')}
            />
          )}

          {currentStep === 'duplicates' && (
            <DuplicateReviewModal
              duplicateItems={validatedItems.filter(i => i.isDuplicate)}
              conflictResolutions={conflictResolutions}
              onUpdateResolution={(matchId, res) => {
                setConflictResolutions(prev => ({ ...prev, [matchId]: res }));
              }}
              onApplyBatchResolution={handleApplyBatchDuplicateResolution}
              onNext={() => setCurrentStep('preview')}
              onBack={() => setCurrentStep('map')}
            />
          )}

          {currentStep === 'preview' && (
            <MigrationPreview
              validatedItems={validatedItems}
              importMode={importMode}
              scope={scope}
              isImporting={isImporting}
              onUpdateImportMode={setImportMode}
              onUpdateScope={setScope}
              onExecute={handleStartImportExecution}
              onBack={() => {
                const hasDups = validatedItems.some(i => i.isDuplicate);
                setCurrentStep(hasDups ? 'duplicates' : 'map');
              }}
            />
          )}

          {currentStep === 'report' && latestReport && (
            <MigrationReportModal
              report={latestReport}
              onClose={handleResetToStart}
              onRollback={(migrationId) => {
                rollbackMigration(migrationId);
                handleResetToStart();
              }}
            />
          )}

          {/* Real-time Progress Modal during execution */}
          {isImporting && <MigrationProgressModal progress={progressState} />}
        </div>
      )}
    </div>
  );
};
