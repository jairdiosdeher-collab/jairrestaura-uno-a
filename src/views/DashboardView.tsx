/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — DASHBOARD VIEW
 */

import React from 'react';
import {
  FolderKanban,
  Users,
  CalendarClock,
  FileSignature,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Plus,
} from 'lucide-react';
import type { Expediente, TerminoAgenda, RegistroAuditoria } from '../types/legal';

interface DashboardViewProps {
  stats: {
    totalClientes: number;
    expedientesActivos: number;
    terminosPendientesTotal: number;
    terminosCriticosTotal: number;
    totalDocumentos: number;
    totalHonorariosPactados: number;
    totalHonorariosRecaudados: number;
    saldoPorCobrar: number;
  };
  proximosTerminos: TerminoAgenda[];
  expedientesRecientes: Expediente[];
  actividadReciente: RegistroAuditoria[];
  onNavigate: (view: string, contextId?: string) => void;
  onQuickAction: (action: string) => void;
  onConfirmTerm: (termId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  proximosTerminos,
  expedientesRecientes,
  actividadReciente,
  onNavigate,
  onQuickAction,
  onConfirmTerm,
}) => {
  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Hero Banner Visual con Imagen Generada y Acciones Rápidas */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white shadow-sm">
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/jairrestaura_legal_banner_1793234554784.jpg"
            alt="Despacho Jurídico JairRestaura Uno A"
            className="w-full h-full object-cover opacity-20 filter contrast-125"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
        </div>

        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-medium text-amber-400 mb-2">
              <Sparkles className="w-4 h-4" />
              <span>SaaS Jurídico Enterprise para el Ordenamiento Procesal Colombiano</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              JAIRRESTAURA UNO A
            </h2>
            <p className="mt-1 text-sm text-slate-300 leading-relaxed">
              “Más claridad jurídica. Mejor organización. Decisiones fundamentadas.”
              Consola unificada de expedientes, cómputo estricto de términos procesales y asistencia IA bajo supervisión del abogado titular.
            </p>
          </div>

          {/* 4 Acciones Rápidas Obligatorias */}
          <div className="grid grid-cols-2 gap-2.5 shrink-0">
            <button
              onClick={() => onQuickAction('nuevo_cliente')}
              className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/10 backdrop-blur-sm transition-all"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Crear Cliente</span>
            </button>
            <button
              onClick={() => onQuickAction('nuevo_expediente')}
              className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg shadow-sm transition-all"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Abrir Expediente</span>
            </button>
            <button
              onClick={() => onNavigate('redaccion')}
              className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/10 backdrop-blur-sm transition-all"
            >
              <FileSignature className="w-3.5 h-3.5 text-amber-400" />
              <span>Redactar Escrito</span>
            </button>
            <button
              onClick={() => onNavigate('asistente_ia')}
              className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg backdrop-blur-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Consulta con IA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Indicadores Cuantitativos Reales (Sin cifras ficticias) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Expedientes Activos */}
        <div 
          onClick={() => onNavigate('expedientes')}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Expedientes Activos</span>
            <FolderKanban className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {stats.expedientesActivos}
            </span>
            <span className="text-xs text-slate-400">en litigio o trámite</span>
          </div>
        </div>

        {/* Términos Pendientes de Verificación */}
        <div 
          onClick={() => onNavigate('terminos')}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Términos en Agenda</span>
            <CalendarClock className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {stats.terminosPendientesTotal}
            </span>
            {stats.terminosCriticosTotal > 0 && (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                ({stats.terminosCriticosTotal} prioritarios)
              </span>
            )}
          </div>
        </div>

        {/* Clientes Registrados */}
        <div 
          onClick={() => onNavigate('clientes')}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Clientes Registrados</span>
            <Users className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {stats.totalClientes}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              100% Habeas Data
            </span>
          </div>
        </div>

        {/* Recaudo y Cartera */}
        <div 
          onClick={() => onNavigate('honorarios')}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Recaudo de Honorarios</span>
            <FileSignature className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              ${(stats.totalHonorariosRecaudados / 1000000).toFixed(1)}M COP
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Saldo pendiente: ${(stats.saldoPorCobrar / 1000000).toFixed(1)}M COP
            </div>
          </div>
        </div>
      </div>

      {/* Grid de 2 Columnas: Términos Críticos vs Casos Activos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Términos y Vencimientos Pendientes de Verificar */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Términos y Audiencias Próximas
              </h3>
            </div>
            <button
              onClick={() => onNavigate('terminos')}
              className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Ver agenda</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/60">
            {proximosTerminos.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No hay términos procesales pendientes registrados.
              </div>
            ) : (
              proximosTerminos.map((t) => (
                <div key={t.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      <span className="font-mono font-medium text-amber-600 dark:text-amber-400">
                        {t.expedienteCodigo || 'SIN EXPEDIENTE'}
                      </span>
                      <span>·</span>
                      <span className="truncate">{t.clienteNombre}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                      {t.titulo}
                    </h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">
                      {t.descripcion}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      {t.fechaVencimientoCalculada}
                    </div>
                    <div className="mt-1">
                      {t.calculoConfirmadoPorAbogado ? (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Confirmado
                        </span>
                      ) : (
                        <button
                          onClick={() => onConfirmTerm(t.id)}
                          className="px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 rounded border border-amber-300 dark:border-amber-800/50 hover:bg-amber-200 transition-colors"
                        >
                          Confirmar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expedientes Recientes y Seguimiento */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Expedientes Recientes
              </h3>
            </div>
            <button
              onClick={() => onNavigate('expedientes')}
              className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/60">
            {expedientesRecientes.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Aún no hay expedientes creados.
              </div>
            ) : (
              expedientesRecientes.map((exp) => (
                <div
                  key={exp.id}
                  onClick={() => onNavigate('expedientes', exp.id)}
                  className="py-3 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 rounded px-1 -mx-1 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-200">
                        {exp.codigoInterno}
                      </span>
                      <span>·</span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        {exp.areaJuridica}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {exp.clienteNombre}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      vs {exp.partes.demandadoOAccionado}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {exp.estado.replace(/_/g, ' ')}
                    </span>
                    {exp.cuantiaEstimadaCOP && (
                      <div className="text-[11px] font-mono tabular-nums text-slate-500 mt-1">
                        ${(exp.cuantiaEstimadaCOP / 1000000).toFixed(0)}M COP
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bitácora de Actividad Reciente (Auditoría inmutable) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Registro de Actividad y Auditoría Reciente
            </h3>
          </div>
          <button
            onClick={() => onNavigate('seguridad')}
            className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>Ver bitácora completa</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/60">
          {actividadReciente.slice(0, 4).map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between text-xs gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded shrink-0">
                  {log.modulo}
                </span>
                <span className="text-slate-700 dark:text-slate-300 truncate">
                  {log.descripcionDetallada}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-400">
                <span>{log.usuarioNombre}</span>
                <span className="font-mono tabular-nums">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
