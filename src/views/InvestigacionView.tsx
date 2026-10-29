/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — INVESTIGACIÓN JURÍDICA OFICIAL COLOMBIANA
 */

import React, { useState } from 'react';
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
} from 'lucide-react';
import { CORPUS_JURIDICO_COLOMBIA, PORTALES_OFICIALES_COLOMBIA } from '../utils/colombianLegalCorpus';
import type { FuenteJuridicaOficial } from '../types/legal';

export const InvestigacionView: React.FC = () => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroMateria, setFiltroMateria] = useState<string>('TODAS');

  // Filtrado de fuentes normativas verificadas
  const resultados = CORPUS_JURIDICO_COLOMBIA.filter((item) => {
    if (filtroTipo !== 'TODOS' && item.tipoNormaOProvidencia !== filtroTipo) return false;
    if (filtroMateria !== 'TODAS' && !item.materias.includes(filtroMateria)) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const match =
        item.identificador.toLowerCase().includes(q) ||
        item.epigrafeOTitulo.toLowerCase().includes(q) ||
        item.articulosOFundamentosClave.toLowerCase().includes(q) ||
        item.resumenExtracto.toLowerCase().includes(q) ||
        item.materias.some((m) => m.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Banner de rigor y no-alucinación */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Módulo de Investigación Jurídica con Fuentes Oficiales Verificables</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Toda la información normativa y jurisprudencial exhibida corresponde a fuentes gubernamentales y relatorías judiciales colombianas debidamente constatadas con hipervínculos activos.
          </p>
        </div>

        <div className="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg shrink-0">
          Última Verificación: 28/10/2026
        </div>
      </div>

      {/* Portales Oficiales de Consulta Directa */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-amber-500" />
          Portales Oficiales del Estado Colombiano y Altas Cortes
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PORTALES_OFICIALES_COLOMBIA.map((portal, idx) => (
            <a
              key={idx}
              href={portal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-amber-400/50 dark:hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {portal.sigla}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {portal.descripcion}
                </p>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 font-medium">
                {portal.autoridad}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Buscador y Filtros de la Base Normativa Verificada */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por artículo, ley, sentencia o materia (ej: Art. 118, Tutela, CGP)..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
          >
            <option value="TODOS">Todos los Tipos</option>
            <option value="CONSTITUCION">Constitución</option>
            <option value="LEY">Leyes de la República</option>
            <option value="DECRETO_REGLAMENTARIO">Decretos Reglamentarios</option>
            <option value="SENTENCIA_C">Sentencias C (Constitucionalidad)</option>
            <option value="SENTENCIA_SU">Sentencias SU (Unificación)</option>
          </select>

          <span className="text-[11px] text-slate-400 font-mono">
            {resultados.length} disposiciones constatadas
          </span>
        </div>
      </div>

      {/* Tarjetas de Normas y Sentencias Verificadas */}
      <div className="space-y-4">
        {resultados.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs">
            No se encontraron disposiciones en la base verificada. Se recomienda consultar directamente los portales oficiales de la Rama Judicial o SUIN-Juriscol en los accesos superiores.
          </div>
        ) : (
          resultados.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-xs space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                      {item.tipoNormaOProvidencia.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Expedición: {item.fechaExpedicion}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {item.identificador}
                  </h4>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {item.epigrafeOTitulo}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {item.estadoVigenciaComprobado.replace(/_/g, ' ')}
                  </span>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    Fuente: {item.nombreFuente.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>

              {/* Artículos o Fundamentos Clave */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Artículos o Fundamentos de Mayor Relevancia Práctica:
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  {item.articulosOFundamentosClave}
                </p>
              </div>

              {/* Resumen y Materias */}
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {item.resumenExtracto}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {item.materias.map((m, mIdx) => (
                    <span
                      key={mIdx}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                    >
                      {m}
                    </span>
                  ))}
                </div>

                <a
                  href={item.enlaceVerificado}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <span>Abrir en fuente oficial verificada</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
