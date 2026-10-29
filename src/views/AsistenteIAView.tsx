/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — ASISTENTE JURÍDICO INTELIGENTE (GEMINI 3.8 FLASH)
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Scale,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileText,
  Clock,
  ArrowRight,
  ShieldAlert,
  ListChecks,
  ChevronDown,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import type { Expediente } from '../types/legal';

interface AsistenteIAViewProps {
  expedienteActivo?: Expediente | null;
  onRedactarDocumento?: (tipoDoc: string, contexto: string) => void;
}

interface MensajeChat {
  id: string;
  rol: 'usuario' | 'asistente';
  texto: string;
  timestamp: string;
}

export const AsistenteIAView: React.FC<AsistenteIAViewProps> = ({
  expedienteActivo,
  onRedactarDocumento,
}) => {
  const [modo, setModo] = useState<'analisis_hechos' | 'chat_juridico'>('analisis_hechos');

  // Estado del Analizador de Hechos
  const [hechosInput, setHechosInput] = useState(
    expedienteActivo ? expedienteActivo.sintesisHechos : ''
  );
  const [areaInput, setAreaInput] = useState(
    expedienteActivo ? expedienteActivo.areaJuridica : 'CIVIL'
  );
  const [cargandoAnalisis, setCargandoAnalisis] = useState(false);
  const [analisisResultado, setAnalisisResultado] = useState<any | null>(null);
  const [copiado, setCopiado] = useState(false);

  // Estado del Chat Jurídico
  const [mensajes, setMensajes] = useState<MensajeChat[]>([
    {
      id: 'msg-0',
      rol: 'asistente',
      texto: `Bienvenido al Asistente Jurídico Inteligente JAIRRESTAURA UNO A.
Estoy configurado bajo el ordenamiento jurídico de la República de Colombia (CGP, CPACA, Código de Comercio, Código Sustantivo del Trabajo y Jurisprudencia Constitucional).

¿En qué asunto procesal, estructuración de hechos o fundamentación jurídica puedo colaborar hoy?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputChat, setInputChat] = useState('');
  const [cargandoChat, setCargandoChat] = useState(false);

  // 1. Ejecutar Análisis Riguroso de Hechos
  const handleEjecutarAnalisis = async () => {
    if (!hechosInput.trim()) {
      alert('Por favor ingrese la relación de hechos a examinar.');
      return;
    }

    setCargandoAnalisis(true);
    try {
      const res = await fetch('/api/ai/analyze-facts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hechos: hechosInput,
          areaJuridica: areaInput,
          partes: expedienteActivo?.partes || {},
        }),
      });

      const data = await res.json();
      if (res.ok && data.analisis) {
        setAnalisisResultado(data.analisis);
      } else {
        alert(data.error || 'Error procesando análisis');
      }
    } catch (err: any) {
      alert('Error al conectar con el servidor: ' + err.message);
    } finally {
      setCargandoAnalisis(false);
    }
  };

  // 2. Enviar Consulta en el Chat Jurídico
  const handleEnviarChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputChat.trim() || cargandoChat) return;

    const textoUsuario = inputChat;
    const nuevoMsgUsuario: MensajeChat = {
      id: `msg-${Date.now()}`,
      rol: 'usuario',
      texto: textoUsuario,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMensajes((prev) => [...prev, nuevoMsgUsuario]);
    setInputChat('');
    setCargandoChat(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: textoUsuario,
          historial: mensajes.map((m) => ({ rol: m.rol, texto: m.texto })),
          contextoExpediente: expedienteActivo
            ? {
                codigo: expedienteActivo.codigoInterno,
                cliente: expedienteActivo.clienteNombre,
                area: expedienteActivo.areaJuridica,
                partes: expedienteActivo.partes,
              }
            : null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.respuesta) {
        const nuevoMsgAsistente: MensajeChat = {
          id: `msg-${Date.now() + 1}`,
          rol: 'asistente',
          texto: data.respuesta,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMensajes((prev) => [...prev, nuevoMsgAsistente]);
      } else {
        alert(data.error || 'Error en comunicación con asistente jurídico');
      }
    } catch (err: any) {
      alert('Error al conectar con el asistente: ' + err.message);
    } finally {
      setCargandoChat(false);
    }
  };

  const copiarAnalisis = () => {
    if (!analisisResultado) return;
    navigator.clipboard.writeText(JSON.stringify(analisisResultado, null, 2));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Advertencia Deontológica Obligatoria */}
      <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold">ADVERTENCIA LEGAL DEONTOLÓGICA (LEY 1123 DE 2007):</strong>{' '}
          Los análisis, clasificaciones y sugerencias generados por este asistente de IA constituyen insumos preparatorios de soporte metodológico para el ejercicio profesional. No constituyen conceptos jurídicos definitivos, no sustituyen el criterio del abogado titular y en ningún caso garantizan resultados ante autoridades judiciales o administrativas colombianas.
        </div>
      </div>

      {/* Selector de Modo */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModo('analisis_hechos')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              modo === 'analisis_hechos'
                ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Análisis Estructurado de Hechos
          </button>
          <button
            onClick={() => setModo('chat_juridico')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              modo === 'chat_juridico'
                ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Espacio de Consulta y Debate Jurídico
          </button>
        </div>

        {expedienteActivo && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <span>Expediente:</span>
            <strong className="text-amber-600 dark:text-amber-400">{expedienteActivo.codigoInterno}</strong>
          </div>
        )}
      </div>

      {/* MODO 1: ANÁLISIS ESTRUCTURADO DE HECHOS */}
      {modo === 'analisis_hechos' && (
        <div className="space-y-6">
          {/* Panel de Entrada de Hechos */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Relato Fáctico a Subsumir en la Norma Colombiana
              </h3>

              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">Área procesal:</label>
                <select
                  value={areaInput}
                  onChange={(e) => setAreaInput(e.target.value as any)}
                  className="px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="CIVIL">Civil / Comercial (CGP)</option>
                  <option value="ADMINISTRATIVO">Contencioso (CPACA)</option>
                  <option value="LABORAL_SEGURIDAD_SOCIAL">Laboral / Pensional</option>
                  <option value="CONSTITUCIONAL">Acción de Tutela</option>
                  <option value="PENAL">Penal (Ley 906)</option>
                </select>
              </div>
            </div>

            <textarea
              rows={5}
              value={hechosInput}
              onChange={(e) => setHechosInput(e.target.value)}
              placeholder="Describa los hechos fácticos tal como fueron narrados por el cliente o constan en el expediente (fechas, contratos suscritos, cartas, incumplimientos, pagos, omisiones)..."
              className="w-full p-3.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                La IA clasificará hechos acreditados vs afirmaciones, problemas jurídicos y checklist probatorio.
              </span>
              <button
                onClick={handleEjecutarAnalisis}
                disabled={cargandoAnalisis}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                {cargandoAnalisis ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analizando con Gemini 3.8 Flash...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ejecutar Análisis Jurídico</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Resultados del Análisis Estructurado */}
          {analisisResultado && (
            <div className="space-y-6">
              {/* Resumen Ejecutivo y Problemas Jurídicos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
                    Resumen Ejecutivo del Asunto
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {analisisResultado.resumenEjecutivo}
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2 text-amber-600 dark:text-amber-400">
                    Problemas Jurídicos Identificados
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {analisisResultado.problemasJuridicos?.map((prob: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-mono text-amber-500 font-bold">#{idx + 1}</span>
                        <span>{prob}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Matriz Canónica de 4 Cuadrantes de Hechos */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
                  Clasificación Probatoria y Metodológica de Hechos
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Cuadrante 1: Hechos Acreditados */}
                  <div className="p-4 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold mb-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Hechos con Respaldo Probatorio Indiciario</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 list-disc list-inside">
                      {analisisResultado.clasificacionHechos?.acreditados?.map((h: string, idx: number) => (
                        <li key={idx} className="leading-relaxed">{h}</li>
                      )) || <li>Sin datos</li>}
                    </ul>
                  </div>

                  {/* Cuadrante 2: Afirmaciones de Parte no Demostradas */}
                  <div className="p-4 rounded-lg bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold mb-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Afirmaciones de Parte Pendientes de Probar</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 list-disc list-inside">
                      {analisisResultado.clasificacionHechos?.afirmacionesSinProbar?.map((h: string, idx: number) => (
                        <li key={idx} className="leading-relaxed">{h}</li>
                      )) || <li>Sin datos</li>}
                    </ul>
                  </div>

                  {/* Cuadrante 3: Inferencias Jurídicas */}
                  <div className="p-4 rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400 font-bold mb-2">
                      <Scale className="w-4 h-4 shrink-0" />
                      <span>Inferencias Jurídicas Lógicas</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 list-disc list-inside">
                      {analisisResultado.clasificacionHechos?.inferenciasJuridicas?.map((h: string, idx: number) => (
                        <li key={idx} className="leading-relaxed">{h}</li>
                      )) || <li>Sin datos</li>}
                    </ul>
                  </div>

                  {/* Cuadrante 4: Datos Faltantes / Vacíos */}
                  <div className="p-4 rounded-lg bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50">
                    <div className="flex items-center gap-2 text-rose-800 dark:text-rose-400 font-bold mb-2">
                      <HelpCircle className="w-4 h-4 shrink-0" />
                      <span>Datos Faltantes Indispensables</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 list-disc list-inside">
                      {analisisResultado.clasificacionHechos?.datosFaltantes?.map((h: string, idx: number) => (
                        <li key={idx} className="leading-relaxed">{h}</li>
                      )) || <li>Sin datos</li>}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Vías Jurídicas y Caducidad / Prescripción */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
                  Posibles Vías Procesales y Análisis de Riesgo
                </h4>

                <div className="space-y-3">
                  {analisisResultado.posiblesViasJuridicas?.map((via: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {via.via}
                        </span>
                        <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/40">
                          Caducidad/Prescripción: {via.caducidadOPrescripcion}
                        </span>
                      </div>

                      <div className="text-slate-600 dark:text-slate-400">
                        <strong>Autoridad Competente:</strong> {via.autoridadCompetente}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <div>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
                            Argumentos a Favor:
                          </span>
                          <ul className="space-y-1 list-disc list-inside text-slate-600 dark:text-slate-400">
                            {via.pros?.map((p: string, pIdx: number) => (
                              <li key={pIdx}>{p}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="font-semibold text-rose-700 dark:text-rose-400 block mb-1">
                            Riesgos y Excepciones Probables:
                          </span>
                          <ul className="space-y-1 list-disc list-inside text-slate-600 dark:text-slate-400">
                            {via.contrasYRiesgos?.map((c: string, cIdx: number) => (
                              <li key={cIdx}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checklist Probatorio y Preguntas para el Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3">
                    <HelpCircle className="w-4 h-4 text-amber-500" />
                    <span>Preguntas Clave para el Cliente</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {analisisResultado.preguntasClaveParaElCliente?.map((preg: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-500 font-mono font-bold">{idx + 1}.</span>
                        <span>{preg}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3">
                    <ListChecks className="w-4 h-4 text-emerald-500" />
                    <span>Checklist Probatorio Ineludible</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {analisisResultado.checklistProbatorio?.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <input type="checkbox" className="mt-0.5 rounded text-amber-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Botón Copiar Análisis */}
              <div className="flex justify-end">
                <button
                  onClick={copiarAnalisis}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1.5"
                >
                  {copiado ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiado ? 'Copiado al Portapapeles' : 'Copiar Dictamen JSON'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODO 2: ESPACIO DE CONSULTA Y DEBATE JURÍDICO (CHAT CON GEMINI 3.8 FLASH) */}
      {modo === 'chat_juridico' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col h-[650px] shadow-sm">
          {/* Header del Chat */}
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
              <Scale className="w-4 h-4 text-amber-500" />
              <span>Espacio de Trabajo Jurídico Asistido por IA</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Modelo: gemini-3.8-flash (SDK @google/genai)
            </span>
          </div>

          {/* Historial de Mensajes */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {mensajes.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    m.rol === 'usuario'
                      ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 rounded-br-none'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.texto}</div>
                  <div
                    className={`mt-1.5 text-[9px] font-mono ${
                      m.rol === 'usuario'
                        ? 'text-slate-400 dark:text-slate-800 text-right'
                        : 'text-slate-400 text-left'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>
              </div>
            ))}
            {cargandoChat && (
              <div className="flex justify-start">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  <span>Razonando bajo el ordenamiento procesal colombiano...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input del Chat */}
          <form onSubmit={handleEnviarChat} className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900">
            <input
              type="text"
              value={inputChat}
              onChange={(e) => setInputChat(e.target.value)}
              placeholder="Ej: ¿Cuáles son las causales de casación en materia civil según el Art. 336 del CGP? o Analizar prescripción de 3 años en laboral..."
              className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={cargandoChat || !inputChat.trim()}
              className="p-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl transition-all disabled:opacity-50"
              title="Enviar consulta"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
