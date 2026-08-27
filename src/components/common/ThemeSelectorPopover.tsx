import React, { useState, useEffect, useRef } from 'react';
import { Palette, Check, Sparkles, Sun, Moon, Zap, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { THEMES_REGISTRY, ThemeEngineService } from '../../services/themeEngine';
import { ThemeKey, ThemeConfig } from '../../types';

interface ThemeSelectorPopoverProps {
  compact?: boolean;
}

export const ThemeSelectorPopover: React.FC<ThemeSelectorPopoverProps> = ({ compact = false }) => {
  const { activeThemeKey, setActiveThemeKey } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'dark' | 'light' | 'special'>('dark');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const allThemes = ThemeEngineService.getAllThemes();
  const currentTheme = THEMES_REGISTRY[activeThemeKey] || THEMES_REGISTRY.obsidian;

  const filteredThemes = allThemes.filter((t) => t.category === activeCategory);

  return (
    <div className="relative w-full" ref={popoverRef}>
      {/* Trigger Button at bottom of sidebar */}
      {compact ? (
        <div className="relative group flex justify-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-11 h-11 rounded-2xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-slate-200 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs relative"
            aria-label="تغییر تم و پوسته"
          >
            <div
              className="w-5 h-5 rounded-full border border-white/40 flex items-center justify-center shadow-xs"
              style={{ backgroundColor: currentTheme.colors.brand || currentTheme.colors.accent }}
            >
              <Palette className="w-3 h-3 text-slate-950" />
            </div>
            <span
              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-slate-900"
              style={{ backgroundColor: currentTheme.colors.brand }}
            />
          </button>

          {/* Tooltip for compact button in RTL */}
          <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 border border-slate-700 text-white text-xs font-medium rounded-xl shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap hidden sm:block">
            {currentTheme.nameFa} (پوسته)
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200 hover:text-white transition-all text-xs font-medium group cursor-pointer shadow-xs"
          title="تغییر تم و پوسته سامانه"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center shrink-0 shadow-xs"
              style={{ backgroundColor: currentTheme.colors.brand || currentTheme.colors.accent }}
            >
              <Palette className="w-3 h-3 text-slate-950" />
            </div>
            <div className="text-right truncate">
              <span className="block font-bold text-[12px] truncate">{currentTheme.nameFa}</span>
              <span className="block text-[10px] text-slate-400 font-mono">🎨 تغییر پوسته</span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentTheme.colors.brand }} />
          </div>
        </button>
      )}

      {/* Compact Floating Popover */}
      {isOpen && (
        <div
          className={`absolute bottom-full ${compact ? 'right-0 sm:right-auto sm:left-0' : 'right-0'} mb-3 w-80 sm:w-96 bg-slate-900/95 border border-slate-700/90 rounded-3xl shadow-2xl backdrop-blur-xl p-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200`}
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white">انتخاب پوسته و رنگ‌بندی</h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/60 rounded-xl my-3 border border-slate-800/80 text-[11px] font-bold">
            <button
              onClick={() => setActiveCategory('dark')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
                activeCategory === 'dark'
                  ? 'bg-slate-800 text-amber-300 shadow-xs border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Moon className="w-3 h-3" />
              <span>تیره (Dark)</span>
            </button>
            <button
              onClick={() => setActiveCategory('light')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
                activeCategory === 'light'
                  ? 'bg-slate-800 text-amber-300 shadow-xs border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3 h-3" />
              <span>روشن (Light)</span>
            </button>
            <button
              onClick={() => setActiveCategory('special')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
                activeCategory === 'special'
                  ? 'bg-slate-800 text-amber-300 shadow-xs border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>ویژه (VIP)</span>
            </button>
          </div>

          {/* Theme Miniature Preview Cards */}
          <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
            {filteredThemes.map((theme) => {
              const isSelected = activeThemeKey === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => {
                    setActiveThemeKey(theme.id);
                  }}
                  className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-150 relative overflow-hidden group ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400/30 bg-slate-800/90 shadow-md'
                      : 'border-slate-800/80 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'rgba(30, 41, 59, 0.9)' : undefined,
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-white truncate max-w-[110px]">
                      {theme.nameFa}
                    </span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-bold shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  {/* Miniature App Layout Preview */}
                  <div
                    className="w-full h-10 rounded-lg p-1 flex gap-1 border border-white/10 overflow-hidden"
                    style={{ backgroundColor: theme.colors.bg }}
                  >
                    {/* Mini Sidebar */}
                    <div
                      className="w-3.5 h-full rounded-xs flex flex-col gap-0.5 p-0.5"
                      style={{ backgroundColor: theme.colors.sidebarBg || theme.colors.surface }}
                    >
                      <div className="w-full h-1 rounded-xs" style={{ backgroundColor: theme.colors.brand }} />
                      <div className="w-full h-0.5 rounded-xs bg-white/20" />
                      <div className="w-full h-0.5 rounded-xs bg-white/20" />
                    </div>

                    {/* Mini Body */}
                    <div className="flex-1 flex flex-col justify-between p-0.5">
                      <div
                        className="w-full h-3 rounded-xs border border-white/10"
                        style={{ backgroundColor: theme.colors.surface }}
                      />
                      <div className="flex justify-between items-center">
                        <div className="w-5 h-1 rounded-xs bg-white/30" />
                        <div
                          className="w-2.5 h-2 rounded-xs"
                          style={{ backgroundColor: theme.colors.brand || theme.colors.accent }}
                        />
                      </div>
                    </div>
                  </div>

                  <span className="text-[9px] text-slate-400 font-mono mt-1.5 block truncate">
                    {theme.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
