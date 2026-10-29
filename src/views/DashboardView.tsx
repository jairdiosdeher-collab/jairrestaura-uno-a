/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — PANEL PRINCIPAL ENTERPRISE
 * Consola unificada bajo Fuente Única de Verdad para el ordenamiento procesal colombiano.
 */

import React, { useState } from 'react';
import {
  FolderKanban,
  Users,
  CalendarClock,
  FileSignature,
  Clock,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  DollarSign,
  Scale,
  Check,
  Info,
  X,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import type { 
  Expediente, 
  TerminoAgenda, 
  RegistroAuditoria, 
  Cliente, 
  RegistroHonorario,
  ActuacionProcesal 
} from '../types/legal';

interface DashboardViewProps {
  stats: {
    totalClientes: number;
    clientesConHabeasData?: number;
    expedientesActivos: number;
    totalExpedientes?: number;
    terminosPendientesTotal: number;
    terminosCriticosTotal: number;
    terminosVencidosTotal?: number;
    terminosCumplidosTotal?: number;
    totalDocumentos: number;
    totalHonorariosPactados: number;
    totalHonorariosFacturados?: number;
    totalHonorariosRecaudados: number;
    saldoPorCobrar: number;
  };
  proximosTerminos: TerminoAgenda[];
  expedientesRecientes: Expediente[];
  clientes?: Cliente[];
  honorarios?: RegistroHonorario[];
  actividadReciente: RegistroAuditoria[];
  estaCargando?: boolean;
  onNavigate: (view: string, contextId?: string) => void;
  onQuickAction: (action: string) => void;
  onConfirmTerm: (termId: string) => void;
  onCompleteTerm?: (termId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  proximosTerminos,
  expedientesRecientes,
  clientes = [],
  honorarios = [],
  actividadReciente,
  estaCargando = false,
  onNavigate,
  onQuickAction,
  onConfirmTerm,
  onCompleteTerm,
}) => {
  // Modal de Fundamento Jurídico del Cómputo de Término
  const [terminoSeleccionadoModal, setTerminoSeleccionadoModal] = useState<TerminoAgenda | null>(null);

  const hoyStr = new Date().toISOString().split('T')[0];

  // Identificar si un término está vencido en fecha sin haber sido cumplido
  const esTerminoVencido = (termino: TerminoAgenda): boolean => {
    return termino.estado !== 'CUMPLIDO' && termino.fechaVencimientoCalculada < hoyStr;
  };

  // Formatear montos en pesos colombianos (COP)
  const formatoCOP = (monto: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(monto);
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* 1. HERO BANNER INSTITUCIONAL CON IMAGEN Y ACCIONES RÁPIDAS */}
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
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-amber-400 mb-2">
              <Sparkles className="w-4 h-4" />
              <span>SaaS Jurídico Enterprise · Ordenamiento Procesal de Colombia</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              JAIRRESTAURA UNO A
            </h2>
            <p className="mt-1.5 text-sm text-slate-300 leading-relaxed font-sans">
              “Más claridad jurídica. Mejor organización. Decisiones fundamentadas.”
              Plataforma para litigio en jurisdicciones ordinaria, contencioso administrativa y constitucional (CGP, CPACA y Ley 2213 de 2022).
            </p>
          </div>

          {/* 4 Acciones Rápidas Obligatorias */}
          <div className="grid grid-cols-2 gap-2.5 shrink-0">
            <button
              onClick={() => onQuickAction('nuevo_cliente')}
              className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/10 backdrop-blur-sm transition-all"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Crear Cliente</span>
            </button>
            <button
              onClick={() => onQuickAction('nuevo_expediente')}
              className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg shadow-sm transition-all"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Abrir Expediente</span>
            </button>
            <button
              onClick={() => onNavigate('redaccion')}
              className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/10 backdrop-blur-sm transition-all"
            >
              <FileSignature className="w-3.5 h-3.5 text-amber-400" />
              <span>Redactar Escrito</span>
            </button>
            <button
              onClick={() => onNavigate('asistente_ia')}
              className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg backdrop-blur-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Consulta con IA</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. INDICADORES CUANTITATIVOS REALES (FUENTE ÚNICA DE DATOS — SIN CIFRAS FIJAS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Expedientes Activos */}
        <div 
          onClick={() => onNavigate('expedientes')}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-amber-400 dark:hover:border-amber-500/60 transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Expedientes Activos</span>
            <FolderKanban className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {stats.expedientesActivos}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {stats.totalExpedientes !== undefined && stats.totalExpedientes > stats.expedientesActivos
                ? `de ${stats.totalExpedientes} totales`
                : 'en litigio o trámite'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <Scale className="w-3 h-3 text-amber-500" />
            <span>Litigio Civil, Administrativo y Laboral</span>
          </div>
        </div>

        {/* Términos en Agenda */}
        <div 
          onClick={() => onNavigate('terminos')}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-amber-400 dark:hover:border-amber-500/60 transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Términos en Agenda</span>
            <CalendarClock className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {stats.terminosPendientesTotal}
            </span>
            {stats.terminosCriticosTotal > 0 && (
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                ({stats.terminosCriticosTotal} prioritarios)
              </span>
            )}
          </div>
          <div className="mt-2 text-[11px] flex items-center gap-1">
            {stats.terminosVencidosTotal && stats.terminosVencidosTotal > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {stats.terminosVencidosTotal} término(s) vencido(s)
              </span>
            ) : (
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-500" />
                Cómputo en días hábiles (CGP / CPACA)
              </span>
            )}
          </div>
        </div>

        {/* Clientes Registrados */}
        <div 
          onClick={() => onNavigate('clientes')}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-amber-400 dark:hover:border-amber-500/60 transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Clientes Registrados</span>
            <Users className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {stats.totalClientes}
            </span>
            <span className="text-xs text-slate-400">activos en firma</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Ley 1581 de 2012 (Habeas Data)</span>
          </div>
        </div>

        {/* Recaudo y Cartera de Honorarios */}
        <div 
          onClick={() => onNavigate('honorarios')}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-amber-400 dark:hover:border-amber-500/60 transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Recaudo de Honorarios</span>
            <DollarSign className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
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

      {/* 3. GRID PRINCIPAL DE TRABAJO: TÉRMINOS PROCESALES VS EXPEDIENTES RECIENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUMNA A: TÉRMINOS PROCESALES Y AUDIENCIAS PRÓXIMAS */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Términos Procesales y Audiencias Próximas
              </h3>
            </div>
            <button
              onClick={() => onNavigate('terminos')}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Ver agenda completa</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/60">
            {proximosTerminos.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarClock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  No hay términos procesales pendientes registrados.
                </p>
                <button
                  onClick={() => onNavigate('terminos')}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg transition-colors inline-flex items-center gap-1"
                >
                  <span>Programar término</span>
                </button>
              </div>
            ) : (
              proximosTerminos.map((t) => {
                const vencido = esTerminoVencido(t);
                return (
                  <div key={t.id} className="py-3.5 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {/* Cabecera del término: Código de expediente, materia y prioridad */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] mb-1">
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {t.expedienteCodigo || 'SIN EXPEDIENTE'}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                          {t.clienteNombre || 'Cliente General'}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        {/* Insignia de Prioridad */}
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          t.prioridad === 'ALTA' 
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-900/50'
                            : t.prioridad === 'MEDIA'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-900/50'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {t.prioridad}
                        </span>
                      </div>

                      {/* Título y tipo de providencia / actuación */}
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {t.titulo}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {t.descripcion}
                      </p>

                      {/* Datos complementarios: Responsable y Tipo de Actuación */}
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                        <span>Responsable: <strong className="text-slate-700 dark:text-slate-300">{t.responsableNombre}</strong></span>
                        <span>·</span>
                        <span>Tipo: <strong className="text-slate-700 dark:text-slate-300">{t.tipoTermino.replace(/_/g, ' ')}</strong></span>
                        <span>·</span>
                        <button
                          onClick={() => setTerminoSeleccionadoModal(t)}
                          className="text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-0.5"
                        >
                          <Info className="w-3 h-3" />
                          <span>Ver fundamento legal</span>
                        </button>
                      </div>
                    </div>

                    {/* Vencimiento y Estado */}
                    <div className="text-right shrink-0 flex flex-col items-end">
                      <div className={`text-xs font-bold font-mono tabular-nums px-2 py-0.5 rounded ${
                        vencido
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 font-bold border border-rose-300 dark:border-rose-800'
                          : 'text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800'
                      }`}>
                        {t.fechaVencimientoCalculada}
                      </div>
                      
                      {vencido && (
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-0.5 flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" />
                          Vencido
                        </span>
                      )}

                      <div className="mt-2 flex items-center gap-1.5">
                        {t.calculoConfirmadoPorAbogado ? (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            Verificado
                          </span>
                        ) : (
                          <button
                            onClick={() => onConfirmTerm(t.id)}
                            className="px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 rounded border border-amber-300 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors"
                            title="Confirmar cómputo bajo supervisión del abogado titular"
                          >
                            Confirmar
                          </button>
                        )}

                        {onCompleteTerm && t.estado !== 'CUMPLIDO' && (
                          <button
                            onClick={() => onCompleteTerm(t.id)}
                            className="px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded hover:bg-emerald-100 hover:text-emerald-800 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 transition-colors"
                            title="Marcar actuación como realizada / cumplida"
                          >
                            Cumplir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMNA B: EXPEDIENTES RECIENTES Y SEGUIMIENTO PROCESAL */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Expedientes Recientes y Estado Procesal
              </h3>
            </div>
            <button
              onClick={() => onNavigate('expedientes')}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/60">
            {expedientesRecientes.length === 0 ? (
              <div className="py-12 text-center">
                <FolderKanban className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Aún no hay expedientes creados en la organización.
                </p>
                <button
                  onClick={() => onQuickAction('nuevo_expediente')}
                  className="mt-3 px-3 py-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg transition-colors inline-flex items-center gap-1"
                >
                  <span>Abrir primer expediente</span>
                </button>
              </div>
            ) : (
              expedientesRecientes.map((exp: any) => {
                const clienteAsociado = clientes.find((c) => c.id === exp.clienteId);
                const tieneHabeasData = !!clienteAsociado?.consentimientoLey1581?.autorizado;
                const proximoTerminoExp = exp.proximoTermino || proximosTerminos.find((t) => t.expedienteId === exp.id && t.estado !== 'CUMPLIDO');

                return (
                  <div
                    key={exp.id}
                    onClick={() => onNavigate('expedientes', exp.id)}
                    className="py-3.5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/30 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      {/* Código de expediente, área jurídica y radicado */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] mb-1">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {exp.codigoInterno}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          {exp.areaJuridica.replace(/_/g, ' ')}
                        </span>
                        {exp.radicadoJudicial && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700">·</span>
                            <span className="font-mono text-[10px] text-slate-400">
                              Rad. {exp.radicadoJudicial.slice(0, 12)}...
                            </span>
                          </>
                        )}
                      </div>

                      {/* Cliente autorizado y contraparte */}
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {exp.clienteNombre}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        vs {exp.partes?.demandadoOAccionado || 'Contraparte en trámite'}
                      </p>

                      {/* Última Actuación o Próximo Término */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                        {proximoTerminoExp ? (
                          <span className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Próximo término: {proximoTerminoExp.fechaVencimientoCalculada} ({proximoTerminoExp.titulo.slice(0, 24)}...)
                          </span>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Sin términos pendientes inmediatos
                          </span>
                        )}
                        <span>·</span>
                        <span className={tieneHabeasData ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                          {tieneHabeasData ? 'Habeas Data firmado' : 'Habeas Data pendiente'}
                        </span>
                      </div>
                    </div>

                    {/* Estado procesal y Cuantía */}
                    <div className="text-right shrink-0 flex flex-col items-end">
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {exp.estado?.replace(/_/g, ' ')}
                      </span>
                      {exp.cuantiaEstimadaCOP && (
                        <div className="text-[11px] font-mono font-semibold tabular-nums text-slate-500 mt-1.5">
                          ${(exp.cuantiaEstimadaCOP / 1000000).toFixed(0)}M COP
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {exp.abogadoResponsableNombre || 'Dr. Jair'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. TRANSPARENCIA FINANCIERA DE HONORARIOS Y CARTERA */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Control y Liquidación de Honorarios Profesionales
            </h3>
          </div>
          <button
            onClick={() => onNavigate('honorarios')}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>Ver módulo contable</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Celdas métricas financieras sin doble conteo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Honorarios Pactados</div>
            <div className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1">
              {formatoCOP(stats.totalHonorariosPactados)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Fórmula: Σ(Acuerdos de servicios jurídicos)
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Honorarios Facturados</div>
            <div className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1">
              {formatoCOP(stats.totalHonorariosFacturados || stats.totalHonorariosPactados)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Cuentas de cobro emitidas con soporte
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40">
            <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">Recaudo Efectivo</div>
            <div className="text-base font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1">
              {formatoCOP(stats.totalHonorariosRecaudados)}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5">
              Fórmula: Σ(Pagos verificados por contabilidad)
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40">
            <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">Saldo Pendiente (Cartera)</div>
            <div className="text-base font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400 mt-1">
              {formatoCOP(stats.saldoPorCobrar)}
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">
              Fórmula: Pactado − Recaudo verificado
            </div>
          </div>
        </div>
      </div>

      {/* 5. BITÁCORA INMUTABLE DE ACTIVIDAD Y AUDITORÍA */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Registro de Actividad y Auditoría Reciente
            </h3>
          </div>
          <button
            onClick={() => onNavigate('seguridad')}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
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
                <span className="font-medium text-slate-600 dark:text-slate-300">{log.usuarioNombre}</span>
                <span className="font-mono tabular-nums">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. MODAL INTERACTIVO: FUNDAMENTO LEGAL Y REVISIÓN DE CÓMPUTO DE TÉRMINO */}
      {terminoSeleccionadoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Fundamento Legal y Cómputo del Término Procesal
                </h3>
              </div>
              <button
                onClick={() => setTerminoSeleccionadoModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Actuación procesal</span>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                  {terminoSeleccionadoModal.titulo}
                </div>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  {terminoSeleccionadoModal.descripcion}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold">Expediente</span>
                  <div className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {terminoSeleccionadoModal.expedienteCodigo || 'SIN EXPEDIENTE'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold">Fecha Notificación / Inicio</span>
                  <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {terminoSeleccionadoModal.fechaNotificacionOInicio}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold">Duración en Días</span>
                  <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {terminoSeleccionadoModal.duracionDias} días ({terminoSeleccionadoModal.tipoDias.replace(/_/g, ' ')})
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold">Fecha Límite Vencimiento</span>
                  <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {terminoSeleccionadoModal.fechaVencimientoCalculada}
                  </div>
                </div>
              </div>

              {/* Reglas jurídicas colombianas aplicadas */}
              <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50">
                <div className="text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Regla Procesal Colombiana Aplicada</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-400/90 leading-relaxed">
                  {terminoSeleccionadoModal.aplicaReglaLey2213
                    ? 'Artículo 8 Ley 2213 de 2022: La notificación personal por correo electrónico se entiende surtida transcurridos dos (2) días hábiles siguientes al envío/acuse técnico. El término empezó a correr al día hábil siguiente a la notificación.'
                    : 'Artículo 118 Código General del Proceso (CGP): Cómputo de términos en días hábiles judiciales. Se excluyen los sábados, domingos y días festivos oficiales conforme a la Ley 51 de 1983.'}
                </p>
                {terminoSeleccionadoModal.notasCómputo && (
                  <div className="mt-2 text-[10px] text-slate-600 dark:text-slate-400 border-t border-amber-200/40 dark:border-amber-900/40 pt-1.5">
                    <strong>Notas del despacho:</strong> {terminoSeleccionadoModal.notasCómputo}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-400">
                  Abogado responsable: <strong>{terminoSeleccionadoModal.responsableNombre}</strong>
                </span>
                <span className={terminoSeleccionadoModal.calculoConfirmadoPorAbogado ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                  {terminoSeleccionadoModal.calculoConfirmadoPorAbogado ? '✓ Cómputo verificado' : '⏳ Pendiente de confirmación'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setTerminoSeleccionadoModal(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cerrar
              </button>
              {!terminoSeleccionadoModal.calculoConfirmadoPorAbogado && (
                <button
                  onClick={() => {
                    onConfirmTerm(terminoSeleccionadoModal.id);
                    setTerminoSeleccionadoModal(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors"
                >
                  Confirmar cómputo procesal
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
