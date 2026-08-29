import React, { useState } from 'react';
import { 
  Cpu, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Layers, 
  Wifi, 
  Server, 
  KeyRound, 
  RefreshCw,
  Info,
  Sliders,
  Check
} from 'lucide-react';
import { HardwareDevice, HardwareVendor, HardwareCapability, IntegrationMode } from '../../types';
import { ZKTecoAdapter } from '../../services/hardware/adapters/zktecoAdapter';
import { DiscoveryResult } from '../../services/hardware/hardwareTypes';
import { getAdapterForVendor } from '../../services/hardware/adapterRegistry';

interface DeviceDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceAdded: (device: HardwareDevice) => void;
}

export const DeviceDiscoveryModal: React.FC<DeviceDiscoveryModalProps> = ({
  isOpen,
  onClose,
  onDeviceAdded,
}) => {
  const [vendor, setVendor] = useState<HardwareVendor>('zkteco');
  const [familyHint, setFamilyHint] = useState<'auto' | 'speedface' | 'c3_controller' | 'inbio' | 'other'>('auto');
  const [deviceName, setDeviceName] = useState('ترمینال تشخیص چهره ZKTeco ورودی');
  const [ipAddress, setIpAddress] = useState('192.168.1.135');
  const [port, setPort] = useState(4370);
  const [protocol, setProtocol] = useState<'tcp_raw' | 'http_webhook' | 'websocket' | 'modbus_tcp'>('tcp_raw');
  const [commPassword, setCommPassword] = useState('');
  const [location, setLocation] = useState('گیت تردد اصلی ورودی سالن');
  
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunDiscovery = async () => {
    setIsDiscovering(true);
    setDiscoveryResult(null);
    setDiscoveryError(null);

    try {
      const adapter = getAdapterForVendor(vendor);
      const result = await adapter.discover({
        ipAddress,
        port: Number(port),
        protocol,
        commPassword,
        familyHint,
      });

      if (result.success) {
        setDiscoveryResult(result);
        if (result.model && !deviceName.includes(result.model)) {
          setDeviceName(`ترمینال ${result.model} (${location})`);
        }
      } else {
        setDiscoveryError(result.error || 'ارتباط با دستگاه ناموفق بود.');
      }
    } catch (err: any) {
      setDiscoveryError(err?.message || 'خطای سیستمی در اجرای پروتکل کشف سخت‌افزار.');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleSaveDevice = () => {
    if (!discoveryResult || !discoveryResult.success) return;

    const newDevice: HardwareDevice = {
      id: `dev-${vendor}-${Date.now().toString().slice(-6)}`,
      name: deviceName.trim() || `${discoveryResult.model} (${ipAddress})`,
      vendor,
      model: discoveryResult.model,
      type: discoveryResult.detectedCapabilities.includes('FACE') || discoveryResult.detectedCapabilities.includes('FACE_RECOGNITION')
        ? 'biometric_face' 
        : discoveryResult.detectedCapabilities.includes('RFID') 
        ? 'rfid_nfc' 
        : 'door_controller',
      status: 'online',
      ipAddress: discoveryResult.ipAddress,
      port: discoveryResult.port,
      protocol: discoveryResult.protocolUsed as any,
      lastPing: 'همین الان (متصل در حالت شنود)',
      location: location.trim() || 'گیت ورودی سالن',
      capabilities: discoveryResult.detectedCapabilities,
      adapter: vendor === 'zkteco' ? 'ZKTeco Push & Standalone Adapter' : `${vendor.toUpperCase()} Adapter`,
      latencyMs: discoveryResult.latencyMs,
      firmware: discoveryResult.firmware,
      serialNumber: discoveryResult.serial,
      macAddress: discoveryResult.macAddress,
      integrationMode: 'shadow', // Always start in SHADOW mode
    };

    onDeviceAdded(newDevice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                کشف و اتصال سخت‌افزار واقعی (Hardware Discovery)
              </h3>
              <p className="text-xs text-stone-500">
                پویش امن، شناسایی مدل واقعی، فریم‌ور و قابلیت‌های سخت‌افزار بدون تغییر در عملکرد موجود
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-stone-700 dark:text-stone-300">
          
          {/* Shadow Notice Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              <strong>حالت شنود امن (Shadow Mode):</strong> دستگاه‌های جدید در حالت شنود لاگ متصل می‌شوند. هیچ فرمانی برای بازگشایی فیزیکی گیت یا رله ارسال نخواهد شد و نرم‌افزار قدیمی به کار عادی خود ادامه می‌دهد.
            </div>
          </div>

          {/* Configuration Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-stone-800 dark:text-stone-200">سازنده (Vendor):</label>
              <select
                value={vendor}
                onChange={(e) => {
                  const v = e.target.value as HardwareVendor;
                  setVendor(v);
                  if (v === 'zkteco') {
                    setPort(4370);
                    setProtocol('tcp_raw');
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                <option value="zkteco">ZKTeco (SpeedFace / C3 Controller / Push)</option>
                <option value="hikvision">Hikvision (ISAPI / Terminals)</option>
                <option value="suprema">Suprema (BioStar / BioMini)</option>
                <option value="generic_relay">Generic Relay / ESP32 Modbus</option>
                <option value="generic_wiegand">Generic Wiegand-to-IP Bridge</option>
              </select>
            </div>

            {vendor === 'zkteco' && (
              <div>
                <label className="block font-semibold mb-1 text-stone-800 dark:text-stone-200">خانواده دستگاه (Device Family):</label>
                <select
                  value={familyHint}
                  onChange={(e) => setFamilyHint(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  <option value="auto">شناسایی خودکار (Auto Detect)</option>
                  <option value="speedface">SpeedFace Family (Face, RFID, Aux I/O)</option>
                  <option value="c3_controller">C3 Access Controller (C3-100/200/400)</option>
                  <option value="inbio">inBio Biometric Controller</option>
                  <option value="other">سایر پایانه‌های ZKTeco</option>
                </select>
              </div>
            )}

            <div>
              <label className="block font-semibold mb-1 text-stone-800 dark:text-stone-200">آدرس IP در شبکه محلی:</label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="مثال: 192.168.1.135"
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold mb-1 text-stone-800 dark:text-stone-200">پورت (Port):</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  placeholder="4370"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-stone-900 dark:text-stone-100"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-stone-800 dark:text-stone-200">پروتکل:</label>
                <select
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                >
                  <option value="tcp_raw">TCP Standalone (Port 4370)</option>
                  <option value="http_webhook">HTTP/HTTPS PUSH Webhook</option>
                  <option value="websocket">WebSocket Stream</option>
                  <option value="modbus_tcp">Modbus TCP</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-stone-800 dark:text-stone-200">کلید ارتباط / رمز دستگاه (اختیاری):</label>
              <input
                type="password"
                value={commPassword}
                onChange={(e) => setCommPassword(e.target.value)}
                placeholder="Comm Key / Password"
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-stone-800 dark:text-stone-200">موقعیت فیزیکی دستگاه:</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="مثال: گیت تردد ورودی سالن شماره ۱"
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          {/* Action: Discover Button */}
          <div className="pt-2">
            <button
              onClick={handleRunDiscovery}
              disabled={isDiscovering || !ipAddress}
              className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Search className={`h-4 w-4 ${isDiscovering ? 'animate-spin' : ''}`} />
              <span>{isDiscovering ? 'در حال پویش و برقراری ارتباط با پورت دستگاه...' : 'کشف دستگاه (Discover Device)'}</span>
            </button>
          </div>

          {/* Discovery Output - Success Result */}
          {discoveryResult && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span>دستگاه با موفقیت کشف شد (Connection Verified)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-bold">
                  تاخیر: {discoveryResult.latencyMs} ms
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px] bg-white/80 dark:bg-stone-900/80 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                <div>
                  <span className="text-stone-400 block">مدل شناسایی‌شده:</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">{discoveryResult.model}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">نسخه فریم‌ور (Firmware):</span>
                  <span className="font-mono text-stone-900 dark:text-stone-100">{discoveryResult.firmware}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">شماره سریال (Serial):</span>
                  <span className="font-mono text-stone-900 dark:text-stone-100">{discoveryResult.serial}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">آدرس MAC:</span>
                  <span className="font-mono text-stone-900 dark:text-stone-100">{discoveryResult.macAddress || 'Not Reported'}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">پروتکل فعال:</span>
                  <span className="font-mono uppercase text-stone-900 dark:text-stone-100">{discoveryResult.protocolUsed}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">حالت عملیاتی:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">شنود (SHADOW MODE)</span>
                </div>
              </div>

              {/* Detected Capabilities */}
              <div>
                <div className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-amber-500" />
                  <span>قابلیت‌های شناسایی‌شده بر روی سخت‌افزار ({discoveryResult.detectedCapabilities.length}):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {discoveryResult.detectedCapabilities.map(cap => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100/70 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Device Name input for hub */}
              <div>
                <label className="block font-semibold mb-1 text-stone-800 dark:text-stone-200">نام نمایشی در هاب سخت‌افزار:</label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-bold"
                />
              </div>
            </div>
          )}

          {/* Discovery Output - Failure Error */}
          {discoveryError && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold">
                <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>کشف دستگاه با شکست مواجه شد (Discovery Failed)</span>
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-relaxed font-mono">
                {discoveryError}
              </p>
              <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-2 space-y-1">
                <div>• اطمینان حاصل کنید کامپیوتر پذیرش و دستگاه در یک رنج شبکه (مانند 192.168.1.x) قرار دارند.</div>
                <div>• بررسی کنید پورت ۴۳۷۰ توسط فایروال محلی مسدود نشده باشد.</div>
                <div>• در صورت استفاده از پروتکل PUSH، آدرس سرور را در منوی دستگاه روی آی‌پی Gym OS تنظیم کنید.</div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 flex items-center justify-between">
          <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            <span>اتصال غیرمخرب بر اساس استاندارد ZKTeco PUSH / Standalone SDK</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 font-semibold"
            >
              انصراف
            </button>
            <button
              onClick={handleSaveDevice}
              disabled={!discoveryResult || !discoveryResult.success}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-stone-950 font-bold shadow-md shadow-amber-500/20 disabled:opacity-40 transition-all flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>ثبت دستگاه در حالت شنود (Save in Shadow Mode)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
