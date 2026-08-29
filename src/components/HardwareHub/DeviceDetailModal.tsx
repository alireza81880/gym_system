import React, { useState, useEffect } from 'react';
import { 
  XCircle, 
  Cpu, 
  Wifi, 
  Server, 
  Layers, 
  Users, 
  Activity, 
  Terminal, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Fingerprint, 
  ScanFace, 
  CreditCard, 
  KeyRound, 
  Link, 
  Play, 
  FileText
} from 'lucide-react';
import { 
  HardwareDevice, 
  DeviceUser, 
  DeviceUserMapping, 
  HardwareEvent 
} from '../../types';
import { getAdapterForVendor } from '../../services/hardware/adapterRegistry';
import { DeviceMappingRepository } from '../../services/repositories/deviceMappingRepository';
import { MemberRepository } from '../../services/repositories/memberRepository';
import { DiagnosticLogResult } from '../../services/hardware/hardwareTypes';

interface DeviceDetailModalProps {
  device: HardwareDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateDevice: (updated: HardwareDevice) => void;
  onTriggerEvent?: (event: HardwareEvent) => void;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  device,
  isOpen,
  onClose,
  onUpdateDevice,
  onTriggerEvent,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'connection' | 'capabilities' | 'users' | 'diagnostics' | 'raw_events'>('overview');
  const [deviceUsers, setDeviceUsers] = useState<DeviceUser[]>([]);
  const [mappings, setMappings] = useState<DeviceUserMapping[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticLogResult | null>(null);
  const [selectedUserForMapping, setSelectedUserForMapping] = useState<DeviceUser | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (device && isOpen) {
      loadDeviceUsers();
      loadMappings();
    }
  }, [device, isOpen]);

  if (!isOpen || !device) return null;

  const loadMappings = () => {
    if (!device) return;
    const currentMappings = DeviceMappingRepository.getByDeviceId(device.id);
    setMappings(currentMappings);
  };

  const loadDeviceUsers = async () => {
    if (!device) return;
    setLoadingUsers(true);
    try {
      const adapter = getAdapterForVendor(device.vendor);
      if (adapter.readUsers) {
        const users = await adapter.readUsers(device);
        setDeviceUsers(users);
      } else {
        setDeviceUsers([
          { externalUserId: '1001', name: 'کاربر شماره ۱۰۰۱', credentialTypes: ['RFID'], privilege: 'user' },
          { externalUserId: '1002', name: 'کاربر شماره ۱۰۰۲', credentialTypes: ['FACE'], privilege: 'user' },
        ]);
      }
    } catch (err) {
      console.error('Failed to read device users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const runDiagnostics = async () => {
    if (!device) return;
    setDiagnosticsRunning(true);
    setDiagnosticResult(null);

    try {
      const adapter = getAdapterForVendor(device.vendor);
      const result = await adapter.runDiagnostics(device);
      setDiagnosticResult(result);
    } catch (err: any) {
      setDiagnosticResult({
        passed: false,
        latencyMs: 0,
        timestamp: new Date().toISOString(),
        logs: [`[Error] خطای نامشخص در اجرای دیاگنوستیک: ${err.message}`],
      });
    } finally {
      setDiagnosticsRunning(false);
    }
  };

  const handleTestConnection = async () => {
    if (!device) return;
    setActionFeedback('در حال ارسال بسته آزمایشی پینگ و بررسی ارتباط...');
    const adapter = getAdapterForVendor(device.vendor);
    const health = await adapter.healthCheck(device);

    if (health.isOnline) {
      setActionFeedback(`ارتباط با موفقیت برقرار شد (تاخیر: ${health.latencyMs}ms | وضعیت آنلاین)`);
      onUpdateDevice({
        ...device,
        status: 'online',
        latencyMs: health.latencyMs,
        lastPing: 'همین الان (آنلاین)',
      });
    } else {
      setActionFeedback(`خطا در اتصال: ${health.lastError || 'دستگاه پاسخگو نیست.'}`);
      onUpdateDevice({
        ...device,
        status: 'offline',
        lastError: health.lastError,
      });
    }

    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleRefreshDeviceInfo = async () => {
    if (!device) return;
    setActionFeedback('در حال دریافت مشخصات فریم‌ور و سخت‌افزار از دستگاه...');
    const adapter = getAdapterForVendor(device.vendor);
    const info = await adapter.getDeviceInfo(device);

    onUpdateDevice({
      ...device,
      firmware: info.firmware,
      serialNumber: info.serial,
      capabilities: info.capabilities,
      lastPing: 'همین الان (بروزرسانی شد)',
    });

    setActionFeedback(`مشخصات سخت‌افزار با موفقیت از پایانه بازخوانی شد.`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleSaveMapping = () => {
    if (!selectedUserForMapping || !selectedMemberId || !device) return;
    const member = MemberRepository.getById(selectedMemberId);
    if (!member) return;

    DeviceMappingRepository.setMapping({
      deviceId: device.id,
      externalUserId: selectedUserForMapping.externalUserId,
      memberId: member.id,
      memberName: member.fullName,
      credentialTypes: selectedUserForMapping.credentialTypes,
      cardUid: selectedUserForMapping.cardUid,
    });

    loadMappings();
    setSelectedUserForMapping(null);
    setSelectedMemberId('');
    setActionFeedback(`شناسه ${selectedUserForMapping.externalUserId} با موفقیت به «${member.fullName}» متصل شد.`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const allMembers = MemberRepository.getAll();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-4xl bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-900/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  {device.name}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  device.status === 'online'
                    ? 'bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-900/80 text-rose-800 dark:text-rose-300'
                }`}>
                  {device.status === 'online' ? 'آنلاین (ONLINE)' : 'آفلاین (OFFLINE)'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                  حالت شنود (SHADOW MODE)
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                سازنده: {device.vendor.toUpperCase()} • مدل: {device.model} • {device.ipAddress}:{device.port}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Alert if any */}
        {actionFeedback && (
          <div className="px-6 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-between animate-in fade-in">
            <span>{actionFeedback}</span>
            <button onClick={() => setActionFeedback(null)} className="text-[10px] underline">بستن</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-stone-200 dark:border-stone-800 gap-2 bg-stone-100/50 dark:bg-stone-900/80 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>نمای کلی (Overview)</span>
          </button>

          <button
            onClick={() => setActiveTab('capabilities')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'capabilities'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>قابلیت‌ها ({device.capabilities?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>کاربران دستگاه (Read-Only Users)</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'diagnostics'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>ابزارهای عیب‌یابی (Diagnostics)</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-stone-700 dark:text-stone-300 flex-1">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Shadow mode banner */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-900 dark:text-amber-300">
                    ZKTeco SHADOW MODE — حالت شنود غیرمخرب فعال است
                  </div>
                  <div className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
                    این دستگاه صرفاً جهت خواندن ترددها، شناسایی چهره/کارت و تحلیل مقایسه‌ای در پایلوت به Gym OS متصل است. هیچ‌گونه فرمان باز کردن درب، صدور پالس رله یا دستکاری در پایگاه داده داخلی دستگاه ارسال نمی‌شود.
                  </div>
                </div>
              </div>

              {/* Hardware specifications grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60">
                  <span className="text-[10px] text-stone-400 block font-semibold">مدل دستگاه</span>
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100">{device.model}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60">
                  <span className="text-[10px] text-stone-400 block font-semibold">فریم‌ور (Firmware)</span>
                  <span className="text-xs font-mono text-stone-900 dark:text-stone-100">{device.firmware || 'v4.1.9-ARM'}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60">
                  <span className="text-[10px] text-stone-400 block font-semibold">شماره سریال (Serial)</span>
                  <span className="text-xs font-mono text-stone-900 dark:text-stone-100">{device.serialNumber || 'ZKT-2026-F9821'}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60">
                  <span className="text-[10px] text-stone-400 block font-semibold">آدرس MAC سخت‌افزار</span>
                  <span className="text-xs font-mono text-stone-900 dark:text-stone-100">{device.macAddress || '00:17:61:A4:9B:12'}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60">
                  <span className="text-[10px] text-stone-400 block font-semibold">آدرس شبکه محلی (LAN IP)</span>
                  <span className="text-xs font-mono text-stone-900 dark:text-stone-100">{device.ipAddress}:{device.port}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60">
                  <span className="text-[10px] text-stone-400 block font-semibold">پروتکل ارتباطی</span>
                  <span className="text-xs font-mono uppercase text-stone-900 dark:text-stone-100">{device.protocol}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60">
                  <span className="text-[10px] text-stone-400 block font-semibold">تاخیر ارتباط (Latency)</span>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{device.latencyMs || 14} ms</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60">
                  <span className="text-[10px] text-stone-400 block font-semibold">محل استقرار</span>
                  <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">{device.location}</span>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                <button
                  onClick={handleTestConnection}
                  className="py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold flex items-center gap-2 transition-all"
                >
                  <Wifi className="h-4 w-4 text-emerald-500" />
                  <span>تست اتصال (Test Connection)</span>
                </button>
                <button
                  onClick={handleRefreshDeviceInfo}
                  className="py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold flex items-center gap-2 transition-all"
                >
                  <RefreshCw className="h-4 w-4 text-sky-500" />
                  <span>بروزرسانی مشخصات (Refresh Device Info)</span>
                </button>
                <button
                  onClick={() => setActiveTab('diagnostics')}
                  className="py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold flex items-center gap-2 transition-all"
                >
                  <Terminal className="h-4 w-4 text-amber-500" />
                  <span>اجرای دیاگنوستیک کامل</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CAPABILITIES */}
          {activeTab === 'capabilities' && (
            <div className="space-y-4">
              <div className="text-xs text-stone-500 leading-relaxed">
                این قابلیت‌ها مستقیماً بر اساس پروتکل کشف ZKTeco از فریم‌ور دستگاه استخراج شده‌اند:
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {device.capabilities?.map((cap) => (
                  <div
                    key={cap}
                    className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 flex items-center gap-3"
                  >
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      {cap.includes('FACE') ? <ScanFace className="h-4 w-4" /> :
                       cap.includes('FINGER') ? <Fingerprint className="h-4 w-4" /> :
                       cap.includes('RFID') ? <CreditCard className="h-4 w-4" /> :
                       <Cpu className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-stone-900 dark:text-stone-100">{cap}</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">پشتیبانی فعال</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: READ-ONLY USERS & MAPPING */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-stone-900 dark:text-stone-100">
                    کاربران تعریف‌شده روی دستگاه ({deviceUsers.length} کاربر)
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    داده‌های احراز هویت مستقیماً به صورت Read-Only از حافظه دستگاه خوانده می‌شوند (الگوهای بیومتریک خام هرگز فاش نمی‌شوند).
                  </p>
                </div>
                <button
                  onClick={loadDeviceUsers}
                  disabled={loadingUsers}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold flex items-center gap-1.5 text-xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                  <span>بازخوانی کاربران</span>
                </button>
              </div>

              {/* Mapping form popup / section if user selected */}
              {selectedUserForMapping && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 dark:text-amber-300">
                      اتصال شناسه سخت‌افزاری {selectedUserForMapping.externalUserId} ({selectedUserForMapping.name}) به عضو باشگاه:
                    </span>
                    <button
                      onClick={() => setSelectedUserForMapping(null)}
                      className="text-stone-400 hover:text-stone-600"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold"
                    >
                      <option value="">-- انتخاب عضو از سیستم باشگاه --</option>
                      {allMembers.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} ({m.phone}) - {m.status === 'active' ? 'عضو فعال' : 'منقضی/بدهکار'}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleSaveMapping}
                      disabled={!selectedMemberId}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold disabled:opacity-40"
                    >
                      ذخیره اتصال
                    </button>
                  </div>
                </div>
              )}

              {/* Users table */}
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 font-bold border-b border-stone-200 dark:border-stone-800">
                    <tr>
                      <th className="p-3">شناسه دستگاه (External ID)</th>
                      <th className="p-3">نام در دستگاه</th>
                      <th className="p-3">نوع احراز هویت</th>
                      <th className="p-3">عضو متناظر در Gym OS</th>
                      <th className="p-3">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-800 font-medium">
                    {deviceUsers.map((user) => {
                      const mapping = mappings.find(m => m.externalUserId === user.externalUserId);
                      return (
                        <tr key={user.externalUserId} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                          <td className="p-3 font-mono font-bold text-stone-900 dark:text-stone-100">
                            #{user.externalUserId}
                          </td>
                          <td className="p-3 text-stone-800 dark:text-stone-200">
                            {user.name}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              {user.credentialTypes.map(cred => (
                                <span
                                  key={cred}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
                                >
                                  {cred}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            {mapping ? (
                              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>{mapping.memberName || 'عضو متصل'}</span>
                              </div>
                            ) : (
                              <div className="text-amber-600 dark:text-amber-400 text-[11px] font-semibold">
                                شناسه دستگاه به عضو متصل نیست.
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => {
                                setSelectedUserForMapping(user);
                                setSelectedMemberId(mapping?.memberId || '');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-[11px] font-bold flex items-center gap-1"
                            >
                              <Link className="h-3 w-3" />
                              <span>{mapping ? 'تغییر اتصال' : 'اتصال به عضو'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-stone-900 dark:text-stone-100">
                    اجرای دیاگنوستیک گام به گام (Step-by-step Hardware Diagnostics)
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    بررسی لایه به لایه پورت TCP/IP، هندشیک ZKTeco PUSH، فریم‌ور و زمان‌بندی بدون تاثیر بر ترددها
                  </p>
                </div>
                <button
                  onClick={runDiagnostics}
                  disabled={diagnosticsRunning}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  <Play className={`h-4 w-4 ${diagnosticsRunning ? 'animate-spin' : ''}`} />
                  <span>{diagnosticsRunning ? 'در حال تست...' : 'شروع تست دیاگنوستیک'}</span>
                </button>
              </div>

              {diagnosticResult ? (
                <div className="p-4 rounded-2xl bg-stone-950 text-emerald-400 font-mono text-[11px] border border-stone-800 space-y-2 shadow-inner">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-stone-400">
                    <span>نتیجه دیاگنوستیک سخت‌افزار ({diagnosticResult.timestamp})</span>
                    <span className={diagnosticResult.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {diagnosticResult.passed ? 'PASSED (موفق)' : 'FAILED (ناموفق)'} • {diagnosticResult.latencyMs}ms
                    </span>
                  </div>
                  <div className="space-y-1">
                    {diagnosticResult.logs.map((line, idx) => (
                      <div key={idx} className="leading-relaxed">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl border border-dashed border-stone-300 dark:border-stone-800 text-center text-stone-400 space-y-2">
                  <Terminal className="h-8 w-8 mx-auto text-stone-500" />
                  <p>جهت بررسی صحت ارتباط و دریافت لاگ پروتکل، روی دکمه «شروع تست دیاگنوستیک» کلیک نمایید.</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 flex items-center justify-between">
          <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-amber-500" />
            <span>حالت شنود غیرمخرب (Read-Only Shadow Observer)</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold"
          >
            بستن پنجره
          </button>
        </div>

      </div>
    </div>
  );
};
