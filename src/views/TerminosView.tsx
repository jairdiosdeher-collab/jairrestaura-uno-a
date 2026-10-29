/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — CONTROL DE TÉRMINOS Y AGENDA JUDICIAL
 */

import React, { useState } from 'react';
import {
  CalendarClock,
  Clock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Calendar as CalendarIcon,
  HelpCircle,
  ShieldCheck,
  Check,
  ChevronRight,
  Filter,
  X,
  Calculator,
} from 'lucide-react';
import { calcularTerminoColombiano, obtenerFestivosColombia } from '../utils/colombianHolidays';
import type { TerminoAgenda, Expediente, TipoTermino } from '../types/legal';

interface TerminosViewProps {
  terminos: TerminoAgenda[];
  expedientes: Expediente[];
  onCrearTermino: (termino: Partial<TerminoAgenda>) => Promise<void>;
  onConfirmarTermino: (id: string) => Promise<void>;
  onCompletarTermino: (id: string) => Promise<void>;
}

export const TerminosView: React.FC<TerminosViewProps> = ({
  terminos,
  expedientes,
  onCrearTermino,
  onConfirmarTermino,
  onCompletarTermino,
}) => {
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'PENDIENTE' | 'VERIFICADO' | 'CUMPLIDO'>('TODOS');
  const [modalCalculadoraAbierto, setModalCalculadoraAbierto] = useState(false);
  const [modalNuevoTermino, setModalNuevoTermino] = useState(false);

  // Estado de la Calculadora Judicial Colombiana
  const [calcFechaInicio, setCalcFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [calcDuracionDias, setCalcDuracionDias] = useState<number>(3);
  const [calcTipoDias, setCalcTipoDias] = useState<'HABILES_JUDICIALES' | 'CALENDARIO'>('HABILES_JUDICIALES');
  const [calcAplicaLey2213, setCalcAplicaLey2213] = useState<boolean>(true);
  const [resultadoCalculo, setResultadoCalculo] = useState<any | null>(null);

  // Formulario nuevo término
  const [formData, setFormData] = useState<{
    titulo: string;
    descripcion: string;
    tipoTermino: TipoTermino;
    expedienteId: string;
    fechaInicio: string;
    duracionDias: number;
    tipoDias: 'HABILES_JUDICIALES' | 'CALENDARIO';
    aplicaLey2213: boolean;
    prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  }>({
    titulo: '',
    descripcion: '',
    tipoTermino: 'RECURSO_REPOSICION',
    expedienteId: expedientes[0]?.id || '',
    fechaInicio: new Date().toISOString().split('T')[0],
    duracionDias: 3,
    tipoDias: 'HABILES_JUDICIALES',
    aplicaLey2213: true,
    prioridad: 'ALTA',
  });

  const ejecutarCalculo = () => {
    const res = calcularTerminoColombiano(
      calcFechaInicio,
      calcDuracionDias,
      calcTipoDias,
      calcAplicaLey2213
    );
    setResultadoCalculo(res);
  };

  const handleCrearTerminoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim()) {
      alert('El título del término es obligatorio');
      return;
    }

    const exp = expedientes.find((e) => e.id === formData.expedienteId);

    await onCrearTermino({
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      tipoTermino: formData.tipoTermino,
      expedienteId: exp?.id,
      expedienteCodigo: exp?.codigoInterno,
      clienteId: exp?.clienteId,
      clienteNombre: exp?.clienteNombre,
      fechaNotificacionOInicio: formData.fechaInicio,
      duracionDias: formData.duracionDias,
      tipoDias: formData.tipoDias,
      aplicaReglaLey2213: formData.aplicaLey2213,
      prioridad: formData.prioridad,
    });

    setModalNuevoTermino(false);
  };

  const terminosFiltrados = terminos.filter((t) => {
    if (filtroEstado !== 'TODOS' && t.estado !== filtroEstado) return false;
    return true;
  });

  const hoyStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Barra Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-amber-500" />
            Control de Términos Procesales y Vencimientos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cómputo en días hábiles judiciales (CGP, CPACA, Ley 51/1983 y Ley 2213/2022).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              ejecutarCalculo();
              setModalCalculadoraAbierto(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg inline-flex items-center gap-1.5 transition-colors"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-500" />
            <span>Calculadora de Términos</span>
          </button>

          <button
            onClick={() => setModalNuevoTermino(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Programar Término</span>
          </button>
        </div>
      </div>

      {/* Segmented Filter */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-medium w-fit">
        {(['TODOS', 'PENDIENTE', 'VERIFICADO', 'CUMPLIDO'] as const).map((est) => (
          <button
            key={est}
            onClick={() => setFiltroEstado(est)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filtroEstado === est
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {est === 'TODOS' ? 'Todos' : est === 'PENDIENTE' ? 'Pendientes' : est === 'VERIFICADO' ? 'Verificados' : 'Cumplidos'}
          </button>
        ))}
      </div>

      {/* Lista de Términos Procesales */}
      <div className="space-y-3">
        {terminosFiltrados.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs">
            No hay términos en el estado seleccionado.
          </div>
        ) : (
          terminosFiltrados.map((termino) => {
            const esVencido = termino.fechaVencimientoCalculada < hoyStr && termino.estado !== 'CUMPLIDO';
            const esHoy = termino.fechaVencimientoCalculada === hoyStr;

            return (
              <div
                key={termino.id}
                className={`p-4 rounded-xl border transition-all text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  esVencido
                    ? 'border-red-300 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20'
                    : esHoy
                    ? 'border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    {termino.expedienteCodigo && (
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {termino.expedienteCodigo}
                      </span>
                    )}
                    <span>·</span>
                    <span className="truncate">{termino.clienteNombre || 'Sin cliente vinculado'}</span>
                    <span>·</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {termino.tipoTermino.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {termino.titulo}
                  </h3>

                  <p className="text-slate-600 dark:text-slate-400 line-clamp-1">
                    {termino.descripcion}
                  </p>

                  <div className="pt-1 flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>Notificación: {termino.fechaNotificacionOInicio}</span>
                    <span>·</span>
                    <span>Duración: {termino.duracionDias} días ({termino.tipoDias === 'HABILES_JUDICIALES' ? 'Hábiles' : 'Calendario'})</span>
                    {termino.aplicaReglaLey2213 && (
                      <span className="text-amber-600 dark:text-amber-400">+2 días gracia Ley 2213</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                      Vence: {termino.fechaVencimientoCalculada}
                    </div>
                    <div className="mt-0.5">
                      {termino.calculoConfirmadoPorAbogado ? (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Verificado por abogado
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Pendiente de refrendación
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!termino.calculoConfirmadoPorAbogado && (
                      <button
                        onClick={() => onConfirmarTermino(termino.id)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-lg hover:bg-amber-200"
                        title="Refrendar y confirmar cómputo manualmente"
                      >
                        Confirmar Cómputo
                      </button>
                    )}

                    {termino.estado !== 'CUMPLIDO' && (
                      <button
                        onClick={() => onCompletarTermino(termino.id)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-lg hover:bg-emerald-200"
                      >
                        Marcar Cumplido
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL CALCULADORA JUDICIAL COLOMBIANA */}
      {modalCalculadoraAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Calculator className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Calculadora Procesal Colombiana de Términos
                </h3>
              </div>
              <button
                onClick={() => setModalCalculadoraAbierto(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    Fecha de Notificación o Mensaje
                  </label>
                  <input
                    type="date"
                    value={calcFechaInicio}
                    onChange={(e) => setCalcFechaInicio(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    Duración del Término (en días)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={calcDuracionDias}
                    onChange={(e) => setCalcDuracionDias(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    Regla de Cómputo
                  </label>
                  <select
                    value={calcTipoDias}
                    onChange={(e) => setCalcTipoDias(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="HABILES_JUDICIALES">Días Hábiles Judiciales (CGP / CPACA)</option>
                    <option value="CALENDARIO">Días Calendario Continuos</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="ley2213Check"
                    checked={calcAplicaLey2213}
                    onChange={(e) => setCalcAplicaLey2213(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <label htmlFor="ley2213Check" className="text-slate-700 dark:text-slate-300">
                    Aplica Ley 2213/2022 (2 días de gracia por notificación electrónica)
                  </label>
                </div>
              </div>

              <button
                onClick={ejecutarCalculo}
                className="w-full py-2 font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm"
              >
                Recalcular Cómputo
              </button>

              {/* Resultado del Cómputo */}
              {resultadoCalculo && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="font-medium text-slate-600 dark:text-slate-400">
                      Fecha de Vencimiento Calculada:
                    </span>
                    <span className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
                      {resultadoCalculo.fechaVencimientoCalculada}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    <strong>Fundamento:</strong> {resultadoCalculo.fundamentoLegal}
                  </p>

                  <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-[11px] pr-2">
                    {resultadoCalculo.cronologiaDetallada.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-1.5 rounded ${
                          item.esHabil ? 'bg-white dark:bg-slate-900' : 'bg-slate-100 dark:bg-slate-800/50 text-slate-400'
                        }`}
                      >
                        <span>{item.fecha} ({item.diaSemana})</span>
                        <span>{item.motivo}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-amber-700 dark:text-amber-400 italic pt-1">
                    {resultadoCalculo.advertenciaDeontologica}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO TÉRMINO */}
      {modalNuevoTermino && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Programar Término Judicial en Agenda
              </h3>
              <button
                onClick={() => setModalNuevoTermino(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearTerminoSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                  Título del Término *
                </label>
                <input
                  type="text"
                  required
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="Ej. Interponer Recurso de Reposición y en subsidio Apelación"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                  Expediente Vinculado
                </label>
                <select
                  value={formData.expedienteId}
                  onChange={(e) => setFormData({ ...formData, expedienteId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="">(Sin vincular)</option>
                  {expedientes.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.codigoInterno} — {e.clienteNombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    Tipo de Término
                  </label>
                  <select
                    value={formData.tipoTermino}
                    onChange={(e) => setFormData({ ...formData, tipoTermino: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="RECURSO_REPOSICION">Recurso de Reposición (3 días CGP)</option>
                    <option value="RECURSO_APELACION">Recurso de Apelación</option>
                    <option value="TRASLADO_DEMANDA">Traslado de Demanda (20 días)</option>
                    <option value="ALEGATOS_CONCLUSION">Alegatos de Conclusión</option>
                    <option value="SUBSANACION_DEMANDA">Subsanación de Demanda (5 días)</option>
                    <option value="AUDIENCIA">Celebración de Audiencia</option>
                    <option value="OTRO">Otro Término</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    Prioridad
                  </label>
                  <select
                    value={formData.prioridad}
                    onChange={(e) => setFormData({ ...formData, prioridad: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="ALTA">Alta (Crítica)</option>
                    <option value="MEDIA">Media</option>
                    <option value="BAJA">Baja</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    Fecha Notificación / Envío
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    Días de Término
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.duracionDias}
                    onChange={(e) => setFormData({ ...formData, duracionDias: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNuevoTermino(false)}
                  className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg"
                >
                  Guardar Término
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
