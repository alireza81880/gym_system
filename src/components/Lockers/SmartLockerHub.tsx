import React, { useState } from 'react';
import { 
  KeyRound, 
  Lock, 
  Unlock, 
  ScanFace, 
  Radio, 
  Fingerprint, 
  QrCode, 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  Activity, 
  RefreshCw, 
  Cpu, 
  SlidersHorizontal,
  Plus,
  Trash2,
  Sparkles,
  Wifi,
  DoorOpen,
  Maximize2,
  Edit3,
  Layers,
  PlusCircle,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SmartLocker, LockerZone, ScanResult } from '../../types';

export const SmartLockerHub: React.FC = () => {
  const { 
    t, 
    lang, 
    smartLockers, 
    hardwareDevices, 
    accessLogs, 
    students,
    addLocker,
    updateLocker,
    deleteLocker,
    openLocker, 
    releaseLocker, 
    assignLocker,
    toggleLockerMaintenance,
    triggerMasterUnlock,
    simulateIdentityScan,
    toggleDeviceOnline,
    testRelayPulse,
    formatNum 
  } = useApp();

  // Filters & State
  const [selectedZone, setSelectedZone] = useState<LockerZone | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'occupied' | 'maintenance'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Hardware Scanner Simulation State
  const [activeScanMethod, setActiveScanMethod] = useState<'face_recognition' | 'rfid_card' | 'fingerprint' | 'qr_code'>('face_recognition');
  const [selectedStudentForScan, setSelectedStudentForScan] = useState<string>(students[0]?.id || '');
  const [customRfidInput, setCustomRfidInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [testingDevice, setTestingDevice] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; latency: number } | null>(null);

  // Manual Assign Modal
  const [assignModalLocker, setAssignModalLocker] = useState<SmartLocker | null>(null);
  const [selectedStudentToAssign, setSelectedStudentToAssign] = useState<string>('');

  // Add / Edit Locker Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLocker, setEditingLocker] = useState<SmartLocker | null>(null);
  const [deleteConfirmLocker, setDeleteConfirmLocker] = useState<SmartLocker | null>(null);

  const maxLockerNum = smartLockers.length > 0 ? Math.max(...smartLockers.map(l => l.number)) : 0;
  const [newLockerNumber, setNewLockerNumber] = useState<number>(maxLockerNum + 1);
  const [newLockerZone, setNewLockerZone] = useState<LockerZone>('general');
  const [newLockerRelay, setNewLockerRelay] = useState<number>((maxLockerNum % 32) + 1);
  const [newLockerLockType, setNewLockerLockType] = useState<SmartLocker['lockType']>('solenoid_12v');
  const [newLockerStatus, setNewLockerStatus] = useState<'available' | 'maintenance'>('available');

  // KPIs
  const totalCount = smartLockers.length;
  const availableCount = smartLockers.filter(l => l.status === 'available').length;
  const occupiedCount = smartLockers.filter(l => l.status === 'occupied').length;
  const maintenanceCount = smartLockers.filter(l => l.status === 'maintenance').length;
  const onlineDevicesCount = hardwareDevices.filter(d => d.status === 'online').length;

  // Filtered Lockers
  const filteredLockers = smartLockers.filter(locker => {
    if (selectedZone !== 'all' && locker.zone !== selectedZone) return false;
    if (statusFilter !== 'all' && locker.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const numMatch = locker.number.toString().includes(q);
      const studentMatch = locker.currentStudentName?.toLowerCase().includes(q);
      return numMatch || studentMatch;
    }
    return true;
  });

  // Handle hardware scan trigger
  const handleTriggerScan = () => {
    setIsScanning(true);
    setLastScanResult(null);

    setTimeout(() => {
      let query = selectedStudentForScan;
      if (activeScanMethod === 'rfid_card' && customRfidInput.trim()) {
        query = customRfidInput.trim();
      }

      const res = simulateIdentityScan(activeScanMethod, query);
      setLastScanResult(res);
      setIsScanning(false);
    }, 1200);
  };

  const handleTestRelay = async (deviceId: string) => {
    setTestingDevice(deviceId);
    const res = await testRelayPulse(deviceId);
    setTestResult({ id: deviceId, latency: res.latency });
    setTestingDevice(null);
  };

  const handleConfirmAssign = () => {
    if (assignModalLocker && selectedStudentToAssign) {
      assignLocker(assignModalLocker.number, selectedStudentToAssign);
      setAssignModalLocker(null);
      setSelectedStudentToAssign('');
    }
  };

  const handleOpenAddModal = () => {
    const nextNum = smartLockers.length > 0 ? Math.max(...smartLockers.map(l => l.number)) + 1 : 1;
    setNewLockerNumber(nextNum);
    setNewLockerZone('general');
    setNewLockerRelay(((nextNum - 1) % 32) + 1);
    setNewLockerLockType('solenoid_12v');
    setNewLockerStatus('available');
    setIsAddModalOpen(true);
  };

  const handleSaveNewLocker = (e: React.FormEvent) => {
    e.preventDefault();
    if (smartLockers.some(l => l.number === newLockerNumber)) {
      alert(`کمد شماره #${newLockerNumber} قبلاً در سامانه ثبت شده است!`);
      return;
    }
    addLocker({
      number: newLockerNumber,
      zone: newLockerZone,
      status: newLockerStatus,
      isLocked: true,
      relayPort: newLockerRelay,
      lockType: newLockerLockType,
      batteryLevel: 100,
    });
    setIsAddModalOpen(false);
  };

  const handleOpenEditModal = (locker: SmartLocker) => {
    setEditingLocker(locker);
    setNewLockerZone(locker.zone);
    setNewLockerRelay(locker.relayPort);
    setNewLockerLockType(locker.lockType || 'solenoid_12v');
    setNewLockerStatus(locker.status === 'occupied' ? 'available' : locker.status);
  };

  const handleSaveEditLocker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocker) return;
    updateLocker(editingLocker.id, {
      zone: newLockerZone,
      relayPort: newLockerRelay,
      lockType: newLockerLockType,
      status: editingLocker.status === 'occupied' ? 'occupied' : newLockerStatus,
    });
    setEditingLocker(null);
  };

  const handleBatchAdd5 = () => {
    const currentMax = smartLockers.length > 0 ? Math.max(...smartLockers.map(l => l.number)) : 0;
    for (let i = 1; i <= 5; i++) {
      const num = currentMax + i;
      addLocker({
        number: num,
        zone: selectedZone === 'all' ? 'general' : selectedZone,
        status: 'available',
        isLocked: true,
        relayPort: ((num - 1) % 32) + 1,
        lockType: 'solenoid_12v',
        batteryLevel: 100,
      });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Hub Controls */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800/90 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  {t.smartLockersTitle}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    IoT Hardware Active
                  </span>
                </h1>
                <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
                  {t.smartLockersDesc}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Hardware Actions & Locker Management */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن کمد جدید</span>
            </button>

            <button
              onClick={handleBatchAdd5}
              title="افزودن سریع ۵ کمد جدید متوالی"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>+۵ کمد پیاپی</span>
            </button>

            <button
              onClick={triggerMasterUnlock}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors shadow-sm cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              {t.masterUnlockAll}
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
              <Cpu className="w-4 h-4 text-amber-500" />
              <span>{formatNum(onlineDevicesCount)} / {formatNum(hardwareDevices.length)} {t.hardwareConnected}</span>
            </div>
          </div>
        </div>

        {/* Stats KPIs Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800/80">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-700/60">
            <span className="text-xs text-slate-500 dark:text-zinc-400">{t.totalLockers}</span>
            <div className="text-xl md:text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-1">
              {formatNum(totalCount)} <span className="text-xs font-normal text-slate-500">کمد</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {t.availableLockers}
            </span>
            <div className="text-xl md:text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
              {formatNum(availableCount)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
            <span className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              {t.occupiedLockers}
            </span>
            <div className="text-xl md:text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
              {formatNum(occupiedCount)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-700/60">
            <span className="text-xs text-slate-500 dark:text-zinc-400">{t.maintenanceLockers}</span>
            <div className="text-xl md:text-2xl font-bold text-slate-700 dark:text-zinc-300 mt-1">
              {formatNum(maintenanceCount)}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* IDENTITY RECOGNITION & HARDWARE GATE BRIDGE */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800/90 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                {t.liveScanIdentity}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                سیستم تشخیص هویت، تایید خودکار اعتبار و ارسال پالس رله به گیت و کمد الکترونیکی
              </p>
            </div>
          </div>

          {/* Scanner Mode Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl">
            <button
              onClick={() => setActiveScanMethod('face_recognition')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeScanMethod === 'face_recognition'
                  ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              <ScanFace className="w-3.5 h-3.5" />
              {t.biometricScanner}
            </button>
            <button
              onClick={() => setActiveScanMethod('rfid_card')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeScanMethod === 'rfid_card'
                  ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              {t.rfidScanner}
            </button>
            <button
              onClick={() => setActiveScanMethod('fingerprint')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeScanMethod === 'fingerprint'
                  ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              {t.fingerprintScanner}
            </button>
            <button
              onClick={() => setActiveScanMethod('qr_code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeScanMethod === 'qr_code'
                  ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              QR گیت
            </button>
          </div>
        </div>

        {/* Live Terminal Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center bg-slate-50/80 dark:bg-zinc-950/60 p-4 md:p-5 rounded-xl border border-slate-200/80 dark:border-zinc-800">
          
          {/* Visual Scanner HUD */}
          <div className="lg:col-span-5 relative bg-zinc-900 rounded-xl overflow-hidden aspect-video sm:aspect-21/9 lg:aspect-video flex items-center justify-center border border-zinc-800 shadow-inner">
            {/* Visual Grid Lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-15"></div>

            {/* Target Reticle */}
            <div className="relative z-10 w-32 h-32 md:w-36 md:h-36 rounded-2xl border-2 border-dashed border-indigo-500/50 flex flex-col items-center justify-center p-3 text-center">
              {isScanning && (
                <div className="absolute inset-x-0 h-0.5 bg-cyan-400 shadow-[0_0_12px_#38bdf8] animate-laser-scan"></div>
              )}

              {activeScanMethod === 'face_recognition' && (
                <ScanFace className={`w-12 h-12 ${isScanning ? 'text-cyan-400 animate-pulse' : 'text-indigo-400'}`} />
              )}
              {activeScanMethod === 'rfid_card' && (
                <Radio className={`w-12 h-12 ${isScanning ? 'text-amber-400 animate-pulse' : 'text-indigo-400'}`} />
              )}
              {activeScanMethod === 'fingerprint' && (
                <Fingerprint className={`w-12 h-12 ${isScanning ? 'text-emerald-400 animate-pulse' : 'text-indigo-400'}`} />
              )}
              {activeScanMethod === 'qr_code' && (
                <QrCode className={`w-12 h-12 ${isScanning ? 'text-purple-400 animate-pulse' : 'text-indigo-400'}`} />
              )}

              <span className="text-[11px] font-mono text-zinc-400 mt-2">
                {isScanning ? 'در حال تحلیل بیومتریک...' : 'آماده دریافت سیگنال سخت‌افزار'}
              </span>
            </div>

            {/* Hardware Status Overlay */}
            <div className="absolute bottom-2 inset-x-3 flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ONLINE 60FPS
              </span>
              <span>ESP32-RELAY-MODBUS: READY</span>
            </div>
          </div>

          {/* Test Controls & Trigger */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  انتخاب ورزشکار جهت شبیه‌سازی ورود:
                </label>
                <select
                  value={selectedStudentForScan}
                  onChange={(e) => setSelectedStudentForScan(e.target.value)}
                  className="w-full text-xs rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2.5 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.status === 'active' ? 'اشتراک فعال' : s.status === 'expired' ? 'منقضی' : 'بدهکار'})
                    </option>
                  ))}
                </select>
              </div>

              {activeScanMethod === 'rfid_card' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    شناسه کارت یا مچ‌بند (RFID UID):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. E2-80-68-9A"
                    value={customRfidInput}
                    onChange={(e) => setCustomRfidInput(e.target.value)}
                    className="w-full text-xs font-mono rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    پروتکل ارتباطی ماژول:
                  </label>
                  <div className="text-xs rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-slate-600 dark:text-zinc-300 flex items-center justify-between">
                    <span className="font-mono">TCP WebSocket / MQTT</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">پاسخ 18ms</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={handleTriggerScan}
                disabled={isScanning}
                className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>در حال شناسایی بیومتریک و ارسال پالس رله...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>ارسال فرمان شناسایی هویت و بازگشایی کمد</span>
                  </>
                )}
              </button>
            </div>

            {/* Scan Output Result Display */}
            {lastScanResult && (
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                lastScanResult.success 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200' 
                  : lastScanResult.alertType === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200'
              }`}>
                {lastScanResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="text-xs space-y-1">
                  <div className="font-bold flex items-center gap-2">
                    <span>{lastScanResult.message}</span>
                  </div>
                  {lastScanResult.lockerNumber && (
                    <div className="text-[11px] font-medium opacity-90">
                      ⚡ پالس رله # {lastScanResult.lockerNumber} فعال شد • گیت تردد باز و آماده عبور است.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SMART LOCKERS INTERACTIVE GRID */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800/90 rounded-2xl p-5 md:p-6 shadow-sm">
        
        {/* Controls and Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-500" />
              ماتریس کمدهای هوشمند باشگاه ({formatNum(filteredLockers.length)} کمد)
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              مشاهده وضعیت فیزیکی و باز کردن درب کمدها از راه دور از طریق پالس رله
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <input
              type="text"
              placeholder="جستجوی شماره کمد یا نام شاگرد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />

            {/* Zone Filter */}
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value as any)}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="all">همه بخش‌ها</option>
              <option value="vip">{t.zoneVip}</option>
              <option value="men">{t.zoneMen}</option>
              <option value="women">{t.zoneWomen}</option>
              <option value="general">{t.zoneGeneral}</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="all">تمام وضعیت‌ها</option>
              <option value="available">فقط خالی / آماده</option>
              <option value="occupied">در حال استفاده</option>
              <option value="maintenance">در دست تعمیر</option>
            </select>
          </div>
        </div>

        {/* Lockers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {filteredLockers.map((locker) => {
            const isAvailable = locker.status === 'available';
            const isOccupied = locker.status === 'occupied';
            const isMaintenance = locker.status === 'maintenance';
            const isDoorOpen = !locker.isLocked;

            return (
              <div
                key={locker.id}
                className={`relative rounded-xl p-3.5 border transition-all duration-200 flex flex-col justify-between ${
                  isOccupied
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/50 hover:border-amber-300'
                    : isAvailable
                    ? 'bg-slate-50/60 dark:bg-zinc-800/40 border-slate-200/80 dark:border-zinc-700/80 hover:border-emerald-400'
                    : 'bg-zinc-100 dark:bg-zinc-800/80 border-zinc-300 dark:border-zinc-700 opacity-70'
                } ${isDoorOpen ? 'ring-2 ring-emerald-500 shadow-md animate-locker-pulse' : ''}`}
              >
                {/* Locker Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-black text-slate-800 dark:text-zinc-100 font-mono">
                      #{formatNum(locker.number)}
                    </span>
                    {locker.zone === 'vip' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400">
                        VIP
                      </span>
                    )}
                  </div>

                  {/* Status Indicator LED */}
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${
                      isAvailable ? 'bg-emerald-500 animate-pulse' : isOccupied ? 'bg-amber-500' : 'bg-zinc-400'
                    }`}></span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                      R{locker.relayPort}
                    </span>
                  </div>
                </div>

                {/* Locker Body Information */}
                <div className="my-2.5">
                  {isOccupied ? (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate" title={locker.currentStudentName}>
                        {locker.currentStudentName}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                        ورود: {locker.assignedAt || 'امروز'}
                      </p>
                    </div>
                  ) : isAvailable ? (
                    <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      خالی و آماده تحویل
                    </p>
                  ) : (
                    <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                      غیرفعال / قفل فنی
                    </p>
                  )}
                </div>

                {/* Locker Actions Toolbar */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-700/60 flex items-center justify-between gap-1">
                  
                  {/* Remote Unlock Trigger */}
                  <button
                    onClick={() => openLocker(locker.number, 'دستور دستی از داشبورد')}
                    title="ارسال فرمان رله و باز کردن درب کمد"
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isDoorOpen
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-zinc-700 hover:bg-emerald-500 hover:text-white text-slate-700 dark:text-zinc-200'
                    }`}
                  >
                    {isDoorOpen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span className="text-[10px]">{isDoorOpen ? 'باز شد' : 'باز کردن'}</span>
                  </button>

                  {/* Context Menu / Actions */}
                  {isOccupied ? (
                    <button
                      onClick={() => releaseLocker(locker.number)}
                      title="تخلیه و آزادسازی کمد"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : isAvailable ? (
                    <button
                      onClick={() => setAssignModalLocker(locker)}
                      title="تخصیص به شاگرد"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  ) : null}

                  <button
                    onClick={() => handleOpenEditModal(locker)}
                    title="ویرایش مشخصات کمد و پورت رله"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => toggleLockerMaintenance(locker.number)}
                    title="تغییر وضعیت تعمیرات"
                    className={`p-1.5 rounded-lg transition-colors ${
                      isMaintenance 
                        ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' 
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200'
                    }`}
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => setDeleteConfirmLocker(locker)}
                    title="حذف کمد از سیستم"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* HARDWARE DEVICES & LIVE ACCESS TELEMETRY */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Hardware IoT Device Diagnostics */}
        <div className="lg:col-span-6 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800/90 rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                وضعیت تجهیزات سخت‌افزاری و کنترلرها
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">Modbus / MQTT Gateway</span>
          </div>

          <div className="space-y-3">
            {hardwareDevices.map((dev) => (
              <div
                key={dev.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/70 dark:border-zinc-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dev.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">{dev.name}</h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-zinc-400 mt-1">
                    <span>IP: {dev.ipAddress}</span>
                    <span>Port: {dev.port}</span>
                    <span>مکان: {dev.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestRelay(dev.id)}
                    disabled={testingDevice === dev.id}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
                  >
                    {testingDevice === dev.id ? 'پالس...' : 'تست پالس'}
                  </button>
                  <button
                    onClick={() => toggleDeviceOnline(dev.id)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Hardware Access Logs */}
        <div className="lg:col-span-6 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800/90 rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                لاگ زنده تردد و رله‌های الکترونیکی
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">Live Telemetry</span>
          </div>

          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {accessLogs.map((log, idx) => {
              const isGranted = log.result === 'granted';
              return (
                <div
                  key={`${log.id || 'log'}-${idx}`}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-700/60 flex items-start gap-2.5 text-xs"
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isGranted ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800 dark:text-zinc-200">{log.studentName}</span>
                      <span className="text-[10px] font-mono text-slate-400">{log.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400">{log.message}</p>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">{log.deviceType}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* MANUAL ASSIGN MODAL */}
      {/* ---------------------------------------------------- */}
      {assignModalLocker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              تخصیص کمد هوشمند #{formatNum(assignModalLocker.number)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              یک ورزشکار حاضر در سالن را جهت تحویل کمد انتخاب نمایید:
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                انتخاب ورزشکار:
              </label>
              <select
                value={selectedStudentToAssign}
                onChange={(e) => setSelectedStudentToAssign(e.target.value)}
                className="w-full text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-slate-800 dark:text-zinc-200"
              >
                <option value="">-- انتخاب کنید --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.fullName} ({s.phone})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => setAssignModalLocker(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                انصراف
              </button>
              <button
                onClick={handleConfirmAssign}
                disabled={!selectedStudentToAssign}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
              >
                ثبت و باز کردن درب کمد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* ADD LOCKER MODAL */}
      {/* ---------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  افزودن کمد هوشمند جدید به باشگاه
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewLocker} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    شماره کمد: *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newLockerNumber}
                    onChange={(e) => setNewLockerNumber(parseInt(e.target.value) || 1)}
                    className="w-full text-xs font-mono font-bold rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    پورت رله سخت‌افزار (Relay Port): *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="64"
                    required
                    value={newLockerRelay}
                    onChange={(e) => setNewLockerRelay(parseInt(e.target.value) || 1)}
                    className="w-full text-xs font-mono rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    بخش / زون استقرار کمد:
                  </label>
                  <select
                    value={newLockerZone}
                    onChange={(e) => setNewLockerZone(e.target.value as LockerZone)}
                    className="w-full text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-slate-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="general">{t.zoneGeneral}</option>
                    <option value="vip">{t.zoneVip}</option>
                    <option value="men">{t.zoneMen}</option>
                    <option value="women">{t.zoneWomen}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    نوع قفل و محرک الکترونیکی:
                  </label>
                  <select
                    value={newLockerLockType}
                    onChange={(e) => setNewLockerLockType(e.target.value as any)}
                    className="w-full text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-slate-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="solenoid_12v">سولنوئید برقی 12 ولت (Solenoid)</option>
                    <option value="magnetic_lock">قفل مغناطیسی / مگنت (EM-Lock)</option>
                    <option value="motorized_bolt">قفل بولت موتوری (Motorized)</option>
                    <option value="rfid_embedded">قفل هوشمند مستقل RFID</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  وضعیت اولیه:
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="initialStatus"
                      checked={newLockerStatus === 'available'}
                      onChange={() => setNewLockerStatus('available')}
                      className="accent-amber-500"
                    />
                    <span>آماده و قابل تحویل به شاگرد</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="initialStatus"
                      checked={newLockerStatus === 'maintenance'}
                      onChange={() => setNewLockerStatus('maintenance')}
                      className="accent-amber-500"
                    />
                    <span>در دست تعمیر / قفل فنی</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
                >
                  ثبت و فعال‌سازی کمد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* EDIT LOCKER MODAL */}
      {/* ---------------------------------------------------- */}
      {editingLocker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  ویرایش مشخصات کمد #{formatNum(editingLocker.number)}
                </h3>
              </div>
              <button
                onClick={() => setEditingLocker(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLocker} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    بخش / زون استقرار:
                  </label>
                  <select
                    value={newLockerZone}
                    onChange={(e) => setNewLockerZone(e.target.value as LockerZone)}
                    className="w-full text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-slate-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="general">{t.zoneGeneral}</option>
                    <option value="vip">{t.zoneVip}</option>
                    <option value="men">{t.zoneMen}</option>
                    <option value="women">{t.zoneWomen}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    پورت رله کنترلر:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="64"
                    required
                    value={newLockerRelay}
                    onChange={(e) => setNewLockerRelay(parseInt(e.target.value) || 1)}
                    className="w-full text-xs font-mono rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-slate-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    نوع قفل برقی:
                  </label>
                  <select
                    value={newLockerLockType}
                    onChange={(e) => setNewLockerLockType(e.target.value as any)}
                    className="w-full text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-slate-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="solenoid_12v">سولنوئید برقی 12 ولت (Solenoid)</option>
                    <option value="magnetic_lock">قفل مغناطیسی / مگنت (EM-Lock)</option>
                    <option value="motorized_bolt">قفل بولت موتوری (Motorized)</option>
                    <option value="rfid_embedded">قفل هوشمند مستقل RFID</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingLocker(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* DELETE CONFIRM MODAL */}
      {/* ---------------------------------------------------- */}
      {deleteConfirmLocker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                حذف کمد #{formatNum(deleteConfirmLocker.number)}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                آیا از حذف این کمد و قطع ارتباط پورت رله آن اطمینان دارید؟
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmLocker(null)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                انصراف
              </button>
              <button
                onClick={() => {
                  deleteLocker(deleteConfirmLocker.id);
                  setDeleteConfirmLocker(null);
                }}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
              >
                تایید و حذف
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
