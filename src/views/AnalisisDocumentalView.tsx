/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — ANÁLISIS DOCUMENTAL Y AUDITORÍA DE CONTRATOS
 */

import React, { useState } from 'react';
import {
  FileSearch,
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Scale,
  RefreshCw,
  HelpCircle,
  Quote,
  ShieldCheck,
  Building,
} from 'lucide-react';

export const AnalisisDocumentalView: React.FC = () => {
  const [textoDocumento, setTextoDocumento] = useState('');
  const [nombreDocumento, setNombreDocumento] = useState('Contrato_Prestacion_Servicios.txt');
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<any | null>(null);

  // Manejo de carga de archivo de texto
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNombreDocumento(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setTextoDocumento(content || '');
    };
    reader.readAsText(file);
  };

  const handleCargarEjemplo = () => {
    const ejemplo = `CONTRATO DE ARRENDAMIENTO DE INMUEBLE COMERCIAL
Entre los suscritos: INVERSIONES EL DORADO S.A.S. (Arrendador) y COMERCIALIZADORA DEL PACÍFICO LTDA. (Arrendatario).
CLÁUSULA PRIMERA. OBJETO: El Arrendador entrega a título de arrendamiento el local 204 ubicado en el Centro Empresarial de Bogotá.
CLÁUSULA SEGUNDA. CANON: El canon mensual será de $12.500.000 COP, pagaderos dentro de los primeros 5 días calendario de cada mes. En caso de mora, se causará la tasa máxima legal permitida por la Superintendencia Financiera.
CLÁUSULA TERCERA. VIGENCIA: El término será de 24 meses contados a partir del 1 de noviembre de 2026.
CLÁUSULA CUARTA. RENUNCIA A REQUERIMIENTOS: El Arrendatario renuncia expresamente a los requerimientos judiciales y privados para ser constituido en mora (Art. 2007 C.C.).
CLÁUSULA QUINTA. REPARACIONES: Todas las reparaciones locativas y necesarias serán asumidas íntegramente por el Arrendatario sin derecho a compensación o retención de cánones.
CLÁUSULA SEXTA. CLÁUSULA PENAL: El incumplimiento de cualquiera de las obligaciones generará una penalidad equivalente a tres (3) cánones de arrendamiento, sin perjuicio de la indemnización de perjuicios.`;
    setTextoDocumento(ejemplo);
    setNombreDocumento('Contrato_Arrendamiento_Comercial_Ejemplo.txt');
  };

  const handleAnalizar = async () => {
    if (!textoDocumento.trim() || textoDocumento.length < 20) {
      alert('Por favor ingrese o cargue un documento de texto con contenido suficiente.');
      return;
    }

    setCargando(true);
    try {
      const res = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textoDocumento,
          nombreArchivo: nombreDocumento,
        }),
      });

      const data = await res.json();
      if (res.ok && data.analisis) {
        setResultado(data.analisis);
      } else {
        alert(data.error || 'Error al analizar el documento');
      }
    } catch (err: any) {
      alert('Error en conexión: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Banner de Declaración de Alcance */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 text-xs">
        <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100">
            Protocolo de Auditoría y Extracción Documental:
          </span>{' '}
          <span className="text-slate-600 dark:text-slate-400">
            Se procesa el contenido textual extraído. Si se cargan documentos escaneados en formato imagen sin capa de OCR, se debe verificar previamente la legibilidad para evitar omisiones de cláusulas críticas.
          </span>
        </div>
      </div>

      {/* Panel de Carga y Texto */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Documento o Contrato a Examinar
            </h3>
            <span className="text-xs font-mono text-slate-500">{nombreDocumento}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCargarEjemplo}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg"
            >
              Cargar Ejemplo Comercial
            </button>

            <label className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm cursor-pointer inline-flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>Cargar Archivo (.txt/.doc)</span>
              <input
                type="file"
                accept=".txt,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <textarea
          rows={6}
          value={textoDocumento}
          onChange={(e) => setTextoDocumento(e.target.value)}
          placeholder="Pegue aquí el texto íntegro de la demanda, contrato, póliza o providencia judicial a auditar..."
          className="w-full p-3.5 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {textoDocumento.length} caracteres ({textoDocumento.split(/\s+/).filter(Boolean).length} palabras)
          </span>

          <button
            onClick={handleAnalizar}
            disabled={cargando || !textoDocumento.trim()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm disabled:opacity-50"
          >
            {cargando ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Extrayendo cláusulas y riesgos...</span>
              </>
            ) : (
              <>
                <FileSearch className="w-3.5 h-3.5" />
                <span>Auditar Documento</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resultados de la Auditoría */}
      {resultado && (
        <div className="space-y-6">
          {/* Resumen y Partes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
                Resumen Ejecutivo del Documento
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {resultado.resumenEjecutivo}
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
                Partes Intervinientes Identificadas
              </h4>
              <div className="space-y-2 text-xs">
                {resultado.partesIdentificadas?.map((parte: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{parte.nombre}</span>
                      <span className="text-[11px] text-slate-400 block">{parte.identificacion || 'Sin identificación explícita'}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                      {parte.rolOParte}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cláusulas de Alto Riesgo o Desequilibrio */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Cláusulas de Riesgo, Desproporción o Ambigüedad</span>
            </h4>

            <div className="space-y-3">
              {resultado.clausulasRiesgo?.map((c: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 text-xs space-y-1">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">
                    {c.clausula}
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    <strong className="text-rose-700 dark:text-rose-400">Motivo del Riesgo:</strong> {c.motivoRiesgo}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    <strong className="text-emerald-700 dark:text-emerald-400">Recomendación Jurídica:</strong> {c.recomendacion}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabla de Citas Literales */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Quote className="w-4 h-4 text-amber-500" />
              <span>Tabla de Citas y Cotejo Textual</span>
            </h4>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {resultado.tablaCitas?.map((cita: any, idx: number) => (
                <div key={idx} className="py-3 space-y-1">
                  <div className="font-mono font-semibold text-amber-600 dark:text-amber-400 text-[11px]">
                    {cita.referencia}
                  </div>
                  <blockquote className="italic text-slate-700 dark:text-slate-300 pl-3 border-l-2 border-amber-400/50">
                    “{cita.textoLiteral}”
                  </blockquote>
                  <p className="text-[11px] text-slate-500 pt-0.5">
                    {cita.comentarioJuridico}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
