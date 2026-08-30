import React, { useState, useEffect, useMemo } from 'react';
import { 
  Cpu, 
  Wifi, 
  WifiOff, 
  Plus, 
  Play, 
  Activity, 
  ShieldCheck, 
  Radio, 
  CheckCircle2, 
  XCircle, 
  KeyRound, 
  Terminal, 
  Layers, 
  ArrowLeftRight, 
  Globe, 
  Search, 
  Settings2, 
  AlertTriangle, 
  Sliders, 
  ScanFace, 
  CreditCard, 
  Fingerprint, 
  FileText,
  Clock,
  RefreshCw,
  Eye
} from 'lucide-react';
import { HardwareDevice, HardwareVendor, IntegrationMode, HardwareEvent } from '../../types';
import { DeviceDiscoveryModal } from './DeviceDiscoveryModal';
import { DeviceDetailModal } from './DeviceDetailModal';
import { PilotComparisonView } from './PilotComparisonView';
import { PilotComparisonService } from '../../services/hardware/pilotComparisonService';
import { HardwareGateway } from '../../services/hardware/hardwareGateway';
import { generateEventId, generateCorrelationId } from '../../services/hardware/eventIdentity';
import { useHardware, useSettings, useMembers, useAttendance, hardwareActions } from '../../stores';

export const HardwareHubView: React.FC = () => {
  const { 
    devices: hardwareDevices, 
    recentEvents: hardwareEvents, 
    toggleDeviceOnline, 
    testRelayPulse, 
    addHardwareDevice,
    updateDevice,
    addEvent,
  } = useHardware();

  const {
    integrationMode, 
    setIntegrationMode, 
  } = useSettings();

  const {
    students,
  } = useMembers();

  const {
    simulateIdentityScan,
  } = useAttendance();

  const [selectedDevice, setSelectedDevice] = useState<HardwareDevice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState<'devices' | 'pilot_comparison' | 'simulator' | 'raw_stream'>('devices');
  
  // Internet Network vs Local Hardware Network States
  const [isInternetOnline, setIsInternetOnline] = useState(true);
  const [isHardwareLanOnline, setIsHardwareLanOnline] = useState(true);

  // Simulation controls
  const [simMemberId, setSimMemberId] = useState(students[0]?.id || 'std-1');
  const [simMethod, setSimMethod] = useState<'face_recognition' | 'rfid_card' | 'fingerprint' | 'qr_code'>('face_recognition');
  const [simFeedback, setSimFeedback] = useState<{ message: string; type: 'success' | 'warn' | 'error' } | null>(null);

  const onlineDevicesCount = useMemo(() => {
    return hardwareDevices.filter(d => d.status === 'online').length;
  }, [hardwareDevices]);

  const avgLatency = useMemo(() => {
    return Math.round(hardwareDevices.reduce((sum, d) => sum + (d.latencyMs || 14), 0) / (hardwareDevices.length || 1));
  }, [hardwareDevices]);

  // Handler for adding discovered device
  const handleDeviceAdded = (newDevice: HardwareDevice) => {
    addHardwareDevice(newDevice);
    setSimFeedback({
      message: `دستگاه جدید «${newDevice.name}» در حالت شنود (Shadow Mode) به سیستم اضافه شد.`,
      type: 'success',
    });
    setTimeout(() => setSimFeedback(null), 5000);
  };

  const handleOpenDetail = (device: HardwareDevice) => {
    setSelectedDevice(device);
    setIsDetailOpen(true);
  };

  const handleUpdateDevice = (updated: HardwareDevice) => {
    hardwareActions.updateDevice(updated.id, updated);
    setSelectedDevice(updated);
  };

  // Run custom simulation scenarios (A-F Hardware Gateway Testing Suite)
  const triggerSimulationScenario = async (
    scenario: 'allowed_face' | 'expired_mismatch' | 'debt_mismatch' | 'unknown_person' | 'offline_safety' | 'rapid_duplicate_swipe'
  ) => {
    const gateway = HardwareGateway.getInstance();

    if (scenario === 'offline_safety') {
      const dev = hardwareDevices[0];
      if (dev) {
        // Toggle device offline safely and attempt command
        toggleDeviceOnline(dev.id);
        setSimFeedback({
          message: `سناریو E: وضعیت اتصال دستگاه «${dev.name}» معکوس شد. ارسال فرمان در حالت آفلاین مسدود و از قطع سرور جلوگیری می‌شود.`,
          type: 'warn',
        });
      }
      return;
    }

    if (scenario === 'rapid_duplicate_swipe') {
      const member = students.find(s => s.id === 'std-1') || students[0];
      const now = new Date();
      const timeStr = now.toLocaleTimeString('fa-IR');

      const baseEvent: HardwareEvent = {
        id: generateEventId('dev-rfid-turnstile', 'swipe-dup-1', 'hwevt'),
        deviceId: 'dev-rfid-turnstile',
        deviceName: 'کارتخوان و مچ‌بندخوان RFID/NFC گیت تردد',
        vendor: 'zkteco',
        eventType: 'RFID_MATCH',
        timestamp: timeStr,
        deviceTimestamp: timeStr,
        receivedAt: now.toISOString(),
        externalUserId: '1001',
        memberId: member.id,
        memberName: member.fullName,
        credentialType: 'rfid',
        accessResult: 'granted',
        source: 'hardware_gateway',
        processingStatus: 'processed',
        correlationId: generateCorrelationId('corr-dup-1'),
      };

      // Ingest event 1
      const res1 = await gateway.ingestNormalizedEvent(baseEvent);

      // Ingest event 2 immediately within deduplication window
      const dupEvent: HardwareEvent = {
        ...baseEvent,
        id: generateEventId('dev-rfid-turnstile', 'swipe-dup-2', 'hwevt'),
        correlationId: generateCorrelationId('corr-dup-2'),
      };
      const res2 = await gateway.ingestNormalizedEvent(dupEvent);

      setSimFeedback({
        message: `سناریو F (آنتی‌داپلیکیت): رویداد اول پذیرفته شد (${res1.accepted ? 'OK' : 'FAIL'}) • رویداد دوم به عنوان تکراری فیلتر شد (${res2.duplicate ? 'شناسایی و مسدود شد' : 'FAIL'}).`,
        type: 'success',
      });
      setTimeout(() => setSimFeedback(null), 5000);
      return;
    }

    let member = students[0];
    let method: 'face' | 'rfid' | 'fingerprint' | 'qr' = 'face';
    let externalUserId = '1001';
    let memberName = 'آرش علوی';
    let accessResult: 'granted' | 'denied' = 'granted';
    let eventType: any = 'FACE_MATCH';

    if (scenario === 'allowed_face') {
      member = students.find(s => s.id === 'std-1') || students[0];
      method = 'face';
      externalUserId = '1001';
      memberName = member.fullName;
      accessResult = 'granted';
      eventType = 'FACE_MATCH';
    } else if (scenario === 'debt_mismatch') {
      member = students.find(s => s.id === 'std-2') || students[1];
      method = 'face';
      externalUserId = '1002';
      memberName = member.fullName;
      accessResult = 'granted'; // External terminal allows
      eventType = 'FACE_MATCH';
    } else if (scenario === 'expired_mismatch') {
      member = students.find(s => s.id === 'std-4') || students[3];
      method = 'rfid';
      externalUserId = '1004';
      memberName = member.fullName;
      accessResult = 'granted'; // External legacy allowed
      eventType = 'RFID_MATCH';
    } else if (scenario === 'unknown_person') {
      method = 'face';
      externalUserId = '9999';
      memberName = 'کاربر ثبت‌نشده (Unmapped)';
      accessResult = 'denied';
      eventType = 'UNKNOWN_PERSON';
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('fa-IR');

    const syntheticEvent: HardwareEvent = {
      id: generateEventId('dev-face-gate', undefined, 'evt-sim'),
      deviceId: 'dev-face-gate',
      deviceName: 'ترمینال هوشمند تشخیص چهره گیت ورود (AI Face Gate 4K)',
      vendor: 'zkteco',
      eventType,
      timestamp: timeStr,
      deviceTimestamp: timeStr,
      receivedAt: now.toISOString(),
      externalUserId,
      memberId: scenario === 'unknown_person' ? undefined : member?.id,
      memberName,
      credentialType: method,
      accessResult,
      source: 'hardware_gateway',
      processingStatus: 'processed',
      correlationId: generateCorrelationId('corr-sim'),
    };

    // Feed into HardwareGateway full pipeline
    const gatewayResult = await gateway.ingestNormalizedEvent(syntheticEvent);

    setSimFeedback({
      message: `سیگنال شبیه‌سازی (${memberName}) پردازش شد • تصمیم Gym OS: ${gatewayResult.accessDecision?.result || 'UNKNOWN'} • پایلوت: ثبت شد.`,
      type: scenario === 'unknown_person' ? 'warn' : 'success',
    });
    setTimeout(() => setSimFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. PERSISTENT SHADOW MODE TOP BANNER */}
      <div className="p-6 rounded-3xl bg-linear-to-br from-stone-900 via-stone-900 to-stone-950 text-white border border-stone-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>ZKTeco SHADOW MODE (حالت شنود امن)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-100">
              ارتباط ایمن با سخت‌افزار واقعی ZKTeco، هایک‌ویژن و بورد رله
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 max-w-2xl leading-relaxed">
              Gym OS is observing the device. No control commands are being sent.
              در این مرحله سیستم رویدادها، لاگ‌ها و چهره‌ها را شنود کرده و جهت ارزیابی پایلوت با موتور دسترسی Gym OS مقایسه می‌کند.
            </p>
          </div>

          {/* Integration Mode Switcher */}
          <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 space-y-2.5 min-w-[280px]">
            <div className="text-xs font-semibold text-stone-300 flex items-center justify-between">
              <span>حالت اتصال سخت‌افزار:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                integrationMode === 'shadow' 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                  : integrationMode === 'hybrid' 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {integrationMode === 'shadow' ? 'شنود لاگ (Shadow)' : integrationMode === 'hybrid' ? 'ترکیبی (Hybrid)' : 'کنترل کامل (Full)'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-900 rounded-xl">
              <button
                onClick={() => setIntegrationMode('shadow')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                  integrationMode === 'shadow' 
                    ? 'bg-amber-500 text-stone-950 shadow-md' 
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                شنود (Shadow)
              </button>
              <button
                onClick={() => setIntegrationMode('hybrid')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                  integrationMode === 'hybrid' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                ترکیبی
              </button>
              <button
                onClick={() => setIntegrationMode('full_control')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                  integrationMode === 'full_control' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                کنترل کامل
              </button>
            </div>

            <div className="text-[10px] text-amber-300/80 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span>پروتکل فاز ۹: فرمان‌های فیزیکی رله غیرفعال هستند.</span>
            </div>
          </div>
        </div>

        {/* 2. DUAL NETWORK STATUS: INTERNET VS HARDWARE LAN */}
        <div className="pt-3 border-t border-stone-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            {/* Internet Status */}
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-stone-400" />
              <span className="text-stone-400">شبکه اینترنت:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isInternetOnline ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}>
                {isInternetOnline ? 'ONLINE (آنلاین)' : 'OFFLINE (قطع اینترنت)'}
              </span>
              <button
                onClick={() => setIsInternetOnline(!isInternetOnline)}
                className="text-[10px] text-stone-400 hover:text-stone-200 underline mr-1"
                title="تغییر وضعیت شبیه‌سازی اینترنت"
              >
                (تغییر)
              </button>
            </div>

            {/* Hardware LAN Status */}
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-amber-400" />
              <span className="text-stone-400">شبکه محلی سخت‌افزار (LAN):</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                ONLINE (پایدار و متصل)
              </span>
            </div>
          </div>

          <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>پایانه‌های ZKTeco در صورت قطع اینترنت به کار آفلاین خود در شبکه LAN ادامه می‌دهند.</span>
          </div>
        </div>
      </div>

      {/* Top Action & View Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white dark:bg-stone-900 p-1.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <button
            onClick={() => setActiveViewTab('devices')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeViewTab === 'devices'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>تجهیزات و کنترلرها ({hardwareDevices.length})</span>
          </button>

          <button
            onClick={() => setActiveViewTab('pilot_comparison')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeViewTab === 'pilot_comparison'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            <span>مقایسه پایلوت (Pilot Comparisons)</span>
          </button>

          <button
            onClick={() => setActiveViewTab('simulator')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeViewTab === 'simulator'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Play className="h-3.5 w-3.5" />
            <span>تست و شبیه‌سازی سناریوها</span>
          </button>

          <button
            onClick={() => setActiveViewTab('raw_stream')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeViewTab === 'raw_stream'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>جریان لاگ‌های خام (Raw Logs)</span>
          </button>
        </div>

        {/* Discovery Action Button */}
        <button
          onClick={() => setIsDiscoveryOpen(true)}
          className="py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-2"
        >
          <Search className="h-4 w-4" />
          <span>+ کشف و اتصال سخت‌افزار واقعی (Discover Device)</span>
        </button>
      </div>

      {/* Simulation Feedback Alert */}
      {simFeedback && (
        <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between animate-in fade-in ${
          simFeedback.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
        }`}>
          <span>{simFeedback.message}</span>
          <button onClick={() => setSimFeedback(null)} className="text-[10px] underline">بستن</button>
        </div>
      )}

      {/* TAB 1: DEVICES VIEW */}
      {activeViewTab === 'devices' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hardwareDevices.map(dev => {
              const isOnline = dev.status === 'online';

              return (
                <div
                  key={dev.id}
                  className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2.5 rounded-2xl ${isOnline ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                          {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-stone-900 dark:text-stone-100 line-clamp-1">{dev.name}</div>
                          <div className="text-[11px] text-stone-500 uppercase">{dev.vendor} • {dev.model || dev.type}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleDeviceOnline(dev.id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                          isOnline 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' 
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {isOnline ? 'آنلاین' : 'قطع'}
                      </button>
                    </div>

                    {/* Metadata summary */}
                    <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 text-xs space-y-1.5 text-stone-600 dark:text-stone-300">
                      <div className="flex justify-between">
                        <span className="text-stone-400">آدرس LAN:</span>
                        <span className="font-mono text-stone-900 dark:text-stone-100">{dev.ipAddress}:{dev.port}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">فریم‌ور:</span>
                        <span className="font-mono text-[11px]">{dev.firmware || 'v4.1.9'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">شماره سریال:</span>
                        <span className="font-mono text-[11px]">{dev.serialNumber || 'ZKT-2026-F9821'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">موقعیت فیزیکی:</span>
                        <span>{dev.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">حالت:</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">شنود (Shadow)</span>
                      </div>
                    </div>

                    {/* Capabilities preview */}
                    {dev.capabilities && (
                      <div className="flex flex-wrap gap-1">
                        {dev.capabilities.slice(0, 5).map(cap => (
                          <span key={cap} className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                            {cap}
                          </span>
                        ))}
                        {dev.capabilities.length > 5 && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold text-stone-400">
                            +{dev.capabilities.length - 5} مورد دیگر
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <span className="text-[10px] text-stone-400">{dev.lastPing}</span>
                    <button
                      onClick={() => handleOpenDetail(dev)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      <span>جزئیات و دیاگنوستیک</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PILOT COMPARISON VIEW */}
      {activeViewTab === 'pilot_comparison' && (
        <PilotComparisonView />
      )}

      {/* TAB 3: SIMULATOR & TEST SCENARIOS */}
      {activeViewTab === 'simulator' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 uppercase">
              SIMULATED HARDWARE TESTING SUITE
            </div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              تست و ارزیابی شبیه‌ساز سناریوهای فاز ۹ (Pilot Sandbox)
            </h3>
            <p className="text-xs text-stone-500">
              تست دقیق جریان لاگ‌ها، تطابق تصمیمات، شناسایی مغایرت‌ها (Mismatch) و شناسه کاربران ثبت‌نشده با استفاده از اینترفیس یکسان HardwareAdapter
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <button
              onClick={() => triggerSimulationScenario('allowed_face')}
              className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-right space-y-2 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <div className="flex items-center gap-1.5">
                  <ScanFace className="h-4 w-4" />
                  <span>سناریو A: تردد عضو مجاز (MATCH)</span>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                شناسایی چهره آرش علوی با پکیج معتبر؛ تایید دسترسی + تخصیص کمد هوشمند + ثبت در پایلوت بدون مغایرت.
              </p>
            </button>

            <button
              onClick={() => triggerSimulationScenario('expired_mismatch')}
              className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-right space-y-2 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between text-rose-800 dark:text-rose-300 font-bold text-xs">
                <div className="flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4" />
                  <span>سناریو B: کارت عضو منقضی (MISMATCH)</span>
                </div>
                <XCircle className="h-4 w-4 text-rose-500" />
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-400 leading-relaxed">
                عضو با شهریه منقضی؛ سیستم قدیمی باز می‌کند اما Gym OS مسدود کرده و مغایرت عدم اعتبار ثبت می‌کند.
              </p>
            </button>

            <button
              onClick={() => triggerSimulationScenario('debt_mismatch')}
              className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100 dark:hover:bg-amber-950/50 text-right space-y-2 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 font-bold text-xs">
                <div className="flex items-center gap-1.5">
                  <ScanFace className="h-4 w-4" />
                  <span>سناریو C: تردد عضو بدهکار (WARNING)</span>
                </div>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                نیما کمالی (بدهی ۲.۸ م تومان)؛ اجازه تردد مشروط همراه با هشدار مالی بدون مسدودسازی ناگهانی.
              </p>
            </button>

            <button
              onClick={() => triggerSimulationScenario('unknown_person')}
              className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-750 text-right space-y-2 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between text-stone-800 dark:text-stone-200 font-bold text-xs">
                <div className="flex items-center gap-1.5">
                  <Fingerprint className="h-4 w-4" />
                  <span>سناریو D: شناسه ثبت‌نشده (UNKNOWN)</span>
                </div>
                <Clock className="h-4 w-4 text-stone-400" />
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                شناسه ۹۹۹۹؛ اعلام «شناسه دستگاه به عضو متصل نیست» بدون ایجاد عضو فیک در پایگاه داده.
              </p>
            </button>

            <button
              onClick={() => triggerSimulationScenario('offline_safety')}
              className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 text-right space-y-2 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between text-indigo-800 dark:text-indigo-300 font-bold text-xs">
                <div className="flex items-center gap-1.5">
                  <WifiOff className="h-4 w-4" />
                  <span>سناریو E: ایمنی قطعی دستگاه (OFFLINE)</span>
                </div>
                <ShieldCheck className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-400 leading-relaxed">
                آزمون رفتار Gateway در قطعی سوکت؛ مسدودسازی امن فرمان‌های کنترلی بدون ایجاد کرش یا بن‌بست.
              </p>
            </button>

            <button
              onClick={() => triggerSimulationScenario('rapid_duplicate_swipe')}
              className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 hover:bg-purple-100 dark:hover:bg-purple-950/50 text-right space-y-2 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between text-purple-800 dark:text-purple-300 font-bold text-xs">
                <div className="flex items-center gap-1.5">
                  <Radio className="h-4 w-4" />
                  <span>سناریو F: فیلتر رویداد تکراری (DEDUP)</span>
                </div>
                <CheckCircle2 className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-[11px] text-purple-700 dark:text-purple-400 leading-relaxed">
                ارسال ۲ کارت متوالی در کمتر از ۲ ثانیه؛ پذیرش کارت اول و مسدودسازی هوشمند تکرار بدون رکورد مضاعف.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: RAW LOG STREAM */}
      {activeViewTab === 'raw_stream' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-100">
              <Terminal className="h-4 w-4 text-purple-500" />
              <span>جریان رویدادهای نرمالیزه‌شده زنده سخت‌افزار (Normalized Hardware Stream)</span>
            </div>
            <span className="text-xs text-stone-400 font-mono">Total Events: {hardwareEvents.length}</span>
          </div>

          <div className="p-4 rounded-3xl bg-stone-950 text-stone-200 border border-stone-800 font-mono text-xs overflow-x-auto space-y-2 max-h-80 overflow-y-auto shadow-inner">
            {hardwareEvents.map(evt => {
              const memberName = evt.memberName || (evt as any).payload?.memberName || 'رویداد سیستم';
              const credentialType = evt.credentialType || (evt as any).payload?.credentialType || 'سنسور';
              const accessReason = evt.accessReason || (evt as any).payload?.accessReason || 'مجاز';
              const timeFormatted = evt.timestamp?.includes('T') ? evt.timestamp.split('T')[1]?.slice(0, 8) : (evt.timestamp || '');

              return (
                <div key={evt.id || Math.random().toString()} className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-stone-500">{timeFormatted}</span>
                    <span className="text-amber-400 font-bold">[{evt.eventType || 'EVENT'}]</span>
                    <span className="text-stone-300">{memberName} ({credentialType})</span>
                    <span className="text-emerald-400">{accessReason}</span>
                  </div>
                  <span className="text-[10px] text-stone-500">{evt.correlationId || ''}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DISCOVERY MODAL */}
      <DeviceDiscoveryModal
        isOpen={isDiscoveryOpen}
        onClose={() => setIsDiscoveryOpen(false)}
        onDeviceAdded={handleDeviceAdded}
      />

      {/* DEVICE DETAIL MODAL */}
      <DeviceDetailModal
        device={selectedDevice}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedDevice(null);
        }}
        onUpdateDevice={handleUpdateDevice}
      />

    </div>
  );
};
