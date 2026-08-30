import { ThemeConfig, ThemeKey } from '../types';

export const THEMES_REGISTRY: Record<ThemeKey, ThemeConfig> = {
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Neon',
    nameFa: 'ابسیدین نئون (تیره استاندارد)',
    category: 'dark',
    colors: {
      bg: '#0c0e12',
      surface: '#151921',
      surfaceGlass: 'rgba(21, 25, 33, 0.75)',
      surfaceGlassStrong: 'rgba(27, 33, 44, 0.90)',
      border: 'rgba(255, 255, 255, 0.08)',
      borderStrong: 'rgba(16, 185, 129, 0.35)',
      text: '#f3f4f6',
      textMuted: '#9ca3af',
      brand: '#10b981',
      brandSoft: 'rgba(16, 185, 129, 0.15)',
      neon: '#10b981',
      accent: '#34d399',
      glow: '0 0 20px rgba(16, 185, 129, 0.25)',
      sidebarBg: '#11141a',
      cardBg: '#161a22',
      buttonBg: '#10b981',
      buttonText: '#ffffff',
    },
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Cyan',
    nameFa: 'آبی نیمه‌شب نئونی',
    category: 'dark',
    colors: {
      bg: '#080d1a',
      surface: '#0f172a',
      surfaceGlass: 'rgba(15, 23, 42, 0.78)',
      surfaceGlassStrong: 'rgba(30, 41, 59, 0.92)',
      border: 'rgba(56, 189, 248, 0.15)',
      borderStrong: 'rgba(56, 189, 248, 0.40)',
      text: '#f8fafc',
      textMuted: '#94a3b8',
      brand: '#0ea5e9',
      brandSoft: 'rgba(14, 165, 233, 0.15)',
      neon: '#38bdf8',
      accent: '#0284c7',
      glow: '0 0 22px rgba(56, 189, 248, 0.30)',
      sidebarBg: '#0b1120',
      cardBg: '#111c33',
      buttonBg: '#0ea5e9',
      buttonText: '#ffffff',
    },
  },
  purple: {
    id: 'purple',
    name: 'Cyber Purple',
    nameFa: 'بنفش سایبرپانک',
    category: 'dark',
    colors: {
      bg: '#0f0a1c',
      surface: '#1b122e',
      surfaceGlass: 'rgba(27, 18, 46, 0.80)',
      surfaceGlassStrong: 'rgba(39, 25, 68, 0.92)',
      border: 'rgba(168, 85, 247, 0.20)',
      borderStrong: 'rgba(192, 132, 252, 0.45)',
      text: '#faf5ff',
      textMuted: '#a855f7',
      brand: '#a855f7',
      brandSoft: 'rgba(168, 85, 247, 0.18)',
      neon: '#c084fc',
      accent: '#9333ea',
      glow: '0 0 24px rgba(192, 132, 252, 0.35)',
      sidebarBg: '#140c24',
      cardBg: '#1e1436',
      buttonBg: '#a855f7',
      buttonText: '#ffffff',
    },
  },
  emerald: {
    id: 'emerald',
    name: 'Bio Emerald',
    nameFa: 'سبز زمردی بیو',
    category: 'dark',
    colors: {
      bg: '#06130e',
      surface: '#0d221a',
      surfaceGlass: 'rgba(13, 34, 26, 0.80)',
      surfaceGlassStrong: 'rgba(18, 48, 37, 0.92)',
      border: 'rgba(52, 211, 153, 0.18)',
      borderStrong: 'rgba(52, 211, 153, 0.45)',
      text: '#ecfdf5',
      textMuted: '#6ee7b7',
      brand: '#059669',
      brandSoft: 'rgba(5, 150, 105, 0.20)',
      neon: '#34d399',
      accent: '#10b981',
      glow: '0 0 22px rgba(52, 211, 153, 0.30)',
      sidebarBg: '#091c15',
      cardBg: '#102b21',
      buttonBg: '#10b981',
      buttonText: '#ffffff',
    },
  },
  rose: {
    id: 'rose',
    name: 'Ruby Rose',
    nameFa: 'یاقوتی سرخ نئون',
    category: 'dark',
    colors: {
      bg: '#14080b',
      surface: '#240f16',
      surfaceGlass: 'rgba(36, 15, 22, 0.80)',
      surfaceGlassStrong: 'rgba(51, 20, 31, 0.92)',
      border: 'rgba(244, 63, 94, 0.20)',
      borderStrong: 'rgba(251, 113, 133, 0.45)',
      text: '#fff1f2',
      textMuted: '#fda4af',
      brand: '#e11d48',
      brandSoft: 'rgba(225, 29, 72, 0.18)',
      neon: '#fb7185',
      accent: '#f43f5e',
      glow: '0 0 22px rgba(251, 113, 133, 0.32)',
      sidebarBg: '#1c0b11',
      cardBg: '#2a111a',
      buttonBg: '#e11d48',
      buttonText: '#ffffff',
    },
  },
  cyan: {
    id: 'cyan',
    name: 'Electric Cyan',
    nameFa: 'فیروزه‌ای الکتریک',
    category: 'dark',
    colors: {
      bg: '#041217',
      surface: '#08232c',
      surfaceGlass: 'rgba(8, 35, 44, 0.80)',
      surfaceGlassStrong: 'rgba(12, 49, 61, 0.92)',
      border: 'rgba(34, 211, 238, 0.20)',
      borderStrong: 'rgba(34, 211, 238, 0.45)',
      text: '#ecfeff',
      textMuted: '#67e8f9',
      brand: '#0891b2',
      brandSoft: 'rgba(8, 145, 178, 0.20)',
      neon: '#22d3ee',
      accent: '#06b6d4',
      glow: '0 0 22px rgba(34, 211, 238, 0.32)',
      sidebarBg: '#061a21',
      cardBg: '#0a2c38',
      buttonBg: '#06b6d4',
      buttonText: '#ffffff',
    },
  },
  pearl: {
    id: 'pearl',
    name: 'Pearl Clean',
    nameFa: 'مرواریدی روشن (استاندارد)',
    category: 'light',
    colors: {
      bg: '#f8fafc',
      surface: '#ffffff',
      surfaceGlass: 'rgba(255, 255, 255, 0.85)',
      surfaceGlassStrong: 'rgba(255, 255, 255, 0.95)',
      border: 'rgba(226, 232, 240, 0.8)',
      borderStrong: 'rgba(59, 130, 246, 0.35)',
      text: '#0f172a',
      textMuted: '#64748b',
      brand: '#2563eb',
      brandSoft: 'rgba(37, 99, 235, 0.10)',
      neon: '#3b82f6',
      accent: '#1d4ed8',
      glow: '0 0 16px rgba(59, 130, 246, 0.18)',
      sidebarBg: '#ffffff',
      cardBg: '#ffffff',
      buttonBg: '#2563eb',
      buttonText: '#ffffff',
    },
  },
  ice: {
    id: 'ice',
    name: 'Ice Crystal',
    nameFa: 'کریستال یخی روشن',
    category: 'light',
    colors: {
      bg: '#f0f9ff',
      surface: '#ffffff',
      surfaceGlass: 'rgba(255, 255, 255, 0.85)',
      surfaceGlassStrong: 'rgba(240, 249, 255, 0.95)',
      border: 'rgba(186, 230, 253, 0.7)',
      borderStrong: 'rgba(14, 165, 233, 0.4)',
      text: '#0c4a6e',
      textMuted: '#0369a1',
      brand: '#0284c7',
      brandSoft: 'rgba(2, 132, 199, 0.12)',
      neon: '#0ea5e9',
      accent: '#0369a1',
      glow: '0 0 16px rgba(14, 165, 233, 0.20)',
      sidebarBg: '#f8fcff',
      cardBg: '#ffffff',
      buttonBg: '#0284c7',
      buttonText: '#ffffff',
    },
  },
  mint: {
    id: 'mint',
    name: 'Fresh Mint',
    nameFa: 'نعنایی ملایم روشن',
    category: 'light',
    colors: {
      bg: '#f0fdf4',
      surface: '#ffffff',
      surfaceGlass: 'rgba(255, 255, 255, 0.85)',
      surfaceGlassStrong: 'rgba(240, 253, 244, 0.95)',
      border: 'rgba(187, 247, 208, 0.7)',
      borderStrong: 'rgba(16, 185, 129, 0.4)',
      text: '#064e3b',
      textMuted: '#047857',
      brand: '#059669',
      brandSoft: 'rgba(5, 150, 105, 0.12)',
      neon: '#10b981',
      accent: '#047857',
      glow: '0 0 16px rgba(16, 185, 129, 0.20)',
      sidebarBg: '#f6fef9',
      cardBg: '#ffffff',
      buttonBg: '#059669',
      buttonText: '#ffffff',
    },
  },
  rose_light: {
    id: 'rose_light',
    name: 'Rose Quartz',
    nameFa: 'کوارتز صورتی روشن',
    category: 'light',
    colors: {
      bg: '#fff1f2',
      surface: '#ffffff',
      surfaceGlass: 'rgba(255, 255, 255, 0.85)',
      surfaceGlassStrong: 'rgba(255, 241, 242, 0.95)',
      border: 'rgba(254, 205, 211, 0.7)',
      borderStrong: 'rgba(244, 63, 94, 0.4)',
      text: '#881337',
      textMuted: '#be123c',
      brand: '#e11d48',
      brandSoft: 'rgba(225, 29, 72, 0.12)',
      neon: '#f43f5e',
      accent: '#be123c',
      glow: '0 0 16px rgba(244, 63, 94, 0.20)',
      sidebarBg: '#fff7f8',
      cardBg: '#ffffff',
      buttonBg: '#e11d48',
      buttonText: '#ffffff',
    },
  },
  sand: {
    id: 'sand',
    name: 'Sahara Sand',
    nameFa: 'شنی صحرایی گرم',
    category: 'light',
    colors: {
      bg: '#fdfbf7',
      surface: '#ffffff',
      surfaceGlass: 'rgba(255, 255, 255, 0.85)',
      surfaceGlassStrong: 'rgba(254, 252, 248, 0.95)',
      border: 'rgba(231, 225, 214, 0.8)',
      borderStrong: 'rgba(217, 119, 6, 0.4)',
      text: '#451a03',
      textMuted: '#78350f',
      brand: '#d97706',
      brandSoft: 'rgba(217, 119, 6, 0.12)',
      neon: '#f59e0b',
      accent: '#b45309',
      glow: '0 0 16px rgba(245, 158, 11, 0.20)',
      sidebarBg: '#faf6ee',
      cardBg: '#ffffff',
      buttonBg: '#d97706',
      buttonText: '#ffffff',
    },
  },
  lavender: {
    id: 'lavender',
    name: 'Soft Lavender',
    nameFa: 'اسطوخودوس روشن',
    category: 'light',
    colors: {
      bg: '#faf5ff',
      surface: '#ffffff',
      surfaceGlass: 'rgba(255, 255, 255, 0.85)',
      surfaceGlassStrong: 'rgba(250, 245, 255, 0.95)',
      border: 'rgba(233, 213, 255, 0.75)',
      borderStrong: 'rgba(168, 85, 247, 0.4)',
      text: '#3b0764',
      textMuted: '#6b21a8',
      brand: '#9333ea',
      brandSoft: 'rgba(147, 51, 234, 0.12)',
      neon: '#a855f7',
      accent: '#7e22ce',
      glow: '0 0 16px rgba(168, 85, 247, 0.20)',
      sidebarBg: '#fbf7ff',
      cardBg: '#ffffff',
      buttonBg: '#9333ea',
      buttonText: '#ffffff',
    },
  },
  oled: {
    id: 'oled',
    name: 'OLED Pure Black',
    nameFa: 'مشکی مطلق اولد (OLED)',
    category: 'special',
    colors: {
      bg: '#000000',
      surface: '#080808',
      surfaceGlass: 'rgba(10, 10, 10, 0.85)',
      surfaceGlassStrong: 'rgba(15, 15, 15, 0.95)',
      border: 'rgba(255, 255, 255, 0.12)',
      borderStrong: 'rgba(255, 255, 255, 0.50)',
      text: '#ffffff',
      textMuted: '#a3a3a3',
      brand: '#00e5ff',
      brandSoft: 'rgba(0, 229, 255, 0.15)',
      neon: '#00e5ff',
      accent: '#ffffff',
      glow: '0 0 24px rgba(0, 229, 255, 0.40)',
      sidebarBg: '#030303',
      cardBg: '#0a0a0a',
      buttonBg: '#00e5ff',
      buttonText: '#000000',
    },
  },
  carbon: {
    id: 'carbon',
    name: 'Carbon Gold',
    nameFa: 'کربن ذغالی و طلایی',
    category: 'special',
    colors: {
      bg: '#121214',
      surface: '#1a1a1e',
      surfaceGlass: 'rgba(26, 26, 30, 0.82)',
      surfaceGlassStrong: 'rgba(34, 34, 40, 0.94)',
      border: 'rgba(234, 179, 8, 0.22)',
      borderStrong: 'rgba(234, 179, 8, 0.55)',
      text: '#fef08a',
      textMuted: '#ca8a04',
      brand: '#eab308',
      brandSoft: 'rgba(234, 179, 8, 0.18)',
      neon: '#facc15',
      accent: '#ca8a04',
      glow: '0 0 22px rgba(250, 204, 21, 0.35)',
      sidebarBg: '#151518',
      cardBg: '#1d1d22',
      buttonBg: '#eab308',
      buttonText: '#121214',
    },
  },
  glass_neon: {
    id: 'glass_neon',
    name: 'Hyper Glass Neon',
    nameFa: 'شیشه‌ای هایپر نئون (VIP)',
    category: 'special',
    colors: {
      bg: '#090d16',
      surface: '#111827',
      surfaceGlass: 'rgba(17, 24, 39, 0.65)',
      surfaceGlassStrong: 'rgba(31, 41, 55, 0.85)',
      border: 'rgba(255, 255, 255, 0.18)',
      borderStrong: 'rgba(56, 189, 248, 0.50)',
      text: '#f0fdfa',
      textMuted: '#5eead4',
      brand: '#14b8a6',
      brandSoft: 'rgba(20, 184, 166, 0.22)',
      neon: '#2dd4bf',
      accent: '#06b6d4',
      glow: '0 0 28px rgba(45, 212, 191, 0.40)',
      sidebarBg: 'rgba(10, 15, 28, 0.80)',
      cardBg: 'rgba(17, 24, 39, 0.70)',
      buttonBg: '#14b8a6',
      buttonText: '#ffffff',
    },
  },
  graphite: {
    id: 'graphite',
    name: 'Graphite Titanium',
    nameFa: 'گرافیت تیتانیوم مات',
    category: 'special',
    colors: {
      bg: '#18191c',
      surface: '#222328',
      surfaceGlass: 'rgba(34, 35, 40, 0.85)',
      surfaceGlassStrong: 'rgba(42, 44, 50, 0.95)',
      border: 'rgba(255, 255, 255, 0.12)',
      borderStrong: 'rgba(148, 163, 184, 0.45)',
      text: '#f8fafc',
      textMuted: '#94a3b8',
      brand: '#64748b',
      brandSoft: 'rgba(100, 116, 139, 0.20)',
      neon: '#94a3b8',
      accent: '#cbd5e1',
      glow: '0 0 20px rgba(148, 163, 184, 0.30)',
      sidebarBg: '#1c1d22',
      cardBg: '#25262c',
      buttonBg: '#64748b',
      buttonText: '#ffffff',
    },
  },
};

export class ThemeEngineService {
  private static currentThemeKey: ThemeKey = 'obsidian';

  static getTheme(key: ThemeKey): ThemeConfig {
    return THEMES_REGISTRY[key] || THEMES_REGISTRY.obsidian;
  }

  static getAllThemes(): ThemeConfig[] {
    return Object.values(THEMES_REGISTRY);
  }

  static applyTheme(key: ThemeKey): void {
    const config = this.getTheme(key);
    this.currentThemeKey = key;

    const root = document.documentElement;
    const isDark = config.category === 'dark' || config.category === 'special';

    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    // Set CSS Custom Properties on :root
    root.style.setProperty('--gym-bg', config.colors.bg);
    root.style.setProperty('--gym-bg-secondary', config.colors.sidebarBg || config.colors.surface);
    root.style.setProperty('--gym-surface', config.colors.surface);
    root.style.setProperty('--gym-surface-soft', config.colors.surfaceGlass);
    root.style.setProperty('--gym-surface-strong', config.colors.surfaceGlassStrong);
    root.style.setProperty('--gym-surface-glass', config.colors.surfaceGlass);
    root.style.setProperty('--gym-surface-glass-strong', config.colors.surfaceGlassStrong);
    root.style.setProperty('--gym-border', config.colors.border);
    root.style.setProperty('--gym-border-strong', config.colors.borderStrong);
    root.style.setProperty('--gym-text', config.colors.text);
    root.style.setProperty('--gym-text-secondary', isDark ? '#d1d5db' : '#334155');
    root.style.setProperty('--gym-text-muted', config.colors.textMuted);
    root.style.setProperty('--gym-brand', config.colors.brand);
    root.style.setProperty('--gym-brand-soft', config.colors.brandSoft);
    root.style.setProperty('--gym-accent', config.colors.accent);
    root.style.setProperty('--gym-neon', config.colors.neon);
    root.style.setProperty('--gym-neon-soft', config.colors.brandSoft);
    root.style.setProperty('--gym-success', isDark ? '#10b981' : '#059669');
    root.style.setProperty('--gym-warning', isDark ? '#f59e0b' : '#d97706');
    root.style.setProperty('--gym-danger', isDark ? '#f43f5e' : '#e11d48');
    root.style.setProperty('--gym-info', isDark ? '#06b6d4' : '#0284c7');
    root.style.setProperty('--gym-shadow', isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.35)' : '0 8px 30px 0 rgba(0, 0, 0, 0.08)');
    root.style.setProperty('--gym-glow', config.colors.glow);

    // Compatibility aliases
    root.style.setProperty('--theme-bg', config.colors.bg);
    root.style.setProperty('--theme-surface', config.colors.surface);
    root.style.setProperty('--theme-surface-glass', config.colors.surfaceGlass);
    root.style.setProperty('--theme-surface-glass-strong', config.colors.surfaceGlassStrong);
    root.style.setProperty('--theme-border', config.colors.border);
    root.style.setProperty('--theme-border-strong', config.colors.borderStrong);
    root.style.setProperty('--theme-text', config.colors.text);
    root.style.setProperty('--theme-text-muted', config.colors.textMuted);
    root.style.setProperty('--theme-brand', config.colors.brand);
    root.style.setProperty('--theme-brand-soft', config.colors.brandSoft);
    root.style.setProperty('--theme-neon', config.colors.neon);
    root.style.setProperty('--theme-accent', config.colors.accent);
    root.style.setProperty('--theme-glow', config.colors.glow);
    root.style.setProperty('--theme-sidebar-bg', config.colors.sidebarBg);
    root.style.setProperty('--theme-card-bg', config.colors.cardBg);

    localStorage.setItem('gym_os_theme_key', key);
    localStorage.setItem('gym_theme_key', key);
    localStorage.setItem('gym_os_theme', isDark ? 'dark' : 'light');
    localStorage.setItem('gym_theme', isDark ? 'dark' : 'light');
  }

  static getInitialTheme(): ThemeKey {
    const saved = (localStorage.getItem('gym_os_theme_key') || localStorage.getItem('gym_theme_key')) as ThemeKey;
    if (saved && THEMES_REGISTRY[saved]) {
      return saved;
    }
    const legacyTheme = localStorage.getItem('gym_os_theme') || localStorage.getItem('gym_theme');
    if (legacyTheme === 'light') return 'pearl';
    return 'obsidian';
  }
}
