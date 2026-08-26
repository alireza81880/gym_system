import React, { useState } from 'react';
import { 
  Cpu, 
  Wifi, 
  WifiOff, 
  Plus, 
  Play, 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  Radio, 
  CheckCircle2, 
  XCircle, 
  KeyRound, 
  QrCode, 
  Fingerprint, 
  ScanFace, 
  RefreshCw,
  Terminal,
  Settings2,
  Sliders,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HardwareDevice, HardwareVendor, IntegrationMode, HardwareEvent } from '../../types';
import { getAdapterForVendor, createNormalizedHardwareEvent } from '../../services/hardwareAdapters';

export const HardwareHubView: React.FC = () => {
  const { 
    hardwareDevices, 
    hardwareEvents, 
    toggleDeviceOnline, 
    testRelayPulse, 
    integrationMode, 
    setIntegrationMode, 
    students,
    simulateIdentityScan,
    lang 
  } = useApp();

  const [selectedDevice, setSelectedDevice] = useState<HardwareDevice | null>(null);
  const [testingDeviceId, setTestingDeviceId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; latency: number } | null>(null);
  const [isAddWizardOpen, setIsAddWizardOpen] = useState(false);
  const [simMemberId, setSimMemberId] = useState(students[0]?.id || '');
  const [simMethod, setSimMethod] = useState<'face_recognition' | 'rfid_card' | 'fingerprint' | 'qr_code'>('face_recognition');
  const [simFeedback, setSimFeedback] = useState<string | null>(null);

  // Wizard state for Add Device
  const [wizStep, setWizStep] = useState(1);
  const [newDevName, setNewDevName] = useState('');
  const [newDevVendor, setNewDevVendor] = useState<HardwareVendor>('zkteco');
  const [newDevType, setNewDevType] = useState<HardwareDevice['type']>('biometric_face');
  const [newDevIp, setNewDevIp] = useState('192.168.1.150');
  const [newDevPort, setNewDevPort] = useState(8080);
  const [newDevProtocol, setNewDevProtocol] = useState<HardwareDevice['protocol']>('websocket');
  const [newDevLocation, setNewDevLocation] = useState('گیت ورودی سالن شماره ۲');

  const onlineCount = hardwareDevices.filter(d => d.status === 'online').length;
  const avgLatency = Math.round(hardwareDevices.reduce((sum, d) => sum + (d.latencyMs || 15), 0) / (hardwareDevices.length || 1));

  const handleTestConnection = async (deviceId: string) => {
    setTestingDeviceId(deviceId);
    setTestResult(null);
    const res = await testRelayPulse(deviceId);
    setTestResult({ id: deviceId, success: res.success, latency: res.latency });
    setTestingDeviceId(null);
  };

  const handleRunSimulation = () => {
    const student = students.find(s => s.id === simMemberId);
    if (!student) return;
    const query = simMethod === 'rfid_card' ? (student.rfidCardUid || student.fullName) : student.fullName;
    const result = simulateIdentityScan(simMethod, query);
    setSimFeedback(result.message);
    setTimeout(() => setSimFeedback(null), 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner with Mode Control */}
      <div className="p-6 rounded-3xl bg-linear-to-br from-stone-900 via-stone-900 to-stone-950 text-white border border-stone-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Cpu className="h-3.5 w-3.5" />
            <span>هاب سخت‌افزار، گیت‌ها و کنترلرهای IoT</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-100">
            مدیریت یکپارچه ترمینال‌های ZKTeco، هایک‌ویژن، سوپرما و بوردهای رله
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 max-w-2xl leading-relaxed">
            معماری تطبیقی برای اتصال همزمان گیت‌های تردد، تشخیص چهره 4K، کارتخوان‌های RFID، اسکنرهای بارکد و رله‌های الکترونیکی بدون نیاز به تعویض سخت‌افزارهای موجود.
          </p>
        </div>

        {/* Integration Mode Selector Pill */}
        <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 space-y-3 min-w-[300px]">
          <div className="text-xs font-semibold text-stone-300 flex items-center justify-between">
            <span>حالت عملیاتی سخت‌افزار:</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${integrationMode === 'shadow' ? 'bg-amber-500/20 text-amber-400' : integrationMode === 'hybrid' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {integrationMode === 'shadow' ? 'شنود لاگ (Shadow)' : integrationMode === 'hybrid' ? 'ترکیبی (Hybrid)' : 'کنترل کامل (Full)'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-900 rounded-xl">
            <button
              onClick={() => setIntegrationMode('shadow')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${integrationMode === 'shadow' ? 'bg-amber-500 text-stone-950 shadow-sm' : 'text-stone-400 hover:text-stone-200'}`}
              title="حالت شنود غیرمخرب بدون ارسال پالس"
            >
              شنود (Shadow)
            </button>
            <button
              onClick={() => setIntegrationMode('hybrid')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${integrationMode === 'hybrid' ? 'bg-blue-600 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'}`}
              title="تایید نرم‌افزاری پیش از بازگشایی"
            >
              ترکیبی
            </button>
            <button
              onClick={() => setIntegrationMode('full_control')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${integrationMode === 'full_control' ? 'bg-emerald-600 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'}`}
              title="کنترل مستقل مستقیم سخت‌افزار"
            >
              کنترل کامل
            </button>
          </div>

          <div className="text-[10px] text-stone-400 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>
              {integrationMode === 'shadow' 
                ? 'ایمن‌ترین حالت پایلوت: رله‌ها بدون تغییر می‌مانند و رویدادها شنود می‌شوند.' 
                : integrationMode === 'hybrid'
                ? 'تصمیم‌گیری دوبل: بررسی نرم‌افزار قدیمی و Gym OS.'
                : 'فرمان مستقیم رله به گیت‌ها و کمدها فعال است.'}
            </span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Radio className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {onlineCount} آنلاین
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-stone-900 dark:text-stone-100">{hardwareDevices.length} ترمینال</div>
            <div className="text-xs text-stone-500 mt-1">تجهیزات متصل به گیت‌وی</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-stone-400">میانگین تاخیر</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{avgLatency} میلی‌ثانیه</div>
            <div className="text-xs text-stone-500 mt-1">پاسخ‌دهی پالس شبکه محلی (LAN)</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Terminal className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-stone-400">رویدادهای عادی</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-stone-900 dark:text-stone-100">{hardwareEvents.length} رویداد</div>
            <div className="text-xs text-stone-500 mt-1">لاگ‌های نرمالیزه‌شده دریافتی</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">بورد رله ۶۴ کاناله</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-stone-900 dark:text-stone-100">ESP32-Modbus</div>
            <div className="text-xs text-stone-500 mt-1">پروتکل Modbus TCP فعال</div>
          </div>
        </div>
      </div>

      {/* Simulator & Live Test Sandbox Bar */}
      <div className="p-5 rounded-3xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-100">
            <Play className="h-4 w-4 text-amber-500" />
            <span>شبیه‌ساز و تستر زنده سیگنال‌های سخت‌افزار (Simulator Sandbox)</span>
          </div>
          {simFeedback && (
            <div className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 animate-in fade-in">
              {simFeedback}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">عضو آزمایشی:</label>
            <select
              value={simMemberId}
              onChange={(e) => setSimMemberId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.status === 'active' ? 'فعال' : 'منقضی'} • بدهی: {s.remainingDebt > 0 ? `${s.remainingDebt.toLocaleString('fa-IR')} ت` : 'تسویه'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">نوع سنسور / بیومتریک:</label>
            <select
              value={simMethod}
              onChange={(e) => setSimMethod(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100"
            >
              <option value="face_recognition">دوربین تشخیص چهره (AI Face 4K)</option>
              <option value="rfid_card">کارتخوان RFID / مچ‌بند گیت</option>
              <option value="fingerprint">اسکنر اثر انگشت اپتیکال</option>
              <option value="qr_code">اسکنر بارکد و QR اپلیکیشن</option>
            </select>
          </div>

          <div className="flex items-end sm:col-span-1 md:col-span-2">
            <button
              onClick={handleRunSimulation}
              className="w-full py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Play className="h-3.5 w-3.5" />
              <span>ارسال سیگنال شبیه‌سازی به Access Policy Engine</span>
            </button>
          </div>
        </div>
      </div>

      {/* Connected Hardware Devices Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-500" />
            <span>کنترلرها و پایانه‌های متصل به سیستم ({hardwareDevices.length})</span>
          </h3>
          <button
            onClick={() => setIsAddWizardOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>افزودن دستگاه جدید</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hardwareDevices.map(dev => {
            const isOnline = dev.status === 'online';
            const isTesting = testingDeviceId === dev.id;
            const res = testResult?.id === dev.id ? testResult : null;

            return (
              <div
                key={dev.id}
                className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-4"
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
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isOnline ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'}`}
                    >
                      {isOnline ? 'آنلاین' : 'قطع'}
                    </button>
                  </div>

                  {/* Details table */}
                  <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 text-xs space-y-1.5 text-stone-600 dark:text-stone-300">
                    <div className="flex justify-between">
                      <span className="text-stone-400">آدرس شبکه:</span>
                      <span className="font-mono text-stone-900 dark:text-stone-100">{dev.ipAddress}:{dev.port}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">پروتکل:</span>
                      <span className="font-mono uppercase">{dev.protocol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">موقعیت فیزیکی:</span>
                      <span>{dev.location}</span>
                    </div>
                    {dev.latencyMs && (
                      <div className="flex justify-between">
                        <span className="text-stone-400">تاخیر پینگ:</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">{dev.latencyMs} ms</span>
                      </div>
                    )}
                  </div>

                  {/* Capabilities badges */}
                  {dev.capabilities && (
                    <div className="flex flex-wrap gap-1">
                      {dev.capabilities.map(cap => (
                        <span key={cap} className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          {cap}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <div className="text-[11px] text-stone-400">
                    {res ? (
                      <span className={res.success ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                        {res.success ? `پاسخ دریافت شد (${res.latency}ms)` : 'خطا در ارتباط'}
                      </span>
                    ) : (
                      <span>آخرین وضعیت: {dev.lastPing}</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleTestConnection(dev.id)}
                    disabled={isTesting}
                    className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'تست پالس...' : 'تست اتصال'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Normalized Live Event Stream */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-100">
            <Terminal className="h-4 w-4 text-purple-500" />
            <span>جریان رویدادهای نرمالیزه‌شده زنده سخت‌افزار (Normalized Hardware Stream)</span>
          </div>
          <span className="text-xs text-stone-400">فرمت استاندارد Gym OS</span>
        </div>

        <div className="p-4 rounded-3xl bg-stone-950 text-stone-200 border border-stone-800 font-mono text-xs overflow-x-auto space-y-2 max-h-64 overflow-y-auto">
          {hardwareEvents.map(evt => {
            const memberName = evt.memberName || (evt as any).payload?.memberName || 'رویداد سیستم';
            const credentialType = evt.credentialType || (evt as any).payload?.credentialType || 'سنسور';
            const accessReason = evt.accessReason || (evt as any).payload?.accessReason || 'مجاز';
            const timeFormatted = evt.timestamp?.includes('T') ? evt.timestamp.split('T')[1]?.slice(0, 8) : (evt.timestamp || '');

            return (
              <div key={evt.id || Math.random().toString()} className="p-2 rounded-xl bg-stone-900/80 border border-stone-800/80 flex items-center justify-between">
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

      {/* Add Device Wizard Modal */}
      {isAddWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Cpu className="h-5 w-5 text-amber-500" />
                <span>اتصال سخت‌افزار و اکسس کنترلر جدید</span>
              </h3>
              <button onClick={() => setIsAddWizardOpen(false)} className="text-stone-400 hover:text-stone-600">
                بستن
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">نام دستگاه / ترمینال:</label>
                <input
                  type="text"
                  placeholder="مثال: گیت تردد شماره ۳ رختکن"
                  value={newDevName}
                  onChange={(e) => setNewDevName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">سازنده (Vendor):</label>
                  <select
                    value={newDevVendor}
                    onChange={(e) => setNewDevVendor(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  >
                    <option value="zkteco">ZKTeco (Face / Fingerprint / Push)</option>
                    <option value="hikvision">Hikvision (ISAPI / Turnstiles)</option>
                    <option value="suprema">Suprema (BioMini / BioStar)</option>
                    <option value="generic_relay">Generic Modbus / ESP32 Relay</option>
                    <option value="generic_wiegand">Generic Wiegand-to-IP</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">نوع سنسور / ترمینال:</label>
                  <select
                    value={newDevType}
                    onChange={(e) => setNewDevType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  >
                    <option value="biometric_face">تشخیص چهره هوشمند (Face AI)</option>
                    <option value="rfid_nfc">کارتخوان RFID / NFC</option>
                    <option value="fingerprint">اسکنر اثر انگشت</option>
                    <option value="locker_relay_board">بورد رله کنترل کمدها</option>
                    <option value="barcode_turnstile">بارکدخوان QR گیت</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold mb-1">آدرس IP در شبکه محلی:</label>
                  <input
                    type="text"
                    value={newDevIp}
                    onChange={(e) => setNewDevIp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">پورت:</label>
                  <input
                    type="number"
                    value={newDevPort}
                    onChange={(e) => setNewDevPort(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">محل نصب فیزیکی:</label>
                <input
                  type="text"
                  value={newDevLocation}
                  onChange={(e) => setNewDevLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-800">
              <button
                onClick={() => setIsAddWizardOpen(false)}
                className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold"
              >
                انصراف
              </button>
              <button
                onClick={() => {
                  // Add device logic
                  setIsAddWizardOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold"
              >
                تست و ذخیره دستگاه
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
