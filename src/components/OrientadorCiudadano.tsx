/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — ORIENTADOR JURÍDICO CIUDADANO IA
 * Componente principal de orientación jurídica accesible, comprensible y paso a paso
 * para cualquier ciudadano, integrado en la Escuela Jurídica Inteligente.
 */

import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Building2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  Scale,
  Compass,
  ArrowRight,
  CheckSquare,
  Square,
  BookOpen,
  Info,
  Download,
  AlertOctagon,
  Users,
  Search,
  BookMarked
} from 'lucide-react';

import type {
  ResultadoOrientacionCiudadana,
  ProblemaCiudadanoEntrada,
  BorradorCiudadano,
  TipoBorradorCiudadano,
  ConceptoGlosarioCiudadano,
  NivelAutogestion
} from '../types/legal.ts';

interface OrientadorCiudadanoProps {
  onAbrirInvestigacion?: () => void;
}

export const OrientadorCiudadano: React.FC<OrientadorCiudadanoProps> = ({
  onAbrirInvestigacion
}) => {
  // Estado del formulario de consulta
  const [descripcionProblema, setDescripcionProblema] = useState<string>('');
  const [ciudad, setCiudad] = useState<string>('');
  const [fechaAproximada, setFechaAproximada] = useState<string>('');
  const [notificacionRecibida, setNotificacionRecibida] = useState<boolean>(false);
  const [detalleNotificacion, setDetalleNotificacion] = useState<string>('');
  const [fechaNotificacion, setFechaNotificacion] = useState<string>('');
  const [fechaLimite, setFechaLimite] = useState<string>('');
  const [resultadoEsperado, setResultadoEsperado] = useState<string>('');
  const [documentosDisponiblesTexto, setDocumentosDisponiblesTexto] = useState<string>('');
  const [mostrarDetallesAvanzados, setMostrarDetallesAvanzados] = useState<boolean>(false);

  // Estados de proceso
  const [analizando, setAnalizando] = useState<boolean>(false);
  const [resultado, setResultado] = useState<ResultadoOrientacionCiudadana | null>(null);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  // Estado de checklist de documentos reunidos por el usuario
  const [documentosReunidos, setDocumentosReunidos] = useState<Record<string, boolean>>({});

  // Estados de modales
  const [mostrarModalBorrador, setMostrarModalBorrador] = useState<boolean>(false);
  const [tipoBorradorSeleccionado, setTipoBorradorSeleccionado] = useState<TipoBorradorCiudadano>('DERECHO_PETICION_ART23');
  const [borradorGenerado, setBorradorGenerado] = useState<BorradorCiudadano | null>(null);
  const [generandoBorrador, setGenerandoBorrador] = useState<boolean>(false);

  const [mostrarModalGlosario, setMostrarModalGlosario] = useState<boolean>(false);
  const [glosario, setGlosario] = useState<ConceptoGlosarioCiudadano[]>([]);
  const [busquedaGlosario, setBusquedaGlosario] = useState<string>('');
  const [categoriaGlosario, setCategoriaGlosario] = useState<string>('TODAS');
  const [cargandoGlosario, setCargandoGlosario] = useState<boolean>(false);

  // Cargar glosario pedagógico al inicio
  useEffect(() => {
    const cargarGlosario = async () => {
      try {
        setCargandoGlosario(true);
        const res = await fetch('/api/orientador/glosario');
        if (res.ok) {
          const data = await res.json();
          setGlosario(data.glosario || []);
        }
      } catch (err) {
        console.warn('Error cargando glosario:', err);
      } finally {
        setCargandoGlosario(false);
      }
    };
    cargarGlosario();
  }, []);

  // Plantillas de ejemplo rápido para el usuario
  const aplicarEjemploRapido = (ejemplo: {
    desc: string;
    ciudad: string;
    resultado: string;
    notif?: boolean;
    detalleNotif?: string;
  }) => {
    setDescripcionProblema(ejemplo.desc);
    setCiudad(ejemplo.ciudad);
    setResultadoEsperado(ejemplo.resultado);
    setNotificacionRecibida(!!ejemplo.notif);
    setDetalleNotificacion(ejemplo.detalleNotif || '');
    setErrorValidacion(null);
  };

  // Enviar consulta de orientación
  const handleConsultar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!descripcionProblema.trim() || descripcionProblema.trim().length < 10) {
      setErrorValidacion('Por favor describe lo que ocurre con al menos 10 caracteres para poder analizar tu caso.');
      return;
    }

    try {
      setAnalizando(true);
      setErrorValidacion(null);

      const docsArray = documentosDisponiblesTexto
        ? documentosDisponiblesTexto.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const payload: ProblemaCiudadanoEntrada = {
        descripcionProblema: descripcionProblema.trim(),
        ciudad: ciudad.trim() || undefined,
        fechaAproximada: fechaAproximada.trim() || undefined,
        notificacionRecibida,
        detalleNotificacion: detalleNotificacion.trim() || undefined,
        fechaNotificacion: fechaNotificacion.trim() || undefined,
        fechaLimite: fechaLimite.trim() || undefined,
        resultadoEsperado: resultadoEsperado.trim() || undefined,
        documentosDisponibles: docsArray
      };

      const res = await fetch('/api/orientador/orientar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setResultado(data.orientacion);
        // Inicializar documentos checklist
        const inicialChecklist: Record<string, boolean> = {};
        (data.orientacion.documentosRequeridos || []).forEach((d: any) => {
          inicialChecklist[d.id] = false;
        });
        setDocumentosReunidos(inicialChecklist);
      } else {
        const err = await res.json();
        setErrorValidacion(err.error || 'Error al procesar la orientación.');
      }
    } catch (err: any) {
      setErrorValidacion('Error de conexión con el servidor. Intenta nuevamente.');
    } finally {
      setAnalizando(false);
    }
  };

  // Limpiar consulta para reiniciar
  const handleReiniciarConsulta = () => {
    setDescripcionProblema('');
    setCiudad('');
    setFechaAproximada('');
    setNotificacionRecibida(false);
    setDetalleNotificacion('');
    setFechaNotificacion('');
    setFechaLimite('');
    setResultadoEsperado('');
    setDocumentosDisponiblesTexto('');
    setResultado(null);
    setErrorValidacion(null);
    setDocumentosReunidos({});
  };

  // Alternar checklist de documentos
  const toggleDocumentoReunido = (id: string) => {
    setDocumentosReunidos((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Generar borrador
  const handleGenerarBorrador = async (tipo: TipoBorradorCiudadano) => {
    try {
      setGenerandoBorrador(true);
      setTipoBorradorSeleccionado(tipo);

      const res = await fetch('/api/orientador/generar-borrador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          entrada: {
            descripcionProblema,
            ciudad,
            resultadoEsperado
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBorradorGenerado(data.borrador);
        setMostrarModalBorrador(true);
      }
    } catch (err) {
      console.warn('Error generando borrador:', err);
    } finally {
      setGenerandoBorrador(false);
    }
  };

  const copiarAlPortapapeles = (texto: string, etiqueta: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(etiqueta);
    setTimeout(() => setCopiado(null), 2500);
  };

  const imprimirGuia = () => {
    window.print();
  };

  // Color y estilo según nivel de autogestión
  const renderBadgeAutogestion = (nivel: NivelAutogestion) => {
    switch (nivel) {
      case 'AUTOGESTIONABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Nivel 1: Puedes hacerlo por tu cuenta (Sin Abogado)
          </span>
        );
      case 'CONVIENE_ASESORIA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Info className="w-3.5 h-3.5" /> Nivel 2: Conviene Asesoría Previa o Conciliación
          </span>
        );
      case 'VERIFICAR_REQUISITO_ABOGADO':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Scale className="w-3.5 h-3.5" /> Nivel 3: Verificar Cuantía Procesal (Art. 25 CGP)
          </span>
        );
      case 'ASISTENCIA_PROFESIONAL_PRIORITARIA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <AlertOctagon className="w-3.5 h-3.5" /> Nivel 4: Requiere Abogado Titulado Obligatorio
          </span>
        );
    }
  };

  // Filtrado de glosario
  const glosarioFiltrado = glosario.filter((item) => {
    const matchCat = categoriaGlosario === 'TODAS' || item.categoria === categoriaGlosario;
    const matchBusqueda =
      !busquedaGlosario ||
      item.termino.toLowerCase().includes(busquedaGlosario.toLowerCase()) ||
      item.definicionClara.toLowerCase().includes(busquedaGlosario.toLowerCase()) ||
      item.enPalabrasSencillas.toLowerCase().includes(busquedaGlosario.toLowerCase());
    return matchCat && matchBusqueda;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* 1. HERO Y PRESENTACIÓN */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 md:p-8 shadow-xl border border-slate-700/60">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
              <Compass className="w-3.5 h-3.5" />
              ORIENTADOR JURÍDICO CIUDADANO IA · COLOMBIA
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              ¿Tienes un problema legal? Te ayudamos a entender qué puedes hacer.
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Describe tu situación en tus propias palabras y recibe una guía inicial gratuita, comprensible,
              prudente y organizada paso a paso: qué hacer primero, qué documentos necesitas, a qué entidad acudir
              y si puedes gestionarlo tú mismo o requieres un abogado.
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-2 shrink-0">
            <button
              onClick={() => setMostrarModalGlosario(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs md:text-sm font-semibold border border-slate-600 transition shadow-sm"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              Glosario Ciudadano
            </button>
            <div className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 text-xs border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> Acceso Libre sin Registro
            </div>
          </div>
        </div>
      </div>

      {/* 2. FORMULARIO PRINCIPAL «CUÉNTAME TU PROBLEMA» */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
        <div>
          <label className="block text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Cuéntanos qué está pasando:
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Por ejemplo: <em>no me pagan el salario, tengo un problema con mi arrendador, me hicieron un cobro que no reconozco o recibí un documento del juzgado.</em>
          </p>
          <textarea
            value={descripcionProblema}
            onChange={(e) => setDescripcionProblema(e.target.value)}
            rows={5}
            placeholder="Escribe aquí con tus propias palabras todo lo que recuerdes: qué ocurrió, con quién es el conflicto, desde cuándo pasa y qué te preocupa..."
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition resize-y"
          />
        </div>

        {/* Ejemplos rápidos para hacer clic */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            O selecciona una situación frecuente para empezar:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                aplicarEjemploRapido({
                  desc: 'Renuncié a mi empleo hace dos meses y mi jefe no me ha pagado la liquidación de prestaciones sociales ni los salarios atrasados.',
                  ciudad: 'Bogotá D.C.',
                  resultado: 'Cobrar mi liquidación y cesantías'
                })
              }
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
            >
              💼 No me pagan liquidación laboral
            </button>
            <button
              type="button"
              onClick={() =>
                aplicarEjemploRapido({
                  desc: 'El inquilino de mi casa lleva 3 meses sin pagar el arriendo y se niega a entregar las llaves del inmueble.',
                  ciudad: 'Medellín',
                  resultado: 'Recuperar el inmueble y los cánones'
                })
              }
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
            >
              🏠 Inquilino no paga arriendo
            </button>
            <button
              type="button"
              onClick={() =>
                aplicarEjemploRapido({
                  desc: 'Compré un electrodoméstico que falló a los pocos días, la tienda se niega a cambiarlo y no me devuelven el dinero.',
                  ciudad: 'Cali',
                  resultado: 'Efectividad de la garantía o devolución de dinero'
                })
              }
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
            >
              🛒 Producto con defecto sin garantía
            </button>
            <button
              type="button"
              onClick={() =>
                aplicarEjemploRapido({
                  desc: 'Me llegó una citación o notificación judicial con un mandamiento de pago por una deuda que ya había cancelado parcialmente.',
                  ciudad: 'Barranquilla',
                  resultado: 'Defenderme del cobro ejecutivo judicial',
                  notif: true,
                  detalleNotif: 'Auto de mandamiento de pago de juzgado civil'
                })
              }
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
            >
              ⚖️ Notificación de mandamiento de pago
            </button>
          </div>
        </div>

        {/* Panel Desplegable de Detalles Opcionales */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
          <button
            type="button"
            onClick={() => setMostrarDetallesAvanzados(!mostrarDetallesAvanzados)}
            className="flex items-center justify-between w-full text-left text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-500 transition"
          >
            <span className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-500" />
              ¿Deseas agregar detalles para mayor precisión? (Ciudad, notificaciones, fechas)
            </span>
            {mostrarDetallesAvanzados ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {mostrarDetallesAvanzados && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Ciudad o Municipio donde ocurrieron los hechos:
                </label>
                <input
                  type="text"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  placeholder="Ej. Bogotá, Cali, Medellín, Bucaramanga..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Fecha aproximada en que ocurrieron los hechos:
                </label>
                <input
                  type="date"
                  value={fechaAproximada}
                  onChange={(e) => setFechaAproximada(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificacionRecibida}
                    onChange={(e) => setNotificacionRecibida(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    ¿Has recibido alguna notificación, citación o correo oficial de un juzgado o entidad?
                  </span>
                </label>

                {notificacionRecibida && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6 border-l-2 border-amber-500 mt-2">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1">
                        ¿Qué documento recibiste exactamente?
                      </label>
                      <input
                        type="text"
                        value={detalleNotificacion}
                        onChange={(e) => setDetalleNotificacion(e.target.value)}
                        placeholder="Ej. Auto mandamiento de pago, citación de comisaría..."
                        className="w-full px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1">
                        Fecha en que te llegó el correo o documento físico:
                      </label>
                      <input
                        type="date"
                        value={fechaNotificacion}
                        onChange={(e) => setFechaNotificacion(e.target.value)}
                        className="w-full px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  ¿Qué resultado esperas o necesitas alcanzar?
                </label>
                <input
                  type="text"
                  value={resultadoEsperado}
                  onChange={(e) => setResultadoEsperado(e.target.value)}
                  placeholder="Ej. Que me paguen, no entregar la casa, anular un cobro..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Documentos que tienes actualmente (separados por coma):
                </label>
                <input
                  type="text"
                  value={documentosDisponiblesTexto}
                  onChange={(e) => setDocumentosDisponiblesTexto(e.target.value)}
                  placeholder="Ej. Contrato, recibos, chats de WhatsApp, factura..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          )}
        </div>

        {errorValidacion && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {errorValidacion}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          {resultado && (
            <button
              type="button"
              onClick={handleReiniciarConsulta}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Nueva Consulta
            </button>
          )}

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={handleConsultar}
              disabled={analizando}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-sm shadow-md transition disabled:opacity-50"
            >
              {analizando ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Analizando situación bajo la ley colombiana...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Orientarme y Trazar mi Ruta
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. RESULTADO DE ORIENTACIÓN: 9 SECCIONES ESTRUCTURADAS (A - I) */}
      {resultado && (
        <div className="space-y-8 animate-fadeIn">
          {/* BANNER DE URGENCIA / TÉRMINO PERENTORIO EN CURSO */}
          {resultado.urgencia.esUrgente && (
            <div className="rounded-2xl bg-red-500/10 dark:bg-red-950/30 border-2 border-red-500/50 p-6 shadow-lg space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-red-500 text-white shrink-0 animate-pulse">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-600 text-white">
                      ALERTA DE TÉRMINO EN CURSO · {resultado.urgencia.nivelUrgencia}
                    </span>
                    {resultado.urgencia.plazoVerificar && (
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Plazo: {resultado.urgencia.plazoVerificar}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-red-950 dark:text-red-200">
                    {resultado.urgencia.motivoUrgencia}
                  </h3>
                  <p className="text-sm text-red-900 dark:text-red-300 leading-relaxed font-medium">
                    {resultado.urgencia.advertenciaInmediata}
                  </p>
                </div>
              </div>

              {resultado.urgencia.accionesInmediatas && resultado.urgencia.accionesInmediatas.length > 0 && (
                <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-4 border border-red-200 dark:border-red-900/60 space-y-2">
                  <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider block">
                    Acciones Inmediatas para Hoy:
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-800 dark:text-slate-200">
                    {resultado.urgencia.accionesInmediatas.map((acc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                        <span>{acc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* BARRA SUPERIOR DE ACCIONES RÁPIDAS (Imprimir, Copiar, Generar Borrador) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Materia detectada:</span>
              <div className="flex flex-wrap gap-1.5">
                {resultado.categoriasIdentificadas.map((cat, i) => (
                  <span key={i} className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleGenerarBorrador('DERECHO_PETICION_ART23')}
                disabled={generandoBorrador}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" />
                Generar Borrador de Petición
              </button>
              <button
                type="button"
                onClick={imprimirGuia}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Guía
              </button>
              <button
                type="button"
                onClick={() => copiarAlPortapapeles(resultado.resumenSituacion.loQueEntendemos, 'resumen')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
              >
                {copiado === 'resumen' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                Copiar
              </button>
            </div>
          </div>

          {/* SECCIÓN A: LO QUE ENTENDEMOS DE TU CASO */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold inline-flex items-center justify-center">A</span>
                Resumen de la Situación: Lo que entendemos de tu caso
              </h2>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
              {resultado.resumenSituacion.loQueEntendemos}
            </p>

            {/* Distinción probatoria de rigor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs space-y-2">
                <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                  Datos que faltan por confirmar para mayor certeza:
                </span>
                <ul className="space-y-1 list-disc list-inside text-slate-700 dark:text-slate-300">
                  {resultado.resumenSituacion.datosFaltantesPorConfirmar.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  Distinción Deontológica y Probatoria:
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  En el derecho colombiano (Art. 167 CGP), quien afirma un hecho debe probarlo. Esta guía distingue entre los <strong>hechos relatados</strong> por ti y las <strong>pruebas o documentos revisados</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN B: OPCIONES LEGALES DISPONIBLES */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold inline-flex items-center justify-center">B</span>
              Opciones Legales Disponibles (Alternativas Viables)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {resultado.opcionesLegales.map((op, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                      Opción {i + 1}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{op.titulo}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{op.descripcion}</p>
                    <div className="pt-2">
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Efecto legal:</span>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{op.consecuencias}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Ventajas:</span>
                    <ul className="space-y-0.5 text-slate-600 dark:text-slate-400">
                      {op.pros.map((p, idx) => (
                        <li key={idx} className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-500 shrink-0" /> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN C: QUÉ DEBES HACER PRIMERO */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-2xl border border-amber-500/30 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold inline-flex items-center justify-center">C</span>
                Qué Debes Hacer Primero (Paso Inmediato)
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                {resultado.queHacerPrimero.plazoRecomendado}
              </span>
            </div>
            <p className="text-base font-bold text-amber-900 dark:text-amber-200">
              {resultado.queHacerPrimero.accion}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <strong>¿Por qué es importante?:</strong> {resultado.queHacerPrimero.porQueEsImportante}
            </p>
          </div>

          {/* SECCIÓN D: PROCEDIMIENTO PASO A PASO */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold inline-flex items-center justify-center">D</span>
                Procedimiento Paso a Paso (Ruta de Actuación Numerada)
              </h2>
              <span className="text-xs text-slate-500">{resultado.procedimientoPasoAPaso.length} etapas consecutivas</span>
            </div>

            <div className="space-y-4">
              {resultado.procedimientoPasoAPaso.map((paso, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-950/60 space-y-3 hover:border-amber-500/40 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-sm inline-flex items-center justify-center border border-amber-500/30">
                        {paso.orden}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{paso.titulo}</h3>
                    </div>
                    {paso.enlaceCanalOficial && (
                      <a
                        href={paso.enlaceCanalOficial}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Canal Oficial <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">¿Para qué sirve?</span>
                      <p className="text-slate-700 dark:text-slate-300">{paso.paraQueSirve}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">¿Qué debes hacer concretamente?</span>
                      <p className="text-slate-700 dark:text-slate-300">{paso.queHacer}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                    <div>
                      <span className="font-semibold text-slate-500 block mb-0.5">Ante quién acudir:</span>
                      <span className="text-slate-800 dark:text-slate-200">{paso.anteQuien}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500 block mb-0.5">¿Qué esperar?:</span>
                      <span className="text-slate-800 dark:text-slate-200">{paso.queEsperar}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-amber-600 dark:text-amber-400 block mb-0.5">¿Qué hacer si no responden?:</span>
                      <span className="text-slate-800 dark:text-slate-200">{paso.queHacerSiFalla}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN E: ¿PUEDES HACERLO POR TU CUENTA O NECESITAS ABOGADO? */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold inline-flex items-center justify-center">E</span>
                ¿Puedes realizar este trámite por tu cuenta o necesitas un abogado?
              </h2>
              {renderBadgeAutogestion(resultado.clasificacionAutogestion.nivel)}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block">
                Fundamento de la Clasificación Procesal (Código General del Proceso):
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                {resultado.clasificacionAutogestion.justificacion}
              </p>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 mt-2">
                <strong>Advertencia importante sobre representación:</strong> {resultado.clasificacionAutogestion.advertenciaRepresentacion}
              </div>
            </div>
          </div>

          {/* SECCIÓN F: LISTA DE VERIFICACIÓN DE DOCUMENTOS (CHECKLIST INTERACTIVO) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold inline-flex items-center justify-center">F</span>
                Lista de Verificación de Documentos a Preparar
              </h2>
              <span className="text-xs font-medium text-slate-500">
                {Object.values(documentosReunidos).filter(Boolean).length} de {resultado.documentosRequeridos.length} documentos reunidos
              </span>
            </div>

            <div className="space-y-3">
              {resultado.documentosRequeridos.map((doc) => {
                const estaReunido = !!documentosReunidos[doc.id];
                return (
                  <div
                    key={doc.id}
                    onClick={() => toggleDocumentoReunido(doc.id)}
                    className={`p-4 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                      estaReunido
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40 text-slate-900 dark:text-slate-100'
                        : 'bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <button type="button" className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400">
                      {estaReunido ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-400" />}
                    </button>
                    <div className="space-y-1 text-xs flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${estaReunido ? 'line-through text-slate-500' : ''}`}>
                          {doc.nombre}
                        </span>
                        {doc.obligatorio && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                            Obligatorio
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">{doc.descripcion}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px] text-slate-500">
                        <span><strong>Cómo obtenerlo:</strong> {doc.comoObtenerlo}</span>
                        <span><strong>Cómo conservarlo:</strong> {doc.comoConservarlo}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN G: DÓNDE ACUDIR Y ORIENTACIÓN GRATUITA EN COLOMBIA */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold inline-flex items-center justify-center">G</span>
              Dónde Acudir y Alternativas de Orientación Gratuita
            </h2>

            {/* Alternativas Gratuitas destacadas (Consultorios, Personería, Defensoría) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {resultado.orientacionGratuitaDisponible.map((org, i) => (
                <div key={i} className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-2 text-xs flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                      Orientación 100% Gratuita
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{org.entidad}</h3>
                    <p className="text-slate-600 dark:text-slate-400">{org.descripcion}</p>
                    <p className="text-[11px] text-slate-500"><strong>Requisitos:</strong> {org.requisitos}</p>
                  </div>
                  {org.enlaceOficial && (
                    <a
                      href={org.enlaceOficial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-2 border-t border-indigo-200/40"
                    >
                      Sitio Oficial <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* Entidades Competentes Oficiales */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Entidades o Autoridades Competentes según la Materia:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {resultado.dondeAcudir.map((ent, i) => (
                  <div key={i} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs space-y-1">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">{ent.nombre}</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">{ent.competencia}</p>
                    {ent.enlaceOficial && (
                      <a
                        href={ent.enlaceOficial}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 hover:underline pt-1"
                      >
                        Portal Institucional (.gov.co) <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECCIÓN H E I: QUÉ HACER DESPUÉS Y PRÓXIMO PASO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold inline-flex items-center justify-center">H</span>
                Qué Debes Hacer Después
              </h2>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {resultado.queHacerDespues.map((desp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{desp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold inline-flex items-center justify-center">I</span>
                  Próximo Paso Recomendado Hoy
                </h2>
                <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">
                    Tu primera acción concreta:
                  </span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {resultado.proximoPasoInmediato}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleGenerarBorrador('DERECHO_PETICION_ART23')}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition"
                >
                  <FileText className="w-3.5 h-3.5" /> Generar Borrador Ahora
                </button>
              </div>
            </div>
          </div>

          {/* FUENTES JURÍDICAS VERIFICADAS ASOCIADAS */}
          <div className="p-4 rounded-xl bg-slate-100/60 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-500" />
              Fuentes Oficiales y Normas Verificadas de Respaldo:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {resultado.fuentesOficiales.map((f, i) => (
                <div key={i} className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{f.identificador}</span>
                    <span className="text-[10px] text-slate-500 block truncate max-w-xs">{f.epigrafeOTitulo}</span>
                  </div>
                  <a
                    href={f.enlaceVerificado || f.enlaceOficial}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 dark:text-amber-400 hover:underline shrink-0 ml-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* AVISO DEONTOLÓGICO Y LEGAL FINAL */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <p><strong>Aviso Legal y Deontológico:</strong> {resultado.avisoLegal}</p>
          </div>
        </div>
      )}

      {/* MODAL 1: ASISTENTE DE BORRADOR CIUDADANO */}
      {mostrarModalBorrador && borradorGenerado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
            {/* Header del Modal */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 rounded-t-2xl">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Asistente de Borradores Ciudadanos
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {borradorGenerado.titulo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalBorrador(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Selector de Tipo de Borrador */}
            <div className="p-4 bg-slate-100/50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleGenerarBorrador('DERECHO_PETICION_ART23')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  tipoBorradorSeleccionado === 'DERECHO_PETICION_ART23'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Derecho de Petición (Art. 23 CP)
              </button>
              <button
                type="button"
                onClick={() => handleGenerarBorrador('RECLAMACION_DIRECTA_CONSUMIDOR')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  tipoBorradorSeleccionado === 'RECLAMACION_DIRECTA_CONSUMIDOR'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Reclamo Consumidor (Ley 1480)
              </button>
              <button
                type="button"
                onClick={() => handleGenerarBorrador('COMUNICACION_ARRENDAMIENTO')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  tipoBorradorSeleccionado === 'COMUNICACION_ARRENDAMIENTO'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Carta Arrendamiento (Ley 820)
              </button>
              <button
                type="button"
                onClick={() => handleGenerarBorrador('SOLICITUD_CONCILIACION_EXTRAJUDICIAL')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  tipoBorradorSeleccionado === 'SOLICITUD_CONCILIACION_EXTRAJUDICIAL'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Solicitud Conciliación (Ley 2220)
              </button>
            </div>

            {/* Contenido Editable / Previsualización */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <strong>Instrucciones para radicar:</strong> Debes reemplazar cada uno de los campos entre corchetes <code>[COMPLETAR: ...]</code> con tus datos reales antes de imprimir, firmar o enviar por correo.
                </div>
              </div>

              <textarea
                value={borradorGenerado.contenidoTexto}
                onChange={(e) =>
                  setBorradorGenerado({
                    ...borradorGenerado,
                    contenidoTexto: e.target.value
                  })
                }
                rows={16}
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Footer con botones de copia y descarga */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setMostrarModalBorrador(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                Cerrar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copiarAlPortapapeles(borradorGenerado.contenidoTexto, 'borrador')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
                >
                  {copiado === 'borrador' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  Copiar Texto
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([borradorGenerado.contenidoTexto], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${borradorGenerado.tipo}_JairRestaura.txt`;
                    link.click();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar Archivo (.txt)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: GLOSARIO PEDAGÓGICO CIUDADANO */}
      {mostrarModalGlosario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
            {/* Header del Glosario */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 rounded-t-2xl">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Modo de Aprendizaje Ciudadano
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  Glosario de Términos Jurídicos en Palabras Sencillas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalGlosario(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Barra de Búsqueda y Filtros de Categoría */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={busquedaGlosario}
                  onChange={(e) => setBusquedaGlosario(e.target.value)}
                  placeholder="Buscar término (ej. tutela, demanda, embargo, conciliación, caducidad)..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto text-xs">
                {['TODAS', 'CONCEPTOS_BASICOS', 'PROCEDIMIENTOS', 'DERECHOS', 'TERMINOS_Y_PLAZOS'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoriaGlosario(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition ${
                      categoriaGlosario === cat
                        ? 'bg-amber-600 text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {cat.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Listado de Términos */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-300">
                Todos los ejemplos contenidos en este glosario están rotulados como <strong>[EJEMPLO HIPOTÉTICO EDUCATIVO - NO ES UN CASO REAL]</strong> con propósitos formativos.
              </div>

              {glosarioFiltrado.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No se encontraron términos que coincidan con la búsqueda.
                </div>
              ) : (
                glosarioFiltrado.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <BookMarked className="w-4 h-4 text-amber-500" />
                        {item.termino}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.categoria.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      {item.definicionClara}
                    </p>

                    <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-300">
                      <strong>En palabras sencillas:</strong> {item.enPalabrasSencillas}
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800 italic">
                      <span className="font-semibold text-amber-600 dark:text-amber-400 not-italic block mb-0.5">
                        Caso Práctico:
                      </span>
                      {item.ejemploHipotetico}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px] text-slate-500">
                      <span><strong>¿Qué NO es?:</strong> {item.queNoEs}</span>
                      <span><strong>Fundamento legal:</strong> {item.baseLegal}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-950 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setMostrarModalGlosario(false)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 transition"
              >
                Cerrar Glosario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
