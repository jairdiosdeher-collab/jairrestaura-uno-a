/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — SIDEBAR ENTERPRISE
 */

import React from 'react';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Sparkles,
  BookOpenCheck,
  FileSignature,
  CalendarClock,
  FileSearch,
  ReceiptText,
  ShieldAlert,
  Scale,
  Building2,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  terminosCount?: number;
  expedientesCount?: number;
  organizacionNombre: string;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  terminosCount = 0,
  expedientesCount = 0,
  organizacionNombre,
  isDarkMode = true,
  onToggleDarkMode,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
    { id: 'clientes', label: 'Clientes & Habeas Data', icon: Users },
    { id: 'expedientes', label: 'Expedientes & Casos', icon: FolderKanban, badge: expedientesCount },
    { id: 'asistente_ia', label: 'Asistente Jurídico IA', icon: Sparkles, highlight: true },
    { id: 'investigacion', label: 'Investigación Oficial', icon: BookOpenCheck },
    { id: 'redaccion', label: 'Redacción Documental', icon: FileSignature },
    { id: 'terminos', label: 'Control de Términos', icon: CalendarClock, badge: terminosCount },
    { id: 'analisis_documentos', label: 'Análisis Documental', icon: FileSearch },
    { id: 'honorarios', label: 'Gestión & Honorarios', icon: ReceiptText },
    { id: 'seguridad', label: 'Seguridad & Auditoría', icon: ShieldAlert },
  ];

  return (
    <aside className="w-64 shrink-0 flex flex-col h-screen border-r border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-sm shadow-amber-500/20 shrink-0">
            <Scale className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
              JAIRRESTAURA UNO A
            </h1>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium tracking-tight">
              Asistente Jurídico Inteligente
            </p>
          </div>
        </div>

        <p className="mt-2.5 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 italic">
          “Más claridad jurídica. Mejor organización. Decisiones fundamentadas.”
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive
                      ? 'text-amber-400 dark:text-slate-950'
                      : item.highlight
                      ? 'text-amber-500 dark:text-amber-400'
                      : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {typeof item.badge === 'number' && item.badge > 0 && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-mono rounded-md ${
                    isActive
                      ? 'bg-slate-800 text-amber-300 dark:bg-slate-900 dark:text-amber-400'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Theme Switcher and Organization Badge Footer */}
      <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 space-y-2.5">
        {onToggleDarkMode && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Tema Visual:
            </span>
            <div className="flex items-center p-0.5 bg-slate-200 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => { if (isDarkMode) onToggleDarkMode(); }}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-all ${
                  !isDarkMode
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                <Sun className={`w-3 h-3 ${!isDarkMode ? 'text-amber-500' : ''}`} />
                <span>Claro</span>
              </button>
              <button
                type="button"
                onClick={() => { if (!isDarkMode) onToggleDarkMode(); }}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-all ${
                  isDarkMode
                    ? 'bg-slate-950 text-amber-300 shadow-sm font-bold border border-amber-500/20'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                <Moon className={`w-3 h-3 ${isDarkMode ? 'text-amber-400' : ''}`} />
                <span>Oscuro</span>
              </button>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 mb-0.5">
            <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-[11px] font-semibold truncate">{organizacionNombre}</span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Jurisdicción: Colombia · Ley 1581 / Ley 1123
          </p>
        </div>
      </div>
    </aside>
  );
};
