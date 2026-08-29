import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  ShieldCheck, 
  Filter, 
  RefreshCw, 
  Layers, 
  Eye, 
  Check, 
  ArrowLeftRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { PilotAccessComparison } from '../../types';
import { PilotComparisonService } from '../../services/hardware/pilotComparisonService';

export const PilotComparisonView: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'MATCH' | 'MISMATCH' | 'UNKNOWN' | 'ERROR'>('ALL');
  const [comparisons, setComparisons] = useState<PilotAccessComparison[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = () => {
    setComparisons(PilotComparisonService.getComparisons(filter));
  };

  useEffect(() => {
    loadData();
    const unsub = PilotComparisonService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, [filter]);

  const allItems = PilotComparisonService.getComparisons('ALL');
  const matchCount = allItems.filter(c => c.comparison === 'MATCH').length;
  const mismatchCount = allItems.filter(c => c.comparison === 'MISMATCH').length;
  const unknownCount = allItems.filter(c => c.comparison === 'UNKNOWN').length;
  const matchRate = allItems.length > 0 ? Math.round((matchCount / allItems.length) * 100) : 100;

  return (
    <div className="space-y-6">
      
      {/* Header & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold mb-1">
            <span>کل رویدادهای مقایسه پایلوت</span>
            <ArrowLeftRight className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-stone-100 font-mono">
            {allItems.length}
          </div>
          <span className="text-[10px] text-stone-400">ثبت‌شده در حافظه امن شنود</span>
        </div>

        <div className="p-4 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-1">
            <span>تطابق کامل (MATCH)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
            {matchCount}
          </div>
          <span className="text-[10px] text-emerald-600/80 font-bold">نرخ انطباق: {matchRate}٪</span>
        </div>

        <div className="p-4 rounded-3xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 text-xs font-semibold mb-1">
            <span>مغایرت تصمیمات (MISMATCH)</span>
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">
            {mismatchCount}
          </div>
          <span className="text-[10px] text-amber-600/80 font-bold">تفاوت نرم‌افزار با گیت فیزیکی</span>
        </div>

        <div className="p-4 rounded-3xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold mb-1">
            <span>شناسه‌های نامشخص (UNKNOWN)</span>
            <HelpCircle className="h-4 w-4 text-stone-400" />
          </div>
          <div className="text-2xl font-black text-stone-700 dark:text-stone-300 font-mono">
            {unknownCount}
          </div>
          <span className="text-[10px] text-stone-400">شناسه دستگاه به عضو متصل نیست</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-stone-900 p-3 rounded-2xl border border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs font-bold text-stone-400 px-2 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" />
            <span>فیلتر:</span>
          </span>
          {(['ALL', 'MATCH', 'MISMATCH', 'UNKNOWN', 'ERROR'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === tab
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {tab === 'ALL' && 'همه رویدادها'}
              {tab === 'MATCH' && `تطابق کامل (${matchCount})`}
              {tab === 'MISMATCH' && `مغایرت‌ها (${mismatchCount})`}
              {tab === 'UNKNOWN' && `ثبت‌نشده (${unknownCount})`}
              {tab === 'ERROR' && 'خطاها'}
            </button>
          ))}
        </div>

        <button
          onClick={loadData}
          className="p-2 rounded-xl text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          title="بازخوانی داده‌ها"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Comparisons Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/80 text-stone-500 font-bold border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="p-3.5">زمان</th>
                <th className="p-3.5">دستگاه / روش</th>
                <th className="p-3.5">کاربر / عضو</th>
                <th className="p-3.5">تصمیم سیستم خارجی (External)</th>
                <th className="p-3.5">تصمیم موتور Gym OS (Shadow)</th>
                <th className="p-3.5">وضعیت تطابق</th>
                <th className="p-3.5">تحلیل علت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800 font-medium">
              {comparisons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400">
                    رویدادی با فیلتر انتخابی یافت نشد.
                  </td>
                </tr>
              ) : (
                comparisons.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr 
                      onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                      className={`hover:bg-stone-50 dark:hover:bg-stone-800/40 cursor-pointer transition-colors ${
                        row.comparison === 'MISMATCH' ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="p-3.5 font-mono text-stone-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-stone-400" />
                          <span>{row.timestamp}</span>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-bold text-stone-800 dark:text-stone-200">{row.deviceName}</div>
                        <div className="text-[10px] text-stone-400 font-mono">روش: {row.method}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-stone-900 dark:text-stone-100">{row.memberName}</div>
                        <div className="text-[10px] text-stone-400 font-mono">شناسه: #{row.externalUserId || '---'}</div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          row.externalResult === 'ALLOW' 
                            ? 'bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-900/80 text-rose-800 dark:text-rose-300'
                        }`}>
                          {row.externalResult === 'ALLOW' ? 'مجاز (ALLOW)' : 'مسدود (DENY)'}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          row.gymOsDecision === 'ALLOW' 
                            ? 'bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300'
                            : row.gymOsDecision === 'ALLOW_WITH_WARNING'
                            ? 'bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-300'
                            : row.gymOsDecision === 'DENY'
                            ? 'bg-rose-100 dark:bg-rose-900/80 text-rose-800 dark:text-rose-300'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                        }`}>
                          {row.gymOsDecision === 'ALLOW' ? 'مجاز (ALLOW)' :
                           row.gymOsDecision === 'ALLOW_WITH_WARNING' ? 'مجاز با اخطار' :
                           row.gymOsDecision === 'DENY' ? 'غیرمجاز (DENY)' : 'نامشخص (UNKNOWN)'}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {row.comparison === 'MATCH' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>تطابق (MATCH)</span>
                          </span>
                        )}
                        {row.comparison === 'MISMATCH' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
                            <AlertTriangle className="h-3 w-3" />
                            <span>مغایرت (MISMATCH)</span>
                          </span>
                        )}
                        {row.comparison === 'UNKNOWN' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                            <HelpCircle className="h-3 w-3" />
                            <span>ثبت‌نشده (UNKNOWN)</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-stone-600 dark:text-stone-300 text-[11px] max-w-xs truncate">
                        {row.reason || '---'}
                      </td>
                    </tr>

                    {/* Expandable details */}
                    {expandedId === row.id && (
                      <tr className="bg-stone-50/80 dark:bg-stone-900/80">
                        <td colSpan={7} className="p-4 border-t border-stone-200 dark:border-stone-800">
                          <div className="p-3.5 rounded-2xl bg-stone-950 text-stone-300 font-mono text-[11px] space-y-2">
                            <div className="flex items-center justify-between text-stone-400 pb-1.5 border-b border-stone-800">
                              <span>جزئیات رویداد و همبستگی: {row.correlationId}</span>
                              <span className="text-amber-400">SHADOW EVALUATION</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-stone-300">
                              <div><strong>زمان دریافت:</strong> {row.receivedAt}</div>
                              <div><strong>شناسه دستگاه:</strong> {row.deviceId}</div>
                              <div><strong>شناسه عضو:</strong> {row.memberId || 'ثبت‌نشده (Unmapped)'}</div>
                              <div><strong>علت دقیق موتور قوانین:</strong> {row.reason}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
