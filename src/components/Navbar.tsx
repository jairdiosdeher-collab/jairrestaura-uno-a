/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — NAVBAR ENTERPRISE
 */

import React from 'react';
import { 
  Scale, 
  Sun, 
  Moon, 
  ShieldCheck, 
  UserCheck, 
  Clock, 
  Plus, 
  Search,
  Sparkles
} from 'lucide-react';
import type { Usuario } from '../types/legal';

interface NavbarProps {
  currentView: string;
  usuarioActivo: Usuario;
  usuariosDisponibles: Usuario[];
  onSwitchUser: (userId: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onQuickAction: (action: string) => void;
  terminosCriticosCount: number;
}

const VIEW_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Panel Principal', subtitle: 'Resumen gerencial de expedientes y actuaciones' },
  clientes: { title: 'Directorio de Clientes', subtitle: 'Personas naturales, jurídicas y Habeas Data Ley 1581' },
  expedientes: { title: 'Gestión de Expedientes', subtitle: 'Seguimiento procesal y actuaciones judiciales' },
  asistente_ia: { title: 'Asistente Jurídico IA', subtitle: 'Análisis fáctico, subsunción e interrogatorio' },
  investigacion: { title: 'Investigación Jurídica', subtitle: 'SUIN-Juriscol, Relatorías y Rama Judicial' },
  redaccion: { title: 'Redacción Documental', subtitle: 'Borradores de tutelas, peticiones, poderes y contratos' },
  terminos: { title: 'Control de Términos & Agenda', subtitle: 'Cómputo en días hábiles conforme al CGP y Ley 2213' },
  analisis_documentos: { title: 'Análisis Documental', subtitle: 'Auditoría de riesgos, obligaciones y contradicciones' },
  honorarios: { title: 'Gestión y Honorarios', subtitle: 'Control de acuerdos, cuota litis, anticipos y gastos' },
  seguridad: { title: 'Seguridad y Auditoría', subtitle: 'Bitácora inmutable y control de acceso RBAC' },
};

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  usuarioActivo,
  usuariosDisponibles,
  onSwitchUser,
  isDarkMode,
  onToggleDarkMode,
  onQuickAction,
  terminosCriticosCount,
}) => {
  const info = VIEW_TITLES[currentView] || { title: 'JAIRRESTAURA UNO A', subtitle: 'Plataforma Jurídica Inteligente' };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors">
      {/* Zone 1: Breadcrumb y Título de vista */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>JAIRRESTAURA UNO A</span>
            <span aria-hidden="true">/</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">{info.title}</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block truncate">
            {info.subtitle}
          </p>
        </div>
      </div>

      {/* Zone 2: Controles rápidos e información de términos */}
      <div className="flex items-center gap-3">
        {terminosCriticosCount > 0 && (
          <button
            onClick={() => onQuickAction('ver_terminos')}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-md hover:bg-amber-100 transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{terminosCriticosCount} términos de atención prioritaria</span>
          </button>
        )}

        {/* Selector de Usuario / Rol activo */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <div className="text-left hidden lg:block">
            <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100 leading-none">
              {usuarioActivo.nombre}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              {usuarioActivo.rol}
            </span>
          </div>
          <select
            value={usuarioActivo.id}
            onChange={(e) => onSwitchUser(e.target.value)}
            className="text-xs bg-transparent border-0 text-slate-700 dark:text-slate-300 font-medium focus:ring-0 cursor-pointer outline-none"
            title="Cambiar perfil de usuario para pruebas"
          >
            {usuariosDisponibles.map((u) => (
              <option key={u.id} value={u.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                {u.nombre} ({u.rol})
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Modo Claro / Modo Oscuro */}
        <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs shrink-0">
          <button
            type="button"
            onClick={() => { if (isDarkMode) onToggleDarkMode(); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
              !isDarkMode
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
            }`}
            title="Activar Modo Claro"
          >
            <Sun className={`w-3.5 h-3.5 ${!isDarkMode ? 'text-amber-500' : 'text-slate-400'}`} />
            <span className="text-xs">Claro</span>
          </button>

          <button
            type="button"
            onClick={() => { if (!isDarkMode) onToggleDarkMode(); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
              isDarkMode
                ? 'bg-slate-950 text-amber-300 shadow-sm font-bold border border-amber-500/20'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
            }`}
            title="Activar Modo Oscuro"
          >
            <Moon className={`w-3.5 h-3.5 ${isDarkMode ? 'text-amber-400' : 'text-slate-400'}`} />
            <span className="text-xs">Oscuro</span>
          </button>
        </div>

        {/* Botón de Acción Primaria */}
        <button
          onClick={() => onQuickAction('nuevo_expediente')}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo Expediente</span>
        </button>
      </div>
    </header>
  );
};
