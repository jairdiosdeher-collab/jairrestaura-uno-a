/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — EXPEDIENTES Y CASOS VIEW
 */

import React, { useState } from 'react';
import {
  FolderKanban,
  Search,
  Plus,
  Scale,
  Calendar,
  Clock,
  User,
  Building,
  FileText,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Lock,
  ArrowLeft,
  X,
  FilePlus,
} from 'lucide-react';
import type { 
  Expediente, 
  Cliente, 
  AreaJuridica, 
  EstadoExpediente, 
  ActuacionProcesal,
  TerminoAgenda,
  DocumentoLegal
} from '../types/legal';

interface ExpedientesViewProps {
  expedientes: Expediente[];
  clientes: Cliente[];
  selectedExpedienteId?: string | null;
  onSelectExpediente: (id: string | null) => void;
  onCrearExpediente: (expediente: Partial<Expediente>) => Promise<void>;
  onRegistrarActuacion: (expedienteId: string, actuacion: any) => Promise<void>;
  onAbrirAsistenteIA: (expediente: Expediente) => void;
  onRedactarDocumento: (expediente: Expediente) => void;
}

export const ExpedientesView: React.FC<ExpedientesViewProps> = ({
  expedientes,
  clientes,
  selectedExpedienteId,
  onSelectExpediente,
  onCrearExpediente,
  onRegistrarActuacion,
  onAbrirAsistenteIA,
  onRedactarDocumento,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroArea, setFiltroArea] = useState<string>('TODAS');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');

  // Pestaña en vista individual de expediente
  const [tabDetalle, setTabDetalle] = useState<'resumen' | 'actuaciones' | 'terminos' | 'documentos' | 'analisis_ia' | 'notas'>('resumen');

  // Modal para crear expediente
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [modalActuacionAbierto, setModalActuacionAbierto] = useState(false);

  // Formulario nuevo expediente
  const [nuevoExp, setNuevoExp] = useState<{
    clienteId: string;
    areaJuridica: AreaJuridica;
    jurisdiccion: Expediente['jurisdiccion'];
    despachoJudicial: string;
    radicadoJudicial: string;
    demandante: string;
    demandado: string;
    sintesisHechos: string;
    pretensiones: string;
    cuantiaCOP: string;
    estado: EstadoExpediente;
    estrategiaDefensiva: string;
    notasPrivadas: string;
  }>({
    clienteId: clientes[0]?.id || '',
    areaJuridica: 'CIVIL',
    jurisdiccion: 'ORDINARIA',
    despachoJudicial: 'Juzgado Civil del Circuito de Bogotá',
    radicadoJudicial: '',
    demandante: '',
    demandado: '',
    sintesisHechos: '',
    pretensiones: '',
    cuantiaCOP: '',
    estado: 'PREJUDICIAL',
    estrategiaDefensiva: '',
    notasPrivadas: '',
  });

  // Formulario nueva actuación procesal
  const [nuevaAct, setNuevaAct] = useState({
    fechaActuacion: new Date().toISOString().split('T')[0],
    cuaderno: 'Cuaderno Principal 1',
    tipoProvidencia: 'AUTO_INTERLOCUTORIO',
    anotacion: '',
    tieneTermino: false,
    terminoDias: '3',
    tipoDias: 'HABILES',
  });

  const expedienteActivo = expedientes.find((e) => e.id === selectedExpedienteId);

  // Filtrado reactivo de expedientes
  const expedientesFiltrados = expedientes.filter((e) => {
    if (filtroArea !== 'TODAS' && e.areaJuridica !== filtroArea) return false;
    if (filtroEstado !== 'TODOS' && e.estado !== filtroEstado) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      const match =
        e.codigoInterno.toLowerCase().includes(q) ||
        (e.radicadoJudicial && e.radicadoJudicial.includes(q)) ||
        e.clienteNombre.toLowerCase().includes(q) ||
        e.partes.demandadoOAccionado.toLowerCase().includes(q) ||
        e.sintesisHechos.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleCrearExpedienteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clienteSeleccionado = clientes.find((c) => c.id === nuevoExp.clienteId);
    if (!clienteSeleccionado) {
      alert('Seleccione un cliente registrado');
      return;
    }

    // Validación de radicado de 23 dígitos si se suministra
    if (nuevoExp.radicadoJudicial && nuevoExp.radicadoJudicial.replace(/\D/g, '').length !== 23) {
      const confirma = window.confirm(
        'El radicado judicial colombiano estándar de la Rama Judicial consta de 23 dígitos numéricos. ¿Desea guardarlo aún si difiere de este estándar?'
      );
      if (!confirma) return;
    }

    await onCrearExpediente({
      clienteId: clienteSeleccionado.id,
      clienteNombre: clienteSeleccionado.nombreCompletoORazonSocial,
      areaJuridica: nuevoExp.areaJuridica,
      jurisdiccion: nuevoExp.jurisdiccion,
      despachoJudicial: nuevoExp.despachoJudicial,
      radicadoJudicial: nuevoExp.radicadoJudicial ? nuevoExp.radicadoJudicial.replace(/\D/g, '') : undefined,
      autoridadCompetente: nuevoExp.despachoJudicial,
      partes: {
        demandanteOAccionante: nuevoExp.demandante || clienteSeleccionado.nombreCompletoORazonSocial,
        demandadoOAccionado: nuevoExp.demandado,
      },
      sintesisHechos: nuevoExp.sintesisHechos,
      pretensionesUObjetivos: nuevoExp.pretensiones,
      cuantiaEstimadaCOP: nuevoExp.cuantiaCOP ? Number(nuevoExp.cuantiaCOP) : undefined,
      esMayorCuantia: nuevoExp.cuantiaCOP ? Number(nuevoExp.cuantiaCOP) > 200000000 : false,
      estado: nuevoExp.estado,
      estrategiaDefensiva: nuevoExp.estrategiaDefensiva,
      notasPrivadas: nuevoExp.notasPrivadas,
      abogadoResponsableId: 'usr-jair-01',
      abogadoResponsableNombre: 'Dr. Jair',
    });

    setModalCrearAbierto(false);
  };

  const handleRegistrarActuacionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expedienteActivo) return;

    await onRegistrarActuacion(expedienteActivo.id, {
      ...nuevaAct,
      terminoDias: nuevaAct.tieneTermino ? Number(nuevaAct.terminoDias) : undefined,
    });

    setModalActuacionAbierto(false);
    setNuevaAct({
      fechaActuacion: new Date().toISOString().split('T')[0],
      cuaderno: 'Cuaderno Principal 1',
      tipoProvidencia: 'AUTO_INTERLOCUTORIO',
      anotacion: '',
      tieneTermino: false,
      terminoDias: '3',
      tipoDias: 'HABILES',
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* VISTA INDIVIDUAL DE EXPEDIENTE */}
      {expedienteActivo ? (
        <div className="space-y-5">
          {/* Barra de Retorno y Acciones del Expediente */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => onSelectExpediente(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la lista de expedientes</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onAbrirAsistenteIA(expedienteActivo)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60 rounded-lg hover:bg-amber-500/20 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analizar con Asistente IA</span>
              </button>

              <button
                onClick={() => onRedactarDocumento(expedienteActivo)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white dark:bg-slate-800 rounded-lg hover:bg-slate-800 transition-all"
              >
                <FilePlus className="w-3.5 h-3.5" />
                <span>Generar Documento</span>
              </button>

              <button
                onClick={() => setModalActuacionAbierto(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-400 text-slate-950 rounded-lg shadow-sm hover:bg-amber-300 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Actuación</span>
              </button>
            </div>
          </div>

          {/* Encabezado del Expediente */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                  {expedienteActivo.codigoInterno}
                </span>
                <span className="text-xs px-2 py-0.5 rounded font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {expedienteActivo.areaJuridica}
                </span>
                <span className="text-xs px-2 py-0.5 rounded font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  {expedienteActivo.estado.replace(/_/g, ' ')}
                </span>
              </div>

              {expedienteActivo.radicadoJudicial ? (
                <div className="text-xs font-mono bg-slate-50 dark:bg-slate-800/60 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  Radicado Judicial: <strong>{expedienteActivo.radicadoJudicial}</strong>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Sin radicado judicial (Etapa prejudicial)</span>
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {expedienteActivo.partes.demandanteOAccionante} vs {expedienteActivo.partes.demandadoOAccionado}
            </h2>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block text-[11px]">Cliente Titular:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{expedienteActivo.clienteNombre}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Despacho / Autoridad:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{expedienteActivo.despachoJudicial || 'Por asignar'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Abogado Responsable:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{expedienteActivo.abogadoResponsableNombre}</span>
              </div>
            </div>
          </div>

          {/* Selector de Pestañas */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-medium">
            {[
              { id: 'resumen', label: 'Resumen & Hechos' },
              { id: 'actuaciones', label: 'Actuaciones Procesales' },
              { id: 'notas', label: 'Notas Privadas' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTabDetalle(tab.id as any)}
                className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  tabDetalle === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Contenido de la pestaña */}
          {tabDetalle === 'resumen' && (
            <div className="space-y-5">
              {/* Síntesis de Hechos */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Relato Fáctico (Hechos)
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {expedienteActivo.sintesisHechos}
                </p>
              </div>

              {/* Pretensiones y Cuantía */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Pretensiones u Objetivos Procesales
                  </h3>
                  {expedienteActivo.cuantiaEstimadaCOP && (
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                      Cuantía: ${expedienteActivo.cuantiaEstimadaCOP.toLocaleString('es-CO')} COP{' '}
                      {expedienteActivo.esMayorCuantia ? '(Mayor Cuantía Art. 25 CGP)' : '(Menor Cuantía)'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {expedienteActivo.pretensionesUObjetivos}
                </p>
              </div>

              {/* Estrategia Defensiva */}
              {expedienteActivo.estrategiaDefensiva && (
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Estrategia Procesal y Carga de la Prueba
                  </h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {expedienteActivo.estrategiaDefensiva}
                  </p>
                </div>
              )}
            </div>
          )}

          {tabDetalle === 'actuaciones' && (
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Cronología de Actuaciones Procesales
                </h3>
                <button
                  onClick={() => setModalActuacionAbierto(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Actuación</span>
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
                      Auto Interlocutorio · Fijación de Audiencia Inicial Art. 372 CGP
                    </span>
                    <span className="font-mono tabular-nums text-slate-400">2026-10-15</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200">
                    Fija fecha y hora para la celebración de la Audiencia Inicial prevista en el Artículo 372 del CGP (Conciliación, Excepciones Previas y Fijación de Litigio) para el 12 de noviembre de 2026 a las 09:00 a.m. vía virtual Microsoft Teams.
                  </p>
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-3">
                    <span>Cuaderno Principal 1</span>
                    <span>·</span>
                    <span>Generó término procesal de 15 días hábiles</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                      Auto Admisorio de la Demanda
                    </span>
                    <span className="font-mono tabular-nums text-slate-400">2024-11-20</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200">
                    Auto admite demanda y ordena correr traslado a la parte demandada por el término de veinte (20) días hábiles conforme al Art. 369 del Código General del Proceso.
                  </p>
                </div>
              </div>
            </div>
          )}

          {tabDetalle === 'notas' && (
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Lock className="w-4 h-4" />
                <span>Notas Internas Confidenciales (Amparadas por Secreto Profesional Ley 1123/2007)</span>
              </div>
              <textarea
                rows={6}
                value={expedienteActivo.notasPrivadas || ''}
                readOnly
                className="w-full p-4 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none"
                placeholder="No hay notas privadas registradas para este expediente."
              />
            </div>
          )}
        </div>
      ) : (
        /* VISTA DE LISTA DE EXPEDIENTES */
        <div className="space-y-6">
          {/* Barra Superior de Filtros */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por código, radicado, demandante o demandado..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="TODAS">Todas las Áreas</option>
                <option value="CIVIL">Civil</option>
                <option value="ADMINISTRATIVO">Administrativo</option>
                <option value="LABORAL_SEGURIDAD_SOCIAL">Laboral</option>
                <option value="COMERCIAL">Comercial</option>
                <option value="CONSTITUCIONAL">Constitucional</option>
                <option value="PENAL">Penal</option>
              </select>

              <button
                onClick={() => setModalCrearAbierto(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Expediente</span>
              </button>
            </div>
          </div>

          {/* Tabla de Expedientes */}
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Código & Radicado</th>
                    <th className="px-5 py-3">Partes Procesales</th>
                    <th className="px-5 py-3">Área & Despacho</th>
                    <th className="px-5 py-3">Cuantía Estimada</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {expedientesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No se encontraron expedientes con los criterios indicados.
                      </td>
                    </tr>
                  ) : (
                    expedientesFiltrados.map((exp) => (
                      <tr
                        key={exp.id}
                        onClick={() => onSelectExpediente(exp.id)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            {exp.codigoInterno}
                          </div>
                          {exp.radicadoJudicial ? (
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              {exp.radicadoJudicial}
                            </div>
                          ) : (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                              Prejudicial
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                            {exp.partes.demandanteOAccionante}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            vs {exp.partes.demandadoOAccionado}
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {exp.areaJuridica}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {exp.despachoJudicial || 'Reparto por radicar'}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 font-mono tabular-nums">
                          {exp.cuantiaEstimadaCOP ? (
                            <span className="text-slate-700 dark:text-slate-300">
                              ${exp.cuantiaEstimadaCOP.toLocaleString('es-CO')} COP
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Sin cuantía</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {exp.estado.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectExpediente(exp.id);
                            }}
                            className="text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                          >
                            Abrir
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR EXPEDIENTE */}
      {modalCrearAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Apertura de Nuevo Expediente Judicial
              </h3>
              <button
                onClick={() => setModalCrearAbierto(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearExpedienteSubmit} className="mt-4 space-y-4 text-xs">
              {/* Cliente Asociado */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Cliente Titular Asociado *
                </label>
                <select
                  required
                  value={nuevoExp.clienteId}
                  onChange={(e) => setNuevoExp({ ...nuevoExp, clienteId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombreCompletoORazonSocial} ({c.tipoIdentificacion} {c.numeroIdentificacion})
                    </option>
                  ))}
                </select>
              </div>

              {/* Área y Jurisdicción */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Área Jurídica *
                  </label>
                  <select
                    value={nuevoExp.areaJuridica}
                    onChange={(e) => setNuevoExp({ ...nuevoExp, areaJuridica: e.target.value as AreaJuridica })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="CIVIL">Civil y Comercial</option>
                    <option value="ADMINISTRATIVO">Contencioso Administrativo</option>
                    <option value="LABORAL_SEGURIDAD_SOCIAL">Laboral y Seguridad Social</option>
                    <option value="CONSTITUCIONAL">Constitucional (Tutelas y Derechos)</option>
                    <option value="PENAL">Penal</option>
                    <option value="FAMILIA">Familia</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Jurisdicción
                  </label>
                  <select
                    value={nuevoExp.jurisdiccion}
                    onChange={(e) => setNuevoExp({ ...nuevoExp, jurisdiccion: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="ORDINARIA">Ordinaria</option>
                    <option value="CONTENCIOSO_ADMINISTRATIVO">Contencioso Administrativa</option>
                    <option value="CONSTITUCIONAL">Constitucional</option>
                    <option value="ARBITRAL">Arbitral / Centro de Conciliación</option>
                    <option value="EXTRAJUDICIAL">Extrajudicial / Prejudicial</option>
                  </select>
                </div>
              </div>

              {/* Radicado Judicial (23 Dígitos) y Despacho */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Radicado Judicial Rama Judicial (23 dígitos)
                  </label>
                  <input
                    type="text"
                    maxLength={23}
                    value={nuevoExp.radicadoJudicial}
                    onChange={(e) => setNuevoExp({ ...nuevoExp, radicadoJudicial: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                    placeholder="11001310301520240049200"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Dejar en blanco si aún no ha sido radicado judicialmente.
                  </span>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Despacho Judicial o Autoridad
                  </label>
                  <input
                    type="text"
                    value={nuevoExp.despachoJudicial}
                    onChange={(e) => setNuevoExp({ ...nuevoExp, despachoJudicial: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder="Ej. Juzgado 15 Civil del Circuito"
                  />
                </div>
              </div>

              {/* Contraparte Procesal */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Contraparte (Demandado / Accionado) *
                </label>
                <input
                  type="text"
                  required
                  value={nuevoExp.demandado}
                  onChange={(e) => setNuevoExp({ ...nuevoExp, demandado: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  placeholder="Persona natural o jurídica contraparte"
                />
              </div>

              {/* Síntesis de Hechos */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Síntesis de los Hechos *
                </label>
                <textarea
                  required
                  rows={3}
                  value={nuevoExp.sintesisHechos}
                  onChange={(e) => setNuevoExp({ ...nuevoExp, sintesisHechos: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  placeholder="Relación cronológica sucinta de los hechos..."
                />
              </div>

              {/* Pretensiones y Cuantía */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Pretensiones u Objetivos
                  </label>
                  <textarea
                    rows={2}
                    value={nuevoExp.pretensiones}
                    onChange={(e) => setNuevoExp({ ...nuevoExp, pretensiones: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder="Declarar la resolución del contrato / Pago de perjuicios..."
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Cuantía Estimada en COP
                  </label>
                  <input
                    type="number"
                    value={nuevoExp.cuantiaCOP}
                    onChange={(e) => setNuevoExp({ ...nuevoExp, cuantiaCOP: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                    placeholder="Ej. 150000000"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Calcula automáticamente mayor cuantía (&gt; 150 SMMLV).
                  </span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalCrearAbierto(false)}
                  className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm"
                >
                  Abrir Expediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR ACTUACIÓN PROCESAL */}
      {modalActuacionAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Registrar Actuación Procesal
              </h3>
              <button
                onClick={() => setModalActuacionAbierto(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegistrarActuacionSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Providencia / Actuación
                </label>
                <select
                  value={nuevaAct.tipoProvidencia}
                  onChange={(e) => setNuevaAct({ ...nuevaAct, tipoProvidencia: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="AUTO_INTERLOCUTORIO">Auto Interlocutorio</option>
                  <option value="AUTO_SUSTANCIACION">Auto de Sustanciación</option>
                  <option value="AUTO_ADMISORIO">Auto Admisorio</option>
                  <option value="SENTENCIA">Sentencia Judicial</option>
                  <option value="MEMORIAL_PARTE">Memorial Radicado por Parte</option>
                  <option value="AUDIENCIA">Celebración de Audiencia</option>
                  <option value="CONSTANCIA">Constancia Secretarial</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  Anotación / Contenido de la Actuación *
                </label>
                <textarea
                  required
                  rows={3}
                  value={nuevaAct.anotacion}
                  onChange={(e) => setNuevaAct({ ...nuevaAct, anotacion: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="Descripción precisa de la actuación o texto literal de la anotación de la Rama Judicial..."
                />
              </div>

              <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="tieneTerminoCheck"
                    checked={nuevaAct.tieneTermino}
                    onChange={(e) => setNuevaAct({ ...nuevaAct, tieneTermino: e.target.checked })}
                    className="rounded text-amber-500"
                  />
                  <label htmlFor="tieneTerminoCheck" className="font-semibold text-amber-900 dark:text-amber-300">
                    ¿Esta actuación procesal genera término para actuar?
                  </label>
                </div>

                {nuevaAct.tieneTermino && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <label className="block text-[11px] text-slate-500">Duración en días</label>
                      <input
                        type="number"
                        min={1}
                        value={nuevaAct.terminoDias}
                        onChange={(e) => setNuevaAct({ ...nuevaAct, terminoDias: e.target.value })}
                        className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500">Cómputo</label>
                      <select
                        value={nuevaAct.tipoDias}
                        onChange={(e) => setNuevaAct({ ...nuevaAct, tipoDias: e.target.value })}
                        className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700"
                      >
                        <option value="HABILES">Días Hábiles Judiciales (CGP)</option>
                        <option value="CALENDARIO">Días Calendario</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalActuacionAbierto(false)}
                  className="px-3.5 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg"
                >
                  Guardar Actuación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
