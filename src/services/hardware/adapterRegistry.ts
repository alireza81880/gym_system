import { HardwareVendor } from '../../types';
import { HardwareAdapter } from './hardwareTypes';
import { ZKTecoAdapter } from './adapters/zktecoAdapter';
import { HikvisionAdapter } from './adapters/hikvisionAdapter';
import { SupremaAdapter } from './adapters/supremaAdapter';
import { GenericRelayAdapter } from './adapters/genericRelayAdapter';
import { GenericWiegandAdapter } from './adapters/genericWiegandAdapter';
import { SimulatorAdapter } from './adapters/simulatorAdapter';

export class AdapterRegistry {
  private static instance: AdapterRegistry;
  private adapters: Map<string, HardwareAdapter> = new Map();

  private constructor() {
    this.registerDefaults();
  }

  public static getInstance(): AdapterRegistry {
    if (!AdapterRegistry.instance) {
      AdapterRegistry.instance = new AdapterRegistry();
    }
    return AdapterRegistry.instance;
  }

  private registerDefaults() {
    this.register('zkteco', new ZKTecoAdapter());
    this.register('hikvision', new HikvisionAdapter());
    this.register('suprema', new SupremaAdapter());
    this.register('generic_relay', new GenericRelayAdapter());
    this.register('generic_wiegand', new GenericWiegandAdapter());
    this.register('simulator', new SimulatorAdapter());
  }

  public register(key: string, adapter: HardwareAdapter): void {
    this.adapters.set(key.toLowerCase(), adapter);
  }

  public getAdapter(vendorOrKey: string): HardwareAdapter {
    const key = vendorOrKey.toLowerCase();
    const adapter = this.adapters.get(key);
    if (adapter) return adapter;

    // Fallbacks
    if (key.includes('zk')) return this.adapters.get('zkteco')!;
    if (key.includes('hik')) return this.adapters.get('hikvision')!;
    if (key.includes('suprem')) return this.adapters.get('suprema')!;
    if (key.includes('sim')) return this.adapters.get('simulator')!;
    if (key.includes('wiegand')) return this.adapters.get('generic_wiegand')!;

    return this.adapters.get('generic_relay')!;
  }

  public getAllAdapters(): HardwareAdapter[] {
    return Array.from(this.adapters.values());
  }

  public getSupportedVendors(): { vendor: HardwareVendor; name: string; adapterId: string }[] {
    return [
      { vendor: 'zkteco', name: 'ZKTeco (Face / Fingerprint / RFID)', adapterId: 'zkteco_standalone_v1' },
      { vendor: 'hikvision', name: 'Hikvision ISAPI Terminal', adapterId: 'hikvision_isapi_v2' },
      { vendor: 'suprema', name: 'Suprema BioStar', adapterId: 'suprema_biostar_v2' },
      { vendor: 'generic_relay', name: 'Multi-Channel Locker Relay (Modbus / ESP32)', adapterId: 'generic_relay_locker_v1' },
      { vendor: 'generic_wiegand', name: 'Generic Wiegand-to-IP Gateway', adapterId: 'generic_wiegand_v1' },
    ];
  }
}

// Convenient export of singleton
export const adapterRegistryInstance = AdapterRegistry.getInstance();

export function getAdapterForVendor(vendor: HardwareVendor): HardwareAdapter {
  return adapterRegistryInstance.getAdapter(vendor);
}
