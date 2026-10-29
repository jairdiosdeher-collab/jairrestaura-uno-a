/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — REDACCIÓN Y GENERACIÓN DOCUMENTAL
 */

import React, { useState } from 'react';
import {
  FileSignature,
  Download,
  Printer,
  Sparkles,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Edit3,
} from 'lucide-react';
import { PLANTILLAS_JURIDICAS, PlantillaDefinicion } from '../utils/colombianLegalDrafting';
import type { DocumentoLegal, Expediente, Cliente } from '../types/legal';

interface RedaccionViewProps {
  expedientes: Expediente[];
  clientes: Cliente[];
  documentosGuardados: DocumentoLegal[];
  onGuardarDocumento: (doc: Partial<DocumentoLegal>) => Promise<void>;
  onActualizarDocumento: (id: string, doc: Partial<DocumentoLegal>) => Promise<void>;
}

export const RedaccionView: React.FC<RedaccionViewProps> = ({
  expedientes,
  clientes,
  documentosGuardados,
  onGuardarDocumento,
  onActualizarDocumento,
}) => {
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<PlantillaDefinicion>(
    PLANTILLAS_JURIDICAS[0]
  );
  const [valoresFormulario, setValoresFormulario] = useState<Record<string, any>>({});
  const [textoBorrador, setTextoBorrador] = useState<string>(
    PLANTILLAS_JURIDICAS[0].generarBorrador({})
  );
  const [tituloDocumento, setTituloDocumento] = useState<string>(
    `Borrador ${PLANTILLAS_JURIDICAS[0].nombre}`
  );
  const [expedienteAsociadoId, setExpedienteAsociadoId] = useState<string>('');
  const [asistiendoConIA, setAsistiendoConIA] = useState(false);
  const [instruccionIA, setInstruccionIA] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [docGuardadoId, setDocGuardadoId] = useState<string | null>(null);

  // Manejar cambio de plantilla
  const handleCambiarPlantilla = (pId: string) => {
    const p = PLANTILLAS_JURIDICAS.find((item) => item.id === pId) || PLANTILLAS_JURIDICAS[0];
    setPlantillaSeleccionada(p);
    setValoresFormulario({});
    const nuevoTexto = p.generarBorrador({});
    setTextoBorrador(nuevoTexto);
    setTituloDocumento(`Borrador ${p.nombre}`);
    setDocGuardadoId(null);
  };

  // Autocompletar desde expediente seleccionado
  const handleVincularExpediente = (expId: string) => {
    setExpedienteAsociadoId(expId);
    const exp = expedientes.find((e) => e.id === expId);
    if (!exp) return;

    const cliente = clientes.find((c) => c.id === exp.clienteId);

    const nuevosValores: Record<string, any> = {
      ciudad: 'Bogotá D.C.',
      ciudadFecha: `Bogotá D.C., ${new Date().toLocaleDateString('es-CO')}`,
      accionanteNombre: exp.partes.demandanteOAccionante,
      accionanteId: cliente ? `${cliente.tipoIdentificacion} ${cliente.numeroIdentificacion}` : '',
      accionadoNombre: exp.partes.demandadoOAccionado,
      contraparte: exp.partes.demandadoOAccionado,
      hechos: exp.sintesisHechos,
      pretensiones: exp.pretensionesUObjetivos,
      despacho: exp.despachoJudicial || 'Juez Competente (Reparto)',
      emailNotificacion: cliente?.emailNotificacionesJudiciales || '',
      clienteNombre: cliente?.nombreCompletoORazonSocial || exp.clienteNombre,
      clienteId: cliente ? `${cliente.tipoIdentificacion} ${cliente.numeroIdentificacion}` : '',
    };

    setValoresFormulario(nuevosValores);
    const textoActualizado = plantillaSeleccionada.generarBorrador(nuevosValores);
    setTextoBorrador(textoActualizado);
    setTituloDocumento(`${plantillaSeleccionada.nombre} — ${exp.codigoInterno}`);
  };

  const handleInputChange = (clave: string, valor: any) => {
    const actualizados = { ...valoresFormulario, [clave]: valor };
    setValoresFormulario(actualizados);
    setTextoBorrador(plantillaSeleccionada.generarBorrador(actualizados));
  };

  // Generación y enriquecimiento con IA (Gemini 3.8 Flash)
  const handleEnriquecerConIA = async () => {
    setAsistiendoConIA(true);
    try {
      const res = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoDocumento: plantillaSeleccionada.nombre,
          parametros: valoresFormulario,
          instruccionesEspecificas: instruccionIA || 'Estructurar fundamentos jurídicos conforme a la jurisprudencia colombiana aplicable.',
        }),
      });

      const data = await res.json();
      if (res.ok && data.borrador) {
        setTextoBorrador(data.borrador);
      } else {
        alert(data.error || 'Error al enriquecer con IA');
      }
    } catch (err: any) {
      alert('Error en conexión: ' + err.message);
    } finally {
      setAsistiendoConIA(false);
    }
  };

  // Guardar documento en persistencia del servidor
  const handleGuardar = async () => {
    if (!tituloDocumento.trim() || !textoBorrador.trim()) {
      alert('Título y contenido son obligatorios');
      return;
    }

    const payload: Partial<DocumentoLegal> = {
      titulo: tituloDocumento,
      tipo: plantillaSeleccionada.id as any,
      expedienteId: expedienteAsociadoId || undefined,
      contenidoTexto: textoBorrador,
      advertenciasRequisitos: plantillaSeleccionada.advertenciasPrevias,
      estadoRevision: 'BORRADOR_PRELIMINAR',
    };

    if (docGuardadoId) {
      await onActualizarDocumento(docGuardadoId, payload);
    } else {
      await onGuardarDocumento(payload);
    }

    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 2500);
  };

  // Descarga en formato Microsoft Word (.doc)
  const handleDescargarWord = () => {
    const blob = new Blob([
      `<html><head><meta charset="utf-8"><title>${tituloDocumento}</title></head><body><pre style="font-family:Times New Roman,serif; font-size:12pt; white-space:pre-wrap;">${textoBorrador}</pre></body></html>`
    ], { type: 'application/msword' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tituloDocumento.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Imprimir / Exportar a PDF
  const handleImprimirPDF = () => {
    const ventanaImpresion = window.open('', '_blank');
    if (!ventanaImpresion) {
      alert('Habilite las ventanas emergentes para imprimir');
      return;
    }

    ventanaImpresion.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${tituloDocumento}</title>
          <style>
            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; padding: 3cm; }
            .encabezado { text-align: center; margin-bottom: 24pt; border-bottom: 1px solid #ccc; padding-bottom: 12pt; }
            .firma { margin-top: 48pt; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="encabezado">
            <h3 style="margin:0;">JAIRRESTAURA UNO A — DESPACHO JURÍDICO</h3>
            <p style="margin:0; font-size: 10pt; color: #555;">República de Colombia · Documento Procesal Sujeto a Firma</p>
          </div>
          <div style="white-space: pre-wrap;">${textoBorrador}</div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    ventanaImpresion.document.close();
  };

  const copiarTexto = () => {
    navigator.clipboard.writeText(textoBorrador);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Barra Superior con Selector de Plantilla y Acciones de Exportación */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Plantilla Procesal
            </label>
            <select
              value={plantillaSeleccionada.id}
              onChange={(e) => handleCambiarPlantilla(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {PLANTILLAS_JURIDICAS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.categoria})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Vincular Datos de Expediente
            </label>
            <select
              value={expedienteAsociadoId}
              onChange={(e) => handleVincularExpediente(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">(Sin vincular — redactar en blanco)</option>
              {expedientes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.codigoInterno} — {e.clienteNombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Acciones de Exportación y Guardado */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={copiarTexto}
            className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg inline-flex items-center gap-1.5"
            title="Copiar texto al portapapeles"
          >
            {copiado ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copiar</span>
          </button>

          <button
            onClick={handleDescargarWord}
            className="px-3.5 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 rounded-lg inline-flex items-center gap-1.5"
            title="Descargar archivo .doc compatible con Microsoft Word"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Word (.doc)</span>
          </button>

          <button
            onClick={handleImprimirPDF}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1.5"
            title="Imprimir o guardar como PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>

          <button
            onClick={handleGuardar}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm inline-flex items-center gap-1.5"
          >
            {guardadoExitoso ? <CheckCircle2 className="w-3.5 h-3.5 text-slate-900" /> : <Save className="w-3.5 h-3.5" />}
            <span>{guardadoExitoso ? '¡Guardado!' : 'Guardar Versión'}</span>
          </button>
        </div>
      </div>

      {/* Advertencias Previas del Tipo Documental */}
      {plantillaSeleccionada.advertenciasPrevias.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-300 space-y-1">
          <div className="flex items-center gap-2 font-bold mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Requisitos Procesales Críticos a Verificar:</span>
          </div>
          <ul className="space-y-1 list-disc list-inside">
            {plantillaSeleccionada.advertenciasPrevias.map((adv, idx) => (
              <li key={idx}>{adv}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Grid de 2 Columnas: Formulario de Parámetros vs Editor en Vivo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda (5 cols): Campos Estructurados y Enriquecimiento con IA */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
              Variables y Datos del Escrito
            </h3>

            {plantillaSeleccionada.camposRequeridos.map((campo) => (
              <div key={campo.clave}>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {campo.etiqueta} {campo.obligatorio && <span className="text-amber-500">*</span>}
                </label>
                {campo.tipo === 'textarea' ? (
                  <textarea
                    rows={3}
                    placeholder={campo.placeholder}
                    value={valoresFormulario[campo.clave] || ''}
                    onChange={(e) => handleInputChange(campo.clave, e.target.value)}
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100"
                  />
                ) : campo.tipo === 'select' ? (
                  <select
                    value={valoresFormulario[campo.clave] || ''}
                    onChange={(e) => handleInputChange(campo.clave, e.target.value)}
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    {campo.opciones?.map((op, oIdx) => (
                      <option key={oIdx} value={op}>{op}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={campo.tipo === 'numero' ? 'number' : 'text'}
                    placeholder={campo.placeholder}
                    value={valoresFormulario[campo.clave] || ''}
                    onChange={(e) => handleInputChange(campo.clave, e.target.value)}
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Asistente IA para Redacción Jurídica */}
          <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-400">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Enriquecer Escrito con IA (Gemini 3.8 Flash)</span>
            </div>
            <textarea
              rows={2}
              value={instruccionIA}
              onChange={(e) => setInstruccionIA(e.target.value)}
              placeholder="Ej: Adecuar el acápite de pretensiones para solicitar medida cautelar provisional de entrega de medicamentos..."
              className="w-full p-2.5 text-xs rounded-lg border border-amber-200 dark:border-amber-800/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
            <button
              onClick={handleEnriquecerConIA}
              disabled={asistiendoConIA}
              className="w-full py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {asistiendoConIA ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Redactando con rigor procesal...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Optimizar Redacción Jurídica</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Columna Derecha (7 cols): Editor en Vivo y Previsualización */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col h-[750px]">
            {/* Header del Editor */}
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <input
                type="text"
                value={tituloDocumento}
                onChange={(e) => setTituloDocumento(e.target.value)}
                className="text-xs font-bold text-slate-900 dark:text-slate-100 bg-transparent border-0 outline-none w-2/3"
                placeholder="Título del documento..."
              />
              <span className="text-[10px] text-slate-400 font-mono">
                Editor en Vivo · Editable libremente
              </span>
            </div>

            {/* Área de Texto Editable */}
            <textarea
              value={textoBorrador}
              onChange={(e) => setTextoBorrador(e.target.value)}
              className="flex-1 p-6 text-xs font-mono leading-relaxed bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 resize-none focus:outline-none"
              placeholder="El borrador jurídico se generará aquí..."
            />

            {/* Footer con conteo de palabras */}
            <div className="px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>{textoBorrador.split(/\s+/).filter(Boolean).length} palabras</span>
              <span>Revisión humana obligatoria antes de radicar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
