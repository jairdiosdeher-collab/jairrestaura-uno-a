/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — INVESTIGACIÓN JURÍDICA CON FUENTES OFICIALES VERIFICABLES
 * Módulo para consulta, verificación y citación formal de normas orgánicas y jurisprudencia colombiana.
 */

import React, { useState, useMemo } from 'react';
import {
  BookOpenCheck,
  Search,
  ExternalLink,
  ShieldCheck,
  Building,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Globe,
  Filter,
  Copy,
  Check,
  X,
  FileText,
  Scale,
  RotateCcw,
  Info,
} from 'lucide-react';
import { CORPUS_JURIDICO_COLOMBIA, PORTALES_OFICIALES_COLOMBIA } from '../utils/colombianLegalCorpus';
import type { FuenteJuridicaOficial } from '../types/legal';

export const InvestigacionView: React.FC = () => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroMateria, setFiltroMateria] = useState<string>('TODAS');
  const [fichaModal, setFichaModal] = useState<FuenteJuridicaOficial | null>(null);
  const [citaCopiadaId, setCitaCopiadaId] = useState<string | null>(null);

  // Extraer lista única y ordenada de materias del catálogo
  const materiasDisponibles = useMemo(() => {
    const setMaterias = new Set<string>();
    CORPUS_JURIDICO_COLOMBIA.forEach((item) => {
      item.materias.forEach((m) => setMaterias.add(m));
    });
    return Array.from(setMaterias).sort();
  }, []);

  // Filtrado reactivo multicriterio: ley, año, artículo, sentencia, tema y palabras clave
  const resultados = useMemo(() => {
    return CORPUS_JURIDICO_COLOMBIA.filter((item) => {
      // 1. Filtro por Tipo de Norma / Providencia
      if (filtroTipo !== 'TODOS' && item.tipoNormaOProvidencia !== filtroTipo) {
        return false;
      }

      // 2. Filtro por Materia / Rama Jurídica
      if (filtroMateria !== 'TODAS' && !item.materias.some((m) => m.toLowerCase() === filtroMateria.toLowerCase())) {
        return false;
      }

      // 3. Búsqueda por texto libre
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const coincide =
          item.identificador.toLowerCase().includes(q) ||
          item.epigrafeOTitulo.toLowerCase().includes(q) ||
          item.articulosOFundamentosClave.toLowerCase().includes(q) ||
          item.resumenExtracto.toLowerCase().includes(q) ||
          item.fechaExpedicion.includes(q) || // Búsqueda por año (ej: "2015", "2022")
          item.autoridadEmisora.toLowerCase().includes(q) ||
          item.nombreFuente.toLowerCase().includes(q) ||
          item.materias.some((m) => m.toLowerCase().includes(q));

        if (!coincide) return false;
      }

      return true;
    });
  }, [busqueda, filtroTipo, filtroMateria]);

  // Copiar cita jurídica formal adaptada a memoriales judiciales colombianos
  const handleCopiarCita = (item: FuenteJuridicaOficial) => {
    const textoCita = `${item.autoridadEmisora}. ${item.identificador}. "${item.epigrafeOTitulo}". Expedición: ${item.fechaExpedicion}. Fuente oficial verificada: ${item.enlaceVerificado}.`;
    navigator.clipboard.writeText(textoCita);
    setCitaCopiadaId(item.id);
    setTimeout(() => setCitaCopiadaId(null), 3000);
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroTipo('TODOS');
    setFiltroMateria('TODAS');
  };

  const hayFiltrosActivos = busqueda.trim() !== '' || filtroTipo !== 'TODOS' || filtroMateria !== 'TODAS';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. BANNER METODOLÓGICO Y DECLARACIÓN DE PROCEDENCIA */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Investigación Jurídica con Fuentes Oficiales del Estado Colombiano</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <strong>Declaración de Trazabilidad:</strong> Este módulo opera a partir de un catálogo normativo y jurisprudencial curado y verificado localmente, complementado con hipervínculos directos a las sedes electrónicas oficiales (SUIN-Juriscol, Relatoría Corte Constitucional, CSJ y Consejo de Estado). No simula búsquedas en vivo inexistentes ni inventa fuentes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0 text-[11px] font-mono">
          <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            Catálogo Actualizado: <strong>29/10/2026</strong>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Cotejado</span>
          </div>
        </div>
      </div>

      {/* 2. PORTALES OFICIALES DE ACCESO DIRECTO (ALTAS CORTES Y GOBIERNO) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-500" />
            <span>Portales Oficiales de la Rama Judicial y Entidades Públicas</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            {PORTALES_OFICIALES_COLOMBIA.length} sedes electrónicas oficiales
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PORTALES_OFICIALES_COLOMBIA.map((portal, idx) => (
            <a
              key={idx}
              href={portal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-amber-400/60 dark:hover:border-amber-500/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all flex flex-col justify-between group shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {portal.sigla}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {portal.descripcion}
                </p>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 font-medium truncate border-t border-slate-100 dark:border-slate-800 pt-1.5">
                {portal.autoridad}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* 3. BUSCADOR INTEGRADO Y DOBLE FILTRO (TIPO Y MATERIA) */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Caja de Búsqueda */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por número (ej: 1755, 2213), año (ej: 2015), artículo (ej: Art. 19), sentencia (ej: C-590), o tema..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtros Combinables */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Filtro por Tipo */}
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-amber-500 font-medium"
            >
              <option value="TODOS">Todos los Tipos de Norma</option>
              <option value="CONSTITUCION">Constitución Política</option>
              <option value="LEY">Leyes de la República</option>
              <option value="DECRETO_REGLAMENTARIO">Decretos Reglamentarios</option>
              <option value="SENTENCIA_C">Sentencias C (Constitucionalidad)</option>
              <option value="SENTENCIA_SU">Sentencias SU (Unificación)</option>
            </select>

            {/* Filtro por Materia / Rama Jurídica */}
            <select
              value={filtroMateria}
              onChange={(e) => setFiltroMateria(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-amber-500 font-medium"
            >
              <option value="TODAS">Todas las Materias</option>
              {materiasDisponibles.map((mat) => (
                <option key={mat} value={mat}>
                  {mat}
                </option>
              ))}
            </select>

            {hayFiltrosActivos && (
              <button
                onClick={limpiarFiltros}
                className="px-2.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1"
                title="Restablecer criterios de búsqueda y filtros"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* Barra de Estado de Búsqueda */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <span>Resultados encontrados: <strong>{resultados.length}</strong> de {CORPUS_JURIDICO_COLOMBIA.length} disposiciones</span>
            {hayFiltrosActivos && (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                (Filtros activos aplicados)
              </span>
            )}
          </div>
          <div className="font-mono text-slate-400">
            Fuentes: SUIN-Juriscol / Relatoría Altas Cortes
          </div>
        </div>
      </div>

      {/* 4. TARJETAS DE NORMAS Y JURISPRUDENCIA CON REFERENCIAS VERIFICADAS */}
      <div className="space-y-4">
        {resultados.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 space-y-3">
            <BookOpenCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No se hallaron coincidencias en el catálogo verificado
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No existen registros en el catálogo local para el criterio: <strong className="text-slate-700 dark:text-slate-200">"{busqueda}"</strong> con los filtros seleccionados.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={limpiarFiltros}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
              >
                Restablecer búsqueda
              </button>
              <a
                href="https://www.suin-juriscol.gov.co"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg transition-colors inline-flex items-center gap-1"
              >
                <span>Consultar en SUIN-Juriscol</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ) : (
          resultados.map((item) => {
            const esCopiado = citaCopiadaId === item.id;
            return (
              <div
                key={item.id}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-xs space-y-3 shadow-xs"
              >
                {/* Cabecera de la Disposición */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        item.tipoNormaOProvidencia === 'CONSTITUCION'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          : item.tipoNormaOProvidencia === 'LEY'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : item.tipoNormaOProvidencia.startsWith('SENTENCIA')
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {item.tipoNormaOProvidencia.replace(/_/g, ' ')}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Expedición: <strong>{item.fechaExpedicion}</strong>
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-[11px] text-slate-500">
                        Emisor: <strong>{item.autoridadEmisora}</strong>
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.identificador}
                    </h4>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                      {item.epigrafeOTitulo}
                    </p>
                  </div>

                  {/* Estado de Vigencia y Fuente */}
                  <div className="text-right shrink-0 flex flex-col items-end">
                    <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {item.estadoVigenciaComprobado.replace(/_/g, ' ')}
                    </span>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      Fuente: {item.nombreFuente.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Verificación catálogo: {item.fechaUltimaConsulta}
                    </div>
                  </div>
                </div>

                {/* Artículos o Fundamentos de Mayor Relevancia Práctica */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-amber-500" />
                    <span>Articulado o Causal Específica Relevante:</span>
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                    {item.articulosOFundamentosClave}
                  </p>
                </div>

                {/* Resumen Dogmático y Práctico */}
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.resumenExtracto}
                </p>

                {/* Materias y Acciones */}
                <div className="pt-2.5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                  {/* Etiquetas de Materia */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.materias.map((m, mIdx) => (
                      <button
                        key={mIdx}
                        onClick={() => setFiltroMateria(m)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                          filtroMateria === m
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                        title={`Filtrar disposiciones por materia: ${m}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopiarCita(item)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
                      title="Copiar referencia formal para memorial o demanda judicial"
                    >
                      {esCopiado ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Cita copiada</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copiar cita formal</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setFichaModal(item)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
                    >
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ficha técnica</span>
                    </button>

                    <a
                      href={item.enlaceVerificado}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors inline-flex items-center gap-1 text-[11px] font-bold shadow-xs"
                      title="Abrir el documento original en la sede electrónica oficial"
                    >
                      <span>Abrir en fuente oficial</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. MODAL DE FICHA TÉCNICA Y CITACIÓN JUDICIAL COMPLETA */}
      {fichaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Ficha Técnica Normativa y Jurisprudencial Oficial
                </h3>
              </div>
              <button
                onClick={() => setFichaModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  {fichaModal.tipoNormaOProvidencia.replace(/_/g, ' ')}
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {fichaModal.identificador}
                </h4>
                <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">
                  {fichaModal.epigrafeOTitulo}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold">Autoridad Emisora</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {fichaModal.autoridadEmisora}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold">Fecha de Expedición</span>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {fichaModal.fechaExpedicion}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold">Portal Oficial Verificado</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {fichaModal.nombreFuente.replace(/_/g, ' ')}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold">Estado de Vigencia Comprobado</span>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{fichaModal.estadoVigenciaComprobado.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Articulado y Fundamentos Procesales Clave:
                </span>
                <p className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                  {fichaModal.articulosOFundamentosClave}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Resumen y Alcance Aplicativo:
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {fichaModal.resumenExtracto}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300">
                <strong>Advertencia de rigor procesal:</strong> En virtud del principio de lealtad procesal (Ley 1123 de 2007, Art. 28) y para evitar preclusiones o nulidades, el litigante debe contrastar en el enlace oficial que la norma no haya sido objeto de suspensión provisional, inexequibilidad sobrevenida o reforma legislativa posterior a la fecha de catalogación.
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleCopiarCita(fichaModal)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copiar cita judicial formal</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFichaModal(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cerrar
                </button>
                <a
                  href={fichaModal.enlaceVerificado}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Abrir enlace oficial en vivo</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

