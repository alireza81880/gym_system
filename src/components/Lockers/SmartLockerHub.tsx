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
import { GlassPageHeader } from '../common/GlassPageHeader';
import { GlassCard } from '../common/GlassCard';
import { GlassStatCard } from '../common/GlassStatCard';
import { GlassButton } from '../common/GlassButton';
import { GlassBadge } from '../common/GlassBadge';
import { GlassModal } from '../common/GlassModal';

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

  // Test individual device relay pulse
  const handleTestRelay = (deviceId: string) => {
    setTestingDevice(deviceId);
    setTestResult(null);
    setTimeout(() => {
      const latency = testRelayPulse(deviceId);
      setTestResult({ id: deviceId, latency });
      setTestingDevice(null);
    }, 450);
  };

  // Manual Assign Confirm
  const handleConfirmAssign = () => {
    if (assignModalLocker && selectedStudentToAssign) {
      assignLocker(assignModalLocker.number, selectedStudentToAssign);
      setAssignModalLocker(null);
      setSelectedStudentToAssign('');
    }
  };

  // Add Locker Submit
  const handleSaveNewLocker = (e: React.FormEvent) => {
    e.preventDefault();
    addLocker({
      number: Number(newLockerNumber),
      zone: newLockerZone,
      relayPort: Number(newLockerRelay),
      lockType: newLockerLockType,
      status: newLockerStatus,
    });
    setIsAddModalOpen(false);
    setNewLockerNumber(maxLockerNum + 2);
    setNewLockerRelay(((maxLockerNum + 1) % 32) + 1);
  };

  // Open Add modal with fresh defaults
  const handleOpenAddModal = () => {
    const currentMax = smartLockers.length > 0 ? Math.max(...smartLockers.map(l => l.number)) : 0;
    setNewLockerNumber(currentMax + 1);
    setNewLockerRelay((currentMax % 32) + 1);
    setNewLockerZone('general');
    setNewLockerLockType('solenoid_12v');
    setNewLockerStatus('available');
    setIsAddModalOpen(true);
  };

  // Edit Locker Open
  const handleOpenEditModal = (locker: SmartLocker) => {
    setEditingLocker(locker);
    setNewLockerZone(locker.zone);
    setNewLockerRelay(locker.relayPort);
    setNewLockerLockType(locker.lockType);
  };

  // Edit Locker Save
  const handleSaveEditLocker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocker) return;
    updateLocker(editingLocker.id, {
      zone: newLockerZone,
      relayPort: Number(newLockerRelay),
      lockType: newLockerLockType,
    });
    setEditingLocker(null);
  };

  // Quick Batch Add 5 Lockers
  const handleBatchAdd5 = () => {
    const currentMax = smartLockers.length > 0 ? Math.max(...smartLockers.map(l => l.number)) : 0;
    for (let i = 1; i <= 5; i++) {
      const num = currentMax + i;
      addLocker({
        number: num,
        zone: 'general',
        relayPort: ((num - 1) % 32) + 1,
        lockType: 'solenoid_12v',
        status: 'available',
      });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Page Header */}
      <GlassPageHeader
        title={t.smartLockersTitle}
        subtitle={t.smartLockersDesc}
        icon={<KeyRound className="w-6 h-6 text-[var(--gym-brand,#10b981)]" />}
        badge={{ text: 'IoT Hardware Active', variant: 'success' }}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <GlassButton
              variant="neon"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleOpenAddModal}
            >
              افزودن کمد جدید
            </GlassButton>

            <GlassButton
              variant="secondary"
              size="md"
              icon={<Layers className="w-3.5 h-3.5 text-[var(--gym-brand,#10b981)]" />}
              onClick={handleBatchAdd5}
              title="افزودن سریع ۵ کمد جدید متوالی"
            >
              +۵ کمد پیاپی
            </GlassButton>

            <GlassButton
              variant="secondary"
              size="md"
              className="!bg-rose-500/15 !border-rose-500/40 !text-rose-400 hover:!bg-rose-500/25"
              icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
              onClick={triggerMasterUnlock}
            >
              {t.masterUnlockAll}
            </GlassButton>

            <div className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-2xl glass-subtle border border-[var(--gym-border)] text-[var(--gym-text-secondary)]">
              <Cpu className="w-4 h-4 text-[var(--gym-brand,#10b981)]" />
              <span>{formatNum(onlineDevicesCount)} / {formatNum(hardwareDevices.length)} {t.hardwareConnected}</span>
            </div>
          </div>
        }
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassStatCard
          title={t.totalLockers}
          value={`${formatNum(totalCount)} کمد`}
          icon={<KeyRound className="w-6 h-6 text-[var(--gym-brand,#10b981)]" />}
        />

        <GlassStatCard
          title={t.availableLockers}
          value={formatNum(availableCount)}
          icon={<Unlock className="w-6 h-6 text-emerald-400" />}
          badge={{ text: 'آماده تحویل', variant: 'success' }}
        />

        <GlassStatCard
          title={t.occupiedLockers}
          value={formatNum(occupiedCount)}
          icon={<Lock className="w-6 h-6 text-amber-400" />}
          badge={{ text: 'در حال استفاده', variant: 'warning' }}
        />

        <GlassStatCard
          title={t.maintenanceLockers}
          value={formatNum(maintenanceCount)}
          icon={<SlidersHorizontal className="w-6 h-6 text-[var(--gym-text-muted)]" />}
          badge={{ text: 'قفل فنی', variant: 'neutral' }}
        />
      </div>

      {/* ---------------------------------------------------- */}
      {/* IDENTITY RECOGNITION & HARDWARE GATE BRIDGE */}
      {/* ---------------------------------------------------- */}
      <GlassCard variant="regular" className="p-5 md:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--gym-text,#fff)]">
                {t.liveScanIdentity}
              </h2>
              <p className="text-xs text-[var(--gym-text-muted)]">
                سیستم تشخیص هویت، تایید خودکار اعتبار و ارسال پالس رله به گیت و کمد الکترونیکی
              </p>
            </div>
          </div>

          {/* Scanner Mode Tabs */}
          <div className="flex items-center p-1 glass-subtle rounded-2xl border border-[var(--gym-border)]">
            <button
              onClick={() => setActiveScanMethod('face_recognition')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeScanMethod === 'face_recognition'
                  ? 'bg-[var(--gym-brand,#10b981)] text-stone-950 shadow-xs'
                  : 'text-[var(--gym-text-secondary)] hover:text-[var(--gym-text)]'
              }`}
            >
              <ScanFace className="w-3.5 h-3.5" />
              {t.biometricScanner}
            </button>
            <button
              onClick={() => setActiveScanMethod('rfid_card')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeScanMethod === 'rfid_card'
                  ? 'bg-[var(--gym-brand,#10b981)] text-stone-950 shadow-xs'
                  : 'text-[var(--gym-text-secondary)] hover:text-[var(--gym-text)]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              {t.rfidScanner}
            </button>
            <button
              onClick={() => setActiveScanMethod('fingerprint')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeScanMethod === 'fingerprint'
                  ? 'bg-[var(--gym-brand,#10b981)] text-stone-950 shadow-xs'
                  : 'text-[var(--gym-text-secondary)] hover:text-[var(--gym-text)]'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              {t.fingerprintScanner}
            </button>
            <button
              onClick={() => setActiveScanMethod('qr_code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeScanMethod === 'qr_code'
                  ? 'bg-[var(--gym-brand,#10b981)] text-stone-950 shadow-xs'
                  : 'text-[var(--gym-text-secondary)] hover:text-[var(--gym-text)]'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              QR گیت
            </button>
          </div>
        </div>

        {/* Live Terminal Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center glass-subtle p-4 md:p-5 rounded-2xl border border-[var(--gym-border)]">
          
          {/* Visual Scanner HUD */}
          <div className="lg:col-span-5 relative bg-stone-950/80 rounded-2xl overflow-hidden aspect-video sm:aspect-21/9 lg:aspect-video flex items-center justify-center border border-[var(--gym-border)] shadow-inner">
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-15"></div>

            {/* Target Reticle */}
            <div className="relative z-10 w-32 h-32 md:w-36 md:h-36 rounded-2xl border-2 border-dashed border-[var(--gym-brand,#10b981)]/50 flex flex-col items-center justify-center p-3 text-center">
              {isScanning && (
                <div className="absolute inset-x-0 h-0.5 bg-[var(--gym-brand,#10b981)] shadow-[0_0_12px_#10b981] animate-pulse"></div>
              )}

              {activeScanMethod === 'face_recognition' && (
                <ScanFace className={`w-12 h-12 ${isScanning ? 'text-emerald-400 animate-pulse' : 'text-indigo-400'}`} />
              )}
              {activeScanMethod === 'rfid_card' && (
                <Radio className={`w-12 h-12 ${isScanning ? 'text-amber-400 animate-pulse' : 'text-cyan-400'}`} />
              )}
              {activeScanMethod === 'fingerprint' && (
                <Fingerprint className={`w-12 h-12 ${isScanning ? 'text-emerald-400 animate-pulse' : 'text-emerald-400'}`} />
              )}
              {activeScanMethod === 'qr_code' && (
                <QrCode className={`w-12 h-12 ${isScanning ? 'text-purple-400 animate-pulse' : 'text-purple-400'}`} />
              )}

              <span className="text-[11px] font-mono text-[var(--gym-text-muted)] mt-2">
                {isScanning ? 'در حال تحلیل بیومتریک...' : 'آماده دریافت سیگنال سخت‌افزار'}
              </span>
            </div>

            {/* Hardware Status Overlay */}
            <div className="absolute bottom-2 inset-x-3 flex items-center justify-between text-[10px] font-mono text-[var(--gym-text-muted)]">
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
                <label className="block text-xs font-semibold text-[var(--gym-text-secondary)] mb-1.5">
                  انتخاب ورزشکار جهت شبیه‌سازی ورود:
                </label>
                <select
                  value={selectedStudentForScan}
                  onChange={(e) => setSelectedStudentForScan(e.target.value)}
                  className="w-full text-xs rounded-xl glass-subtle border border-[var(--gym-border)] px-3 py-2.5 text-[var(--gym-text)] bg-[var(--gym-surface)] focus:outline-none focus:border-[var(--gym-brand,#10b981)]"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id} className="bg-stone-900 text-white">
                      {s.fullName} ({s.status === 'active' ? 'اشتراک فعال' : s.status === 'expired' ? 'منقضی' : 'بدهکار'})
                    </option>
                  ))}
                </select>
              </div>

              {activeScanMethod === 'rfid_card' ? (
                <div>
                  <label className="block text-xs font-semibold text-[var(--gym-text-secondary)] mb-1.5">
                    شناسه کارت یا مچ‌بند (RFID UID):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. E2-80-68-9A"
                    value={customRfidInput}
                    onChange={(e) => setCustomRfidInput(e.target.value)}
                    className="w-full text-xs font-mono rounded-xl glass-subtle border border-[var(--gym-border)] px-3 py-2 text-[var(--gym-text)] focus:border-[var(--gym-brand,#10b981)] outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-[var(--gym-text-secondary)] mb-1.5">
                    پروتکل ارتباطی ماژول:
                  </label>
                  <div className="text-xs rounded-xl glass-subtle border border-[var(--gym-border)] px-3 py-2 text-[var(--gym-text-secondary)] flex items-center justify-between">
                    <span className="font-mono">TCP WebSocket / MQTT</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 font-semibold">پاسخ 18ms</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <GlassButton
                variant="neon"
                size="md"
                onClick={handleTriggerScan}
                disabled={isScanning}
                icon={isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              >
                {isScanning ? 'در حال اسکن و ارسال پالس...' : 'تست اسکن و فرمان بازگشایی'}
              </GlassButton>

              <span className="text-xs text-[var(--gym-text-muted)] font-mono">
                Relay Pulse: 500ms Active
              </span>
            </div>

            {/* Scan Feedback Message */}
            {lastScanResult && (
              <div className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 transition-all ${
                lastScanResult.granted 
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' 
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}>
                {lastScanResult.granted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="font-bold">{lastScanResult.message}</p>
                  {lastScanResult.lockerNumber && (
                    <p className="text-[11px] mt-0.5 opacity-90">
                      کمد هوشمند شماره <span className="font-bold font-mono">#{lastScanResult.lockerNumber}</span> تخصیص یافت و پالس بازگشایی ارسال شد.
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </GlassCard>

      {/* ---------------------------------------------------- */}
      {/* SMART LOCKERS INTERACTIVE GRID */}
      {/* ---------------------------------------------------- */}
      <GlassCard variant="regular" className="p-5 md:p-6 space-y-6">
        
        {/* Controls and Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[var(--gym-text,#fff)] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[var(--gym-brand,#10b981)]" />
              ماتریس کمدهای هوشمند باشگاه ({formatNum(filteredLockers.length)} کمد)
            </h2>
            <p className="text-xs text-[var(--gym-text-muted)]">
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
              className="text-xs px-3 py-1.5 rounded-xl glass-subtle border border-[var(--gym-border)] text-[var(--gym-text)] focus:border-[var(--gym-brand,#10b981)] outline-none"
            />

            {/* Zone Filter */}
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value as any)}
              className="text-xs px-3 py-1.5 rounded-xl glass-subtle border border-[var(--gym-border)] text-[var(--gym-text)] bg-[var(--gym-surface)] outline-none"
            >
              <option value="all" className="bg-stone-900 text-white">همه بخش‌ها</option>
              <option value="vip" className="bg-stone-900 text-white">{t.zoneVip}</option>
              <option value="men" className="bg-stone-900 text-white">{t.zoneMen}</option>
              <option value="women" className="bg-stone-900 text-white">{t.zoneWomen}</option>
              <option value="general" className="bg-stone-900 text-white">{t.zoneGeneral}</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs px-3 py-1.5 rounded-xl glass-subtle border border-[var(--gym-border)] text-[var(--gym-text)] bg-[var(--gym-surface)] outline-none"
            >
              <option value="all" className="bg-stone-900 text-white">تمام وضعیت‌ها</option>
              <option value="available" className="bg-stone-900 text-white">فقط خالی / آماده</option>
              <option value="occupied" className="bg-stone-900 text-white">در حال استفاده</option>
              <option value="maintenance" className="bg-stone-900 text-white">در دست تعمیر</option>
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
                className={`relative rounded-2xl p-3.5 border transition-all duration-200 flex flex-col justify-between ${
                  isOccupied
                    ? 'glass-regular bg-amber-500/10 border-amber-500/30 hover:border-amber-400'
                    : isAvailable
                    ? 'glass-subtle border-[var(--gym-border)] hover:border-emerald-400'
                    : 'glass-subtle opacity-60'
                } ${isDoorOpen ? 'ring-2 ring-[var(--gym-brand,#10b981)] shadow-[0_0_15px_var(--gym-brand-glow)]' : ''}`}
              >
                {/* Locker Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-black text-[var(--gym-text,#fff)] font-mono">
                      #{formatNum(locker.number)}
                    </span>
                    {locker.zone === 'vip' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        VIP
                      </span>
                    )}
                  </div>

                  {/* Status Indicator LED */}
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${
                      isAvailable ? 'bg-emerald-400 animate-pulse' : isOccupied ? 'bg-amber-400' : 'bg-stone-500'
                    }`}></span>
                    <span className="text-[10px] font-mono text-[var(--gym-text-muted)]">
                      R{locker.relayPort}
                    </span>
                  </div>
                </div>

                {/* Locker Body Information */}
                <div className="my-2.5">
                  {isOccupied ? (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-[var(--gym-text,#fff)] truncate" title={locker.currentStudentName}>
                        {locker.currentStudentName}
                      </p>
                      <p className="text-[10px] text-[var(--gym-text-muted)]">
                        ورود: {locker.assignedAt || 'امروز'}
                      </p>
                    </div>
                  ) : isAvailable ? (
                    <p className="text-[11px] font-semibold text-emerald-400">
                      خالی و آماده تحویل
                    </p>
                  ) : (
                    <p className="text-[11px] font-medium text-[var(--gym-text-muted)]">
                      غیرفعال / قفل فنی
                    </p>
                  )}
                </div>

                {/* Locker Actions Toolbar */}
                <div className="pt-2 border-t border-[var(--gym-border)] flex items-center justify-between gap-1">
                  
                  {/* Remote Unlock Trigger */}
                  <button
                    onClick={() => openLocker(locker.number, 'دستور دستی از داشبورد')}
                    title="ارسال فرمان رله و باز کردن درب کمد"
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isDoorOpen
                        ? 'bg-[var(--gym-brand,#10b981)] text-stone-950 font-bold shadow-xs'
                        : 'glass-subtle hover:bg-[var(--gym-brand,#10b981)] hover:text-stone-950 text-[var(--gym-text-secondary)]'
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
                      className="p-1.5 rounded-lg text-[var(--gym-text-muted)] hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : isAvailable ? (
                    <button
                      onClick={() => setAssignModalLocker(locker)}
                      title="تخصیص به شاگرد"
                      className="p-1.5 rounded-lg text-[var(--gym-text-muted)] hover:text-amber-400 hover:bg-amber-500/15 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  ) : null}

                  <button
                    onClick={() => handleOpenEditModal(locker)}
                    title="ویرایش مشخصات کمد و پورت رله"
                    className="p-1.5 rounded-lg text-[var(--gym-text-muted)] hover:text-blue-400 hover:bg-blue-500/15 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => toggleLockerMaintenance(locker.number)}
                    title="تغییر وضعیت تعمیرات"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isMaintenance 
                        ? 'text-amber-400 bg-amber-500/15' 
                        : 'text-[var(--gym-text-muted)] hover:text-[var(--gym-text)]'
                    }`}
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => setDeleteConfirmLocker(locker)}
                    title="حذف کمد از سیستم"
                    className="p-1.5 rounded-lg text-[var(--gym-text-muted)] hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                </div>

              </div>
            );
          })}
        </div>

      </GlassCard>

      {/* ---------------------------------------------------- */}
      {/* HARDWARE DEVICES & LIVE ACCESS TELEMETRY */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Hardware IoT Device Diagnostics */}
        <GlassCard variant="regular" className="lg:col-span-6 p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[var(--gym-brand,#10b981)]" />
              <h3 className="text-sm font-bold text-[var(--gym-text,#fff)]">
                وضعیت تجهیزات سخت‌افزاری و کنترلرها
              </h3>
            </div>
            <span className="text-xs text-[var(--gym-text-muted)] font-mono">Modbus / MQTT Gateway</span>
          </div>

          <div className="space-y-3">
            {hardwareDevices.map((dev) => (
              <div
                key={dev.id}
                className="p-3 rounded-2xl glass-subtle border border-[var(--gym-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dev.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                    <h4 className="text-xs font-bold text-[var(--gym-text,#fff)]">{dev.name}</h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[var(--gym-text-muted)] mt-1">
                    <span>IP: {dev.ipAddress}</span>
                    <span>Port: {dev.port}</span>
                    <span>مکان: {dev.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <GlassButton
                    variant="secondary"
                    size="sm"
                    onClick={() => handleTestRelay(dev.id)}
                    disabled={testingDevice === dev.id}
                  >
                    {testingDevice === dev.id ? 'پالس...' : 'تست پالس'}
                  </GlassButton>
                  <button
                    onClick={() => toggleDeviceOnline(dev.id)}
                    className="p-1.5 rounded-lg text-[var(--gym-text-muted)] hover:text-[var(--gym-text)] hover:bg-[var(--gym-surface-glass)] cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Live Hardware Access Logs */}
        <GlassCard variant="regular" className="lg:col-span-6 p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-[var(--gym-text,#fff)]">
                لاگ زنده تردد و رله‌های الکترونیکی
              </h3>
            </div>
            <span className="text-xs text-[var(--gym-text-muted)] font-mono">Live Telemetry</span>
          </div>

          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {accessLogs.map((log, idx) => {
              const isGranted = log.result === 'granted';
              return (
                <div
                  key={`${log.id || 'log'}-${idx}`}
                  className="p-2.5 rounded-2xl glass-subtle border border-[var(--gym-border)] flex items-start gap-2.5 text-xs"
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isGranted ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[var(--gym-text,#fff)]">{log.studentName}</span>
                      <span className="text-[10px] font-mono text-[var(--gym-text-muted)]">{log.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-[var(--gym-text-secondary)]">{log.message}</p>
                    <span className="text-[10px] text-[var(--gym-text-muted)] font-mono">{log.deviceType}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

      </div>

      {/* ---------------------------------------------------- */}
      {/* MANUAL ASSIGN MODAL */}
      {/* ---------------------------------------------------- */}
      {assignModalLocker && (
        <GlassModal
          isOpen={true}
          onClose={() => setAssignModalLocker(null)}
          title={`تخصیص کمد هوشمند #${formatNum(assignModalLocker.number)}`}
          subtitle="یک ورزشکار حاضر در سالن را جهت تحویل کمد انتخاب نمایید:"
          icon={<KeyRound className="w-5 h-5 text-[var(--gym-brand,#10b981)]" />}
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1.5">
                انتخاب ورزشکار:
              </label>
              <select
                value={selectedStudentToAssign}
                onChange={(e) => setSelectedStudentToAssign(e.target.value)}
                className="w-full rounded-xl glass-subtle border border-[var(--gym-border)] px-3 py-2 text-[var(--gym-text)] bg-[var(--gym-surface)]"
              >
                <option value="" className="bg-stone-900 text-white">-- انتخاب کنید --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id} className="bg-stone-900 text-white">{s.fullName} ({s.phone})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--gym-border)]">
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={() => setAssignModalLocker(null)}
              >
                انصراف
              </GlassButton>
              <GlassButton
                variant="neon"
                size="sm"
                onClick={handleConfirmAssign}
                disabled={!selectedStudentToAssign}
              >
                ثبت و باز کردن درب کمد
              </GlassButton>
            </div>
          </div>
        </GlassModal>
      )}

      {/* ---------------------------------------------------- */}
      {/* ADD LOCKER MODAL */}
      {/* ---------------------------------------------------- */}
      {isAddModalOpen && (
        <GlassModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="افزودن کمد هوشمند جدید به باشگاه"
          subtitle="پیکربندی شماره کمد، بخش استقرار و پورت اتصال رله سخت‌افزاری"
          icon={<PlusCircle className="w-5 h-5 text-[var(--gym-brand,#10b981)]" />}
        >
          <form onSubmit={handleSaveNewLocker} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">
                  شماره کمد: *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newLockerNumber}
                  onChange={(e) => setNewLockerNumber(parseInt(e.target.value) || 1)}
                  className="w-full font-mono font-bold rounded-xl glass-subtle border border-[var(--gym-border)] px-3 py-2 text-[var(--gym-text)] focus:border-[var(--gym-brand,#10b981)] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">
                  پورت رله سخت‌افزار (Relay Port): *
                </label>
                <input
                  type="number"
                  min="1"
                  max="64"
                  required
                  value={newLockerRelay}
                  onChange={(e) => setNewLockerRelay(parseInt(e.target.value) || 1)}
                  className="w-full font-mono rounded-xl glass-subtle border border-[var(--gym-border)] px-3 py-2 text-[var(--gym-text)] focus:border-[var(--gym-brand,#10b981)] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">
                  بخش / زون استقرار کمد:
                </label>
                <select
                  value={newLockerZone}
                  onChange={(e) => setNewLockerZone(e.target.value as LockerZone)}
                  className="w-full rounded-xl glass-subtle border border-[var(--gym-border)] px-3 py-2 text-[var(--gym-text)] bg-[var(--gym-surface)]"
                >
                  <option value="general" className="bg-stone-900 text-white">{t.zoneGeneral}</option>
                  <option value="vip" className="bg-stone-900 text-white">{t.zoneVip}</option>
                  <option value="men" className="bg-stone-900 text-white">{t.zoneMen}</option>
                  <option value="women" className="bg-stone-900 text-white">{t.zoneWomen}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">
                  نوع قفل و محرک الکترونیکی:
                </label>
                <select
                  value={newLockerLockType}
                  onChange={(e) => setNewLockerLockType(e.target.value as any)}
                  className="w-full rounded-xl glass-subtle border border-[var(--gym-border)] px-3 py-2 text-[var(--gym-text)] bg-[var(--gym-surface)]"
                >
                  <option value="solenoid_12v" className="bg-stone-900 text-white">سولنوئید برقی 12 ولت (Solenoid)</option>
                  <option value="magnetic_lock" className="bg-stone-900 text-white">قفل مغناطیسی / مگنت (EM-Lock)</option>
                  <option value="motorized_bolt" className="bg-stone-900 text-white">قفل بولت موتوری (Motorized)</option>
                  <option value="rfid_embedded" className="bg-stone-900 text-white">قفل هوشمند مستقل RFID</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">
                وضعیت اولیه:
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-[var(--gym-text)] cursor-pointer">
                  <input
                    type="radio"
                    name="initialStatus"
                    checked={newLockerStatus === 'available'}
                    onChange={() => setNewLockerStatus('available')}
                    className="accent-[var(--gym-brand,#10b981)]"
                  />
                  <span>آماده و قابل تحویل به شاگرد</span>
                </label>
                <label className="flex items-center gap-2 text-[var(--gym-text)] cursor-pointer">
                  <input
                    type="radio"
                    name="initialStatus"
                    checked={newLockerStatus === 'maintenance'}
                    onChange={() => setNewLockerStatus('maintenance')}
                    className="accent-[var(--gym-brand,#10b981)]"
                  />
                  <span>در دست تعمیر / قفل فنی</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--gym-border)]">
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
              >
                انصراف
              </GlassButton>
              <GlassButton
                variant="neon"
                size="sm"
                type="submit"
              >
                ثبت و فعال‌سازی کمد
              </GlassButton>
            </div>
          </form>
        </GlassModal>
      )}

      {/* ---------------------------------------------------- */}
      {/* EDIT LOCKER MODAL */}
      {/* ---------------------------------------------------- */}
      {editingLocker && (
        <GlassModal
          isOpen={true}
          onClose={() => setEditingLocker(null)}
          title={`ویرایش مشخصات کمد #${formatNum(editingLocker.number)}`}
          subtitle="اصلاح زون استقرار، پورت رله کنترلر و نوع قفل"
          icon={<Edit3 className="w-5 h-5 text-cyan-400" />}
        >
          <form onSubmit={handleSaveEditLocker} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">
                  بخش / زون استقرار:
                </label>
                <select
                  value={newLockerZone}
                  onChange={(e) => setNewLockerZone(e.target.value as LockerZone)}
                  className="w-full rounded-xl glass-subtle border border-[var(--gym-border)] px-3 py-2 text-[var(--gym-text)] bg-[var(--gym-surface)]"
                >
                  <option value="general" className="bg-stone-900 text-white">{t.zoneGeneral}</option>
                  <option value="vip" className="bg-stone-900 text-white">{t.zoneVip}</option>
                  <option value="men" className="bg-stone-900 text-white">{t.zoneMen}</option>
                  <option value="women" className="bg-stone-900 text-white">{t.zoneWomen}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">
                  پورت رله کنترلر:
                </label>
                <input
                  type="number"
                  min="1"
                  max="64"
                  required
                  value={newLockerRelay}
                  onChange={(e) => setNewLockerRelay(parseInt(e.target.value) || 1)}
                  className="w-full font-mono rounded-xl glass-subtle border border-[var(--gym-border)] px-3 py-2 text-[var(--gym-text)] outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">
                  نوع قفل برقی:
                </label>
                <select
                  value={newLockerLockType}
                  onChange={(e) => setNewLockerLockType(e.target.value as any)}
                  className="w-full rounded-xl glass-subtle border border-[var(--gym-border)] px-3 py-2 text-[var(--gym-text)] bg-[var(--gym-surface)]"
                >
                  <option value="solenoid_12v" className="bg-stone-900 text-white">سولنوئید برقی 12 ولت (Solenoid)</option>
                  <option value="magnetic_lock" className="bg-stone-900 text-white">قفل مغناطیسی / مگنت (EM-Lock)</option>
                  <option value="motorized_bolt" className="bg-stone-900 text-white">قفل بولت موتوری (Motorized)</option>
                  <option value="rfid_embedded" className="bg-stone-900 text-white">قفل هوشمند مستقل RFID</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--gym-border)]">
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={() => setEditingLocker(null)}
              >
                انصراف
              </GlassButton>
              <GlassButton
                variant="secondary"
                size="sm"
                type="submit"
              >
                ذخیره تغییرات
              </GlassButton>
            </div>
          </form>
        </GlassModal>
      )}

      {/* ---------------------------------------------------- */}
      {/* DELETE CONFIRM MODAL */}
      {/* ---------------------------------------------------- */}
      {deleteConfirmLocker && (
        <GlassModal
          isOpen={true}
          onClose={() => setDeleteConfirmLocker(null)}
          title={`حذف کمد #${formatNum(deleteConfirmLocker.number)}`}
          subtitle="آیا از حذف این کمد و قطع ارتباط پورت رله آن اطمینان دارید؟"
          icon={<AlertTriangle className="w-5 h-5 text-rose-400" />}
          maxWidth="max-w-sm"
        >
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-center gap-2">
              <GlassButton
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => setDeleteConfirmLocker(null)}
              >
                انصراف
              </GlassButton>
              <GlassButton
                variant="secondary"
                size="sm"
                className="flex-1 !bg-rose-600 hover:!bg-rose-500 !text-white"
                onClick={() => {
                  deleteLocker(deleteConfirmLocker.id);
                  setDeleteConfirmLocker(null);
                }}
              >
                تایید و حذف
              </GlassButton>
            </div>
          </div>
        </GlassModal>
      )}

    </div>
  );
};
