/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — ESCUELA JURÍDICA INTELIGENTE
 * Módulo pedagógico y de formación para estudiantes de Derecho, consultorios jurídicos y semilleros de investigación.
 * Conectado con Investigación Jurídica Oficial, Tutor Académico IA y generador de borradores didácticos.
 * Espacio de estudio rigurosamente separado de los expedientes de clientes reales.
 */

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  Route as RouteIcon,
  HelpCircle,
  FileText,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Scale,
  BrainCircuit,
  BookmarkCheck,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  Trash2,
  Save,
  BookMarked
} from 'lucide-react';
import type {
  CasoAcademico,
  EstadoEstudioCaso,
  RutaProcesalAcademica,
  TutorAcademicoModo,
  DocumentoAcademicoTipo,
  DocumentoAcademicoBorrador,
  FuenteJuridicaOficial
} from '../types/legal';

type TabView = 'casos' | 'ruta' | 'tutor' | 'investigacion' | 'borradores';

export const EscuelaJuridicaView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>('casos');
  const [casos, setCasos] = useState<CasoAcademico[]>([]);
  const [selectedCasoId, setSelectedCasoId] = useState<string | null>(null);
  const [cargandoCasos, setCargandoCasos] = useState<boolean>(true);
  const [copiado, setCopiado] = useState<string | null>(null);

  // Estados para nuevo caso o análisis
  const [mostrarModalNuevoCaso, setMostrarModalNuevoCaso] = useState<boolean>(false);
  const [nuevoTitulo, setNuevoTitulo] = useState<string>('');
  const [nuevoArea, setNuevoArea] = useState<string>('CONSTITUCIONAL');
  const [nuevoMateria, setNuevoMateria] = useState<string>('');
  const [nuevoHechos, setNuevoHechos] = useState<string>('');
  const [analizandoCaso, setAnalizandoCaso] = useState<boolean>(false);
  const [analisisTemp, setAnalisisTemp] = useState<any>(null);

  // Estados para Ruta Procesal
  const [rutaMateria, setRutaMateria] = useState<string>('CONSTITUCIONAL');
  const [rutaProcedimiento, setRutaProcedimiento] = useState<string>('TUTELA');
  const [rutaData, setRutaData] = useState<RutaProcesalAcademica | null>(null);
  const [cargandoRuta, setCargandoRuta] = useState<boolean>(false);

  // Estados para Tutor Académico
  const [tutorModo, setTutorModo] = useState<TutorAcademicoModo>('CONCEPTOS');
  const [tutorTema, setTutorTema] = useState<string>('Defecto Fáctico en Acción de Tutela');
  const [tutorPregunta, setTutorPregunta] = useState<string>('');
  const [tutorRespuesta, setTutorRespuesta] = useState<any>(null);
  const [cargandoTutor, setCargandoTutor] = useState<boolean>(false);

  // Estados para Investigación conectada
  const [queryInvestigacion, setQueryInvestigacion] = useState<string>('');
  const [tipoNormaFiltro, setTipoNormaFiltro] = useState<string>('TODOS');
  const [fuentesResultados, setFuentesResultados] = useState<FuenteJuridicaOficial[]>([]);
  const [cargandoFuentes, setCargandoFuentes] = useState<boolean>(false);

  // Estados para Borradores Académicos
  const [tipoBorrador, setTipoBorrador] = useState<DocumentoAcademicoTipo>('FICHA_JURISPRUDENCIAL');
  const [borradorGenerado, setBorradorGenerado] = useState<DocumentoAcademicoBorrador | null>(null);
  const [generandoBorrador, setGenerandoBorrador] = useState<boolean>(false);

  // Cargar casos académicos al montar
  useEffect(() => {
    cargarCasosAcademicos();
  }, []);

  const cargarCasosAcademicos = async () => {
    try {
      setCargandoCasos(true);
      const res = await fetch('/api/escuela/casos');
      if (res.ok) {
        const data = await res.json();
        setCasos(data.casos || []);
        if (data.casos && data.casos.length > 0 && !selectedCasoId) {
          setSelectedCasoId(data.casos[0].id);
        }
      }
    } catch (e) {
      console.error('Error cargando casos académicos:', e);
    } finally {
      setCargandoCasos(false);
    }
  };

  const casoSeleccionado = casos.find((c) => c.id === selectedCasoId) || casos[0] || null;

  // Analizar caso fáctico con IA docente
  const handleAnalizarCasoIA = async () => {
    if (!nuevoHechos.trim()) return;
    try {
      setAnalizandoCaso(true);
      const res = await fetch('/api/escuela/analyze-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hechos: nuevoHechos,
          areaDerecho: nuevoArea,
          titulo: nuevoTitulo || 'Caso de Estudio',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnalisisTemp(data.analisis);
      }
    } catch (e) {
      console.error('Error analizando caso:', e);
    } finally {
      setAnalizandoCaso(false);
    }
  };

  // Guardar caso académico
  const handleGuardarCaso = async () => {
    if (!nuevoTitulo.trim() || !nuevoHechos.trim()) return;
    try {
      const payload: Partial<CasoAcademico> = {
        titulo: nuevoTitulo,
        areaDerecho: nuevoArea as any,
        materiaEspecifica: nuevoMateria || 'General',
        hechosOriginales: nuevoHechos,
        hechosAcreditados: analisisTemp?.hechosAcreditados || [nuevoHechos],
        inferenciasJuridicas: analisisTemp?.inferenciasJuridicas || [],
        informacionFaltanteYPorVerificar: analisisTemp?.informacionFaltanteYPorVerificar || [],
        problemasJuridicos: analisisTemp?.problemasJuridicos || [],
        preguntasPorResolver: analisisTemp?.preguntasPorResolver || [],
        fuentesRecomendadas: analisisTemp?.fuentesRecomendadas || [],
        lineasAnalisis: analisisTemp?.lineasAnalisis || [],
        estadoEstudio: 'EN_ANALISIS',
        proximaActividadAcademica: analisisTemp?.proximaActividadSugerida || 'Comprobar requisitos formales',
        tareasInvestigacion: [
          { id: 'tar-1', descripcion: 'Verificar normas y jurisprudencia aplicables en catálogo oficial', completada: false },
          { id: 'tar-2', descripcion: 'Comprobar términos de caducidad o prescripción', completada: false },
          { id: 'tar-3', descripcion: 'Elaborar borrador de concepto o ficha jurídica', completada: false },
        ],
      };

      const res = await fetch('/api/escuela/casos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setCasos([data.caso, ...casos]);
        setSelectedCasoId(data.caso.id);
        setMostrarModalNuevoCaso(false);
        setNuevoTitulo('');
        setNuevoHechos('');
        setNuevoMateria('');
        setAnalisisTemp(null);
      }
    } catch (e) {
      console.error('Error guardando caso:', e);
    }
  };

  // Cambiar estado del caso
  const handleActualizarEstadoCaso = async (casoId: string, nuevoEstado: EstadoEstudioCaso) => {
    try {
      const res = await fetch(`/api/escuela/casos/${casoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estadoEstudio: nuevoEstado }),
      });
      if (res.ok) {
        setCasos(casos.map((c) => (c.id === casoId ? { ...c, estadoEstudio: nuevoEstado } : c)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Marcar tarea de investigación
  const handleToggleTarea = async (caso: CasoAcademico, tareaId: string) => {
    const tareasActualizadas = caso.tareasInvestigacion.map((t) =>
      t.id === tareaId ? { ...t, completada: !t.completada } : t
    );
    try {
      const res = await fetch(`/api/escuela/casos/${caso.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tareasInvestigacion: tareasActualizadas }),
      });
      if (res.ok) {
        setCasos(casos.map((c) => (c.id === caso.id ? { ...c, tareasInvestigacion: tareasActualizadas } : c)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Consultar Ruta Procesal
  const handleConsultarRuta = async (materiaParam?: string, procParam?: string) => {
    try {
      setCargandoRuta(true);
      const res = await fetch('/api/escuela/procedural-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materia: materiaParam || rutaMateria,
          tipoProcedimiento: procParam || rutaProcedimiento,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRutaData(data.ruta);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCargandoRuta(false);
    }
  };

  // Consultar Tutor Académico
  const handleConsultarTutor = async () => {
    try {
      setCargandoTutor(true);
      const res = await fetch('/api/escuela/tutor-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modo: tutorModo,
          temaOCaso: tutorTema,
          preguntaEstudiante: tutorPregunta,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTutorRespuesta(data.tutor);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCargandoTutor(false);
    }
  };

  // Buscar en el catálogo de fuentes oficiales
  const handleBuscarFuentes = async () => {
    try {
      setCargandoFuentes(true);
      const params = new URLSearchParams();
      if (queryInvestigacion) params.append('q', queryInvestigacion);
      if (tipoNormaFiltro !== 'TODOS') params.append('tipo', tipoNormaFiltro);
      const res = await fetch(`/api/investigacion/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFuentesResultados(data.resultados || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCargandoFuentes(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'investigacion' && fuentesResultados.length === 0) {
      handleBuscarFuentes();
    }
    if (activeTab === 'ruta' && !rutaData) {
      handleConsultarRuta();
    }
  }, [activeTab]);

  // Generar borrador académico
  const handleGenerarBorrador = async () => {
    try {
      setGenerandoBorrador(true);
      const res = await fetch('/api/escuela/generate-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: tipoBorrador,
          casoId: casoSeleccionado?.id,
          titulo: casoSeleccionado?.titulo,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setBorradorGenerado(data.borrador);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerandoBorrador(false);
    }
  };

  const handleCopiarTexto = (texto: string, clave: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(clave);
    setTimeout(() => setCopiado(null), 2500);
  };

  const modosTutor = [
    { id: 'CONCEPTOS', label: 'Conceptos Jurídicos', desc: 'Definición dogmática, fundamento legal y errores usuales' },
    { id: 'CASOS_PRACTICOS', label: 'Casos Prácticos', desc: 'Subsunción fáctica y ponderación de soluciones' },
    { id: 'METODO_RESOLUCION', label: 'Método IRAC / Silogismo', desc: 'Técnica de resolución sistemática de problemas' },
    { id: 'PREPARACION_EXAMENES', label: 'Preparatorios / ECAES', desc: 'Preguntas trampa y núcleos esenciales evaluados' },
    { id: 'PREGUNTAS_PRACTICA', label: 'Quiz con Retroalimentación', desc: 'Preguntas tipo Saber Pro con análisis de opciones' },
    { id: 'ENSAYOS_TRABAJOS', label: 'Estructura Monográfica', desc: 'Pregunta problema, hipótesis y marco teórico' },
    { id: 'LECTURA_GUIADA', label: 'Lectura de Sentencias', desc: 'Extracción de ratio decidendi y consideraciones' },
    { id: 'ARGUMENTACION', label: 'Test de Proporcionalidad', desc: 'Idoneidad, necesidad y ponderación estricta' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header y Banner Institucional de la Escuela Jurídica */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/80 rounded-2xl p-6 border border-amber-500/30 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase bg-amber-400 text-slate-950 rounded-full flex items-center gap-1.5 shadow-sm">
                <GraduationCap className="w-3.5 h-3.5 stroke-[2.5]" />
                ESCUELA JURÍDICA INTELIGENTE
              </span>
              <span className="text-xs text-amber-300 font-mono tracking-wide flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Entorno Pedagógico Separado
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Formación Práctica & Litigio Estratégico Colombiano
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Módulo formativo para estudiantes de Derecho, consultorios jurídicos y semilleros. Desarrolla el pensamiento analítico mediante descomposición socrática de hechos, rutas procesales orientativas, tutor interactivo y borradores técnicos supervisados.
            </p>
          </div>

          <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
            <button
              onClick={() => {
                setActiveTab('casos');
                setMostrarModalNuevoCaso(true);
              }}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 justify-center"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Analizar Nuevo Caso
            </button>
            <div className="text-[11px] text-slate-400 text-center font-mono">
              Aislamiento estricto (Ley 1581 / Ley 1123)
            </div>
          </div>
        </div>

        {/* 5 Botones de Acceso Rápido */}
        <div className="mt-6 pt-5 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          <button
            onClick={() => {
              setActiveTab('casos');
              setMostrarModalNuevoCaso(true);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-amber-400/20 text-slate-200 hover:text-amber-300 text-xs font-medium transition-all border border-slate-700 hover:border-amber-400/40"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Analizar un caso</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('investigacion');
              setQueryInvestigacion('Ley 1564');
              handleBuscarFuentes();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-amber-400/20 text-slate-200 hover:text-amber-300 text-xs font-medium transition-all border border-slate-700 hover:border-amber-400/40"
          >
            <Search className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Consultar una norma</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ruta');
              handleConsultarRuta('CONSTITUCIONAL', 'TUTELA');
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-amber-400/20 text-slate-200 hover:text-amber-300 text-xs font-medium transition-all border border-slate-700 hover:border-amber-400/40"
          >
            <RouteIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Construir ruta procesal</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('investigacion');
              setQueryInvestigacion('C-590 de 2005');
              handleBuscarFuentes();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-amber-400/20 text-slate-200 hover:text-amber-300 text-xs font-medium transition-all border border-slate-700 hover:border-amber-400/40"
          >
            <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Estudiar jurisprudencia</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('borradores');
              handleGenerarBorrador();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-amber-400/20 text-slate-200 hover:text-amber-300 text-xs font-medium transition-all border border-slate-700 hover:border-amber-400/40 col-span-2 sm:col-span-1"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Crear ficha jurídica</span>
          </button>
        </div>
      </div>

      {/* 2. Barra de Navegación de Pestañas */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('casos')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'casos'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          Casos Académicos & Análisis ({casos.length})
        </button>

        <button
          onClick={() => setActiveTab('ruta')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'ruta'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <RouteIcon className="w-4 h-4" />
          Ruta Procesal Orientativa
        </button>

        <button
          onClick={() => setActiveTab('tutor')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'tutor'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Tutor Académico Interactivo
        </button>

        <button
          onClick={() => setActiveTab('investigacion')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'investigacion'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Search className="w-4 h-4" />
          Catálogo Oficial Conectado
        </button>

        <button
          onClick={() => setActiveTab('borradores')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'borradores'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          Borradores Académicos (No Radicables)
        </button>
      </div>

      {/* 3. PESTAÑA 1: CASOS ACADÉMICOS & ANÁLISIS */}
      {activeTab === 'casos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Lista de Casos Académicos */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500" />
                Casos de Estudio ({casos.length})
              </h2>
              <button
                onClick={() => setMostrarModalNuevoCaso(true)}
                className="text-xs px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 rounded-lg font-semibold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Nuevo Caso
              </button>
            </div>

            <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
              {cargandoCasos ? (
                <div className="p-8 text-center text-xs text-slate-500">Cargando casos académicos...</div>
              ) : casos.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No hay casos académicos guardados.</p>
                </div>
              ) : (
                casos.map((caso) => {
                  const isSelected = caso.id === selectedCasoId;
                  const estadoBadgeColor =
                    caso.estadoEstudio === 'CONCLUIDO'
                      ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                      : caso.estadoEstudio === 'FUENTES_REVISADAS'
                      ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800'
                      : caso.estadoEstudio === 'BORRADOR_LISTO'
                      ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800'
                      : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800';

                  return (
                    <div
                      key={caso.id}
                      onClick={() => setSelectedCasoId(caso.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-900 text-white dark:bg-slate-850 dark:border-amber-500/60 shadow-md ring-1 ring-amber-500/40'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-900 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold ${estadoBadgeColor}`}>
                          {caso.estadoEstudio.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] opacity-70 font-mono">
                          {new Date(caso.fechaActualizacion).toLocaleDateString('es-CO')}
                        </span>
                      </div>

                      <h3 className="text-xs font-bold leading-snug line-clamp-2">{caso.titulo}</h3>
                      <div className="mt-2 flex items-center justify-between text-[11px] opacity-80">
                        <span className="truncate">{caso.areaDerecho}</span>
                        <span className="text-[10px] font-mono">{caso.tareasInvestigacion?.filter((t) => t.completada).length || 0}/{caso.tareasInvestigacion?.length || 0} tareas</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Columna Derecha: Detalle del Caso Seleccionado */}
          <div className="lg:col-span-8 space-y-6">
            {casoSeleccionado ? (
              <div className="space-y-6">
                {/* Encabezado del Caso */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-slate-950 rounded uppercase">
                          {casoSeleccionado.areaDerecho}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {casoSeleccionado.materiaEspecifica}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {casoSeleccionado.titulo}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={casoSeleccionado.estadoEstudio}
                        onChange={(e) => handleActualizarEstadoCaso(casoSeleccionado.id, e.target.value as EstadoEstudioCaso)}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                      >
                        <option value="EN_ANALISIS">En Análisis</option>
                        <option value="FUENTES_REVISADAS">Fuentes Revisadas</option>
                        <option value="BORRADOR_LISTO">Borrador Listo</option>
                        <option value="CONCLUIDO">Concluido</option>
                      </select>
                    </div>
                  </div>

                  {/* Hechos Originales */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800/80">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      Hechos Descritos por el Estudiante
                    </div>
                    <p className="text-xs text-slate-750 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {casoSeleccionado.hechosOriginales}
                    </p>
                  </div>
                </div>

                {/* Descomposición Socrática: Hechos Acreditados vs Inferencias vs Faltantes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Hechos Acreditados */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-950/60 shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Hechos Acreditados
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded">
                        {casoSeleccionado.hechosAcreditados?.length || 0}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Afirmaciones fácticas demostradas con soporte objetivo inmediato:
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {casoSeleccionado.hechosAcreditados?.map((h, i) => (
                        <li key={i} className="flex items-start gap-1.5 p-1.5 rounded bg-emerald-50/50 dark:bg-emerald-950/20 text-[11px]">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Inferencias Jurídicas Lógicas */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-200 dark:border-blue-950/60 shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                        <BrainCircuit className="w-3.5 h-3.5" /> Inferencias Jurídicas
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded">
                        {casoSeleccionado.inferenciasJuridicas?.length || 0}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Deducciones lógicas a corroborar con prueba o precedente:
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {casoSeleccionado.inferenciasJuridicas?.map((inf, i) => (
                        <li key={i} className="flex items-start gap-1.5 p-1.5 rounded bg-blue-50/50 dark:bg-blue-950/20 text-[11px]">
                          <span className="text-blue-500 font-bold">•</span>
                          <span>{inf}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Información Faltante y por Verificar */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-950/60 shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Requiere Verificación
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded">
                        {casoSeleccionado.informacionFaltanteYPorVerificar?.length || 0}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Fechas, notificaciones o presupuestos pendientes antes de litigar:
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {casoSeleccionado.informacionFaltanteYPorVerificar?.map((falt, i) => (
                        <li key={i} className="flex items-start gap-1.5 p-1.5 rounded bg-amber-50/50 dark:bg-amber-950/20 text-[11px]">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{falt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Problemas Jurídicos y Preguntas por Resolver */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-500" />
                    Problemas Jurídicos & Preguntas Dogmáticas
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold text-slate-500">Problemas Jurídicos Formulados</span>
                      {casoSeleccionado.problemasJuridicos?.map((pj, i) => (
                        <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium italic">
                          "{pj}"
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold text-slate-500">Preguntas que Deben Resolverse</span>
                      {casoSeleccionado.preguntasPorResolver?.map((pr, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{pr}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Líneas de Análisis Jurídico (Pros y Limitaciones) */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <RouteIcon className="w-4 h-4 text-amber-500" />
                    Líneas de Análisis & Estrategia Comparada
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {casoSeleccionado.lineasAnalisis?.map((linea, i) => (
                      <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{linea.titulo}</h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          <strong className="text-amber-600 dark:text-amber-400 font-medium">Fundamento: </strong>
                          {linea.fundamentoJuridico}
                        </p>
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                          <p className="text-emerald-700 dark:text-emerald-400">
                            <strong>Ventajas: </strong>{linea.pros}
                          </p>
                          <p className="text-amber-700 dark:text-amber-400">
                            <strong>Riesgos / Limitaciones: </strong>{linea.limitacionesORiesgos}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fuentes Oficiales Verificables Conectadas */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <BookmarkCheck className="w-4 h-4 text-emerald-500" />
                      Fuentes Oficiales Recomendadas para el Caso
                    </h3>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                      Cotejadas con SUIN-Juriscol / Corte Constitucional
                    </span>
                  </div>

                  <div className="space-y-2">
                    {casoSeleccionado.fuentesRecomendadas?.map((f, i) => (
                      <div key={i} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/30 dark:bg-slate-950/20">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{f.identificador}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
                              {f.tipo}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {f.motivoPertinencia}
                          </p>
                        </div>

                        {f.enlaceOficial && (
                          <a
                            href={f.enlaceOficial}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 text-xs bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 rounded-lg font-medium flex items-center gap-1 shrink-0 hover:opacity-90"
                          >
                            <ExternalLink className="w-3 h-3" /> Abrir Fuente
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tareas de Investigación Académica */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    Bitácora de Tareas Académicas
                  </h3>
                  <div className="space-y-1.5">
                    {casoSeleccionado.tareasInvestigacion?.map((tarea) => (
                      <label
                        key={tarea.id}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={tarea.completada}
                          onChange={() => handleToggleTarea(casoSeleccionado, tarea.id)}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                        />
                        <span className={`text-xs ${tarea.completada ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {tarea.descripcion}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Ningún caso seleccionado</h3>
                <p className="text-xs text-slate-500 mt-1">Selecciona un caso del panel lateral o analiza uno nuevo con la IA docente.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. PESTAÑA 2: RUTA PROCESAL ORIENTATIVA */}
      {activeTab === 'ruta' && (
        <div className="space-y-6">
          {/* Selector de Materia */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <RouteIcon className="w-4 h-4 text-amber-500" />
                Generador de Ruta Procesal Colombiana
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Flujograma secuencial de etapas procesales, términos perentorios, reglas de cómputo y requisitos previos.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={rutaMateria}
                onChange={(e) => {
                  setRutaMateria(e.target.value);
                  handleConsultarRuta(e.target.value, rutaProcedimiento);
                }}
                className="text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
              >
                <option value="CONSTITUCIONAL">Constitucional (Tutela Dec. 2591/91)</option>
                <option value="ADMINISTRATIVO">Contencioso Administrativo (CPACA Ley 1437/11)</option>
                <option value="CIVIL">Civil y Comercial (CGP Ley 1564/12)</option>
              </select>

              <button
                onClick={() => handleConsultarRuta()}
                disabled={cargandoRuta}
                className="px-3.5 py-2 text-xs bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 font-semibold rounded-xl flex items-center gap-1.5"
              >
                {cargandoRuta ? 'Generando...' : 'Actualizar Ruta'}
              </button>
            </div>
          </div>

          {/* Resultado de la Ruta Procesal */}
          {rutaData && (
            <div className="space-y-6">
              {/* Resumen de Competencia y Requisitos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Autoridad y Competencia</span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {rutaData.autoridadYCompetencia}
                  </p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    Procedimiento: {rutaData.tipoProcedimiento}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Requisitos Previos de Procedibilidad</span>
                  <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    {rutaData.requisitosPrevios?.map((req, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Flujograma de Etapas */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Secuencia Cronológica de Actuaciones Procesales
                </h3>

                <div className="space-y-3">
                  {rutaData.etapas?.map((etapa) => (
                    <div
                      key={etapa.orden}
                      className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative pl-12"
                    >
                      <div className="absolute left-4 top-4 w-6 h-6 rounded-full bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center">
                        {etapa.orden}
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{etapa.nombre}</h4>
                        {etapa.terminoLegal && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold w-fit">
                            Término: {etapa.terminoLegal}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
                        {etapa.descripcion}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <div>
                          <strong className="text-slate-500">Fundamento: </strong>
                          <span className="text-slate-800 dark:text-slate-200 font-mono">{etapa.fundamentoLegal}</span>
                        </div>
                        {etapa.condicionesComputo && (
                          <div>
                            <strong className="text-slate-500">Cómputo: </strong>
                            <span className="text-slate-800 dark:text-slate-200">{etapa.condicionesComputo}</span>
                          </div>
                        )}
                      </div>

                      {etapa.advertencias && (
                        <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{etapa.advertencias}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Fuentes Oficiales de Comprobación */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Fuentes Oficiales para Comprobación</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {rutaData.fuentesOficialesComprobacion?.map((f, i) => (
                      <a
                        key={i}
                        href={f.enlace}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        {f.nombre} <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 italic max-w-sm">
                  {rutaData.advertenciaDeontologica}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. PESTAÑA 3: TUTOR ACADÉMICO INTERACTIVO */}
      {activeTab === 'tutor' && (
        <div className="space-y-6">
          {/* Selector de Modo del Tutor */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Tutor Jurídico Socrático — 8 Modos de Aprendizaje
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Selecciona una modalidad didáctica para profundizar en el razonamiento dogmático y procesal colombiano.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {modosTutor.map((modo) => (
                <button
                  key={modo.id}
                  onClick={() => setTutorModo(modo.id as TutorAcademicoModo)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    tutorModo === modo.id
                      ? 'bg-amber-400 text-slate-950 font-bold border-amber-400 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold leading-tight">{modo.label}</div>
                  <div className={`text-[10px] mt-1 leading-snug line-clamp-2 ${tutorModo === modo.id ? 'text-slate-900' : 'text-slate-500'}`}>
                    {modo.desc}
                  </div>
                </button>
              ))}
            </div>

            {/* Input de Consulta */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <input
                type="text"
                value={tutorTema}
                onChange={(e) => setTutorTema(e.target.value)}
                placeholder="Tema o figura jurídica (e.g. Causal de nulidad procesal, Art. 121 CGP...)"
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
              <button
                onClick={handleConsultarTutor}
                disabled={cargandoTutor || !tutorTema.trim()}
                className="px-5 py-2.5 bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 shrink-0"
              >
                {cargandoTutor ? 'Analizando...' : 'Iniciar Tutoría'}
              </button>
            </div>
          </div>

          {/* Respuesta del Tutor */}
          {tutorRespuesta && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-amber-400 text-slate-950 font-bold rounded">
                  Modo: {tutorRespuesta.modo}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {tutorRespuesta.tituloGuia}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  {tutorRespuesta.introduccionPedagogica}
                </p>
              </div>

              {/* Desarrollo del Razonamiento Paso a Paso */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4 text-amber-500" />
                  Método de Razonamiento Paso a Paso
                </h4>
                <div className="space-y-2.5">
                  {tutorRespuesta.desarrolloRazonamiento?.map((paso: any, i: number) => (
                    <div key={i} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 space-y-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{paso.paso}</div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{paso.explicacion}</p>
                      {paso.fundamentoNormativoColombiano && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 font-mono mt-1">
                          Fundamento: {paso.fundamentoNormativoColombiano}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Ejercicio o Pregunta Formativa */}
              {tutorRespuesta.ejercicioOPruebaFormativa && (
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-2.5">
                  <span className="text-[11px] font-bold uppercase text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" /> Pregunta de Aplicación Formativa
                  </span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {tutorRespuesta.ejercicioOPruebaFormativa.pregunta}
                  </p>
                  <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {tutorRespuesta.ejercicioOPruebaFormativa.opciones?.map((opc: string, idx: number) => (
                      <li key={idx} className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        {opc}
                      </li>
                    ))}
                  </ul>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800 mt-2">
                    <strong className="text-emerald-600 dark:text-emerald-400">Retroalimentación Docente: </strong>
                    {tutorRespuesta.ejercicioOPruebaFormativa.retroalimentacionExplicativa}
                  </div>
                </div>
              )}

              {/* Errores Comunes y Fuentes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-950/60 bg-amber-50/30 dark:bg-amber-950/10 space-y-1.5">
                  <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Errores Frecuentes a Evitar
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                    {tutorRespuesta.erroresFrecuentesAEvitar?.map((err: string, i: number) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <BookmarkCheck className="w-3.5 h-3.5 text-emerald-500" /> Fuentes Oficiales Sugeridas
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                    {tutorRespuesta.fuentesOficialesSugeridas?.map((f: string, i: number) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. PESTAÑA 4: CATÁLOGO OFICIAL CONECTADO */}
      {activeTab === 'investigacion' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-500" />
              Búsqueda en el Catálogo Jurídico Colombiano Oficial
            </h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={queryInvestigacion}
                onChange={(e) => setQueryInvestigacion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscarFuentes()}
                placeholder="Buscar por número (e.g. 1564, 2213, 1755), año, artículo o palabras clave..."
                className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
              <select
                value={tipoNormaFiltro}
                onChange={(e) => setTipoNormaFiltro(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="TODOS">Todos los tipos</option>
                <option value="CONSTITUCION">Constitución</option>
                <option value="LEY">Leyes</option>
                <option value="SENTENCIA_C">Sentencias C</option>
                <option value="SENTENCIA_SU">Sentencias SU</option>
                <option value="DECRETO_REGLAMENTARIO">Decretos</option>
              </select>
              <button
                onClick={handleBuscarFuentes}
                disabled={cargandoFuentes}
                className="px-4 py-2 bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold rounded-xl"
              >
                Buscar
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {fuentesResultados.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.identificador}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-400/20 text-amber-700 dark:text-amber-300 rounded font-semibold">
                      {item.tipoNormaOProvidencia}
                    </span>
                  </div>
                  <a
                    href={item.enlaceVerificado}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    Fuente Oficial <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{item.epigrafeOTitulo}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{item.articulosOFundamentosClave}</p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Emisor: {item.autoridadEmisora}</span>
                  <span className="font-mono">Cotejo: {item.fechaUltimaConsulta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. PESTAÑA 5: BORRADORES ACADÉMICOS (NO RADICABLES) */}
      {activeTab === 'borradores' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-amber-500" />
                Generador de Borradores Jurídico-Académicos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Crea fichas jurisprudenciales, resúmenes normativos, matrices analíticas y conceptos con marca de agua académica obligatoria.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={tipoBorrador}
                onChange={(e) => setTipoBorrador(e.target.value as DocumentoAcademicoTipo)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
              >
                <option value="FICHA_JURISPRUDENCIAL">Ficha Jurisprudencial</option>
                <option value="MATRIZ_ANALISIS">Matriz de Análisis Jurídico</option>
                <option value="CONCEPTO_ACADEMICO">Concepto Jurídico Académico</option>
                <option value="LINEA_TIEMPO">Línea de Tiempo Procesal</option>
              </select>

              <button
                onClick={handleGenerarBorrador}
                disabled={generandoBorrador}
                className="px-4 py-2 bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                {generandoBorrador ? 'Generando...' : 'Generar Borrador'}
              </button>
            </div>
          </div>

          {borradorGenerado && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 font-bold rounded">
                    {borradorGenerado.advertenciaNoRadicable}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {borradorGenerado.titulo}
                  </h3>
                </div>

                <button
                  onClick={() => handleCopiarTexto(borradorGenerado.contenidoTexto, 'borrador')}
                  className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg flex items-center gap-1.5 font-medium transition-all"
                >
                  {copiado === 'borrador' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copiar Texto
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed overflow-x-auto border border-slate-200 dark:border-slate-800">
                {borradorGenerado.contenidoTexto}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* MODAL: CREAR Y ANALIZAR NUEVO CASO ACADÉMICO */}
      {mostrarModalNuevoCaso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                  Escuela Jurídica Inteligente
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Analizar & Registrar Caso de Estudio Académico
                </h3>
              </div>
              <button
                onClick={() => setMostrarModalNuevoCaso(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título del Caso de Estudio
                </label>
                <input
                  type="text"
                  value={nuevoTitulo}
                  onChange={(e) => setNuevoTitulo(e.target.value)}
                  placeholder="e.g. Acción de Tutela por Defecto Fáctico en Valoración Documental"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Área del Derecho
                  </label>
                  <select
                    value={nuevoArea}
                    onChange={(e) => setNuevoArea(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  >
                    <option value="CONSTITUCIONAL">Constitucional</option>
                    <option value="ADMINISTRATIVO">Administrativo</option>
                    <option value="CIVIL">Civil y Comercial</option>
                    <option value="LABORAL_SEGURIDAD_SOCIAL">Laboral</option>
                    <option value="PENAL">Penal</option>
                    <option value="FAMILIA">Familia</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Materia Específica (Opcional)
                  </label>
                  <input
                    type="text"
                    value={nuevoMateria}
                    onChange={(e) => setNuevoMateria(e.target.value)}
                    placeholder="e.g. Tutela contra Providencia / Contrato Realidad"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Relación de Hechos Fácticos del Caso
                </label>
                <textarea
                  rows={5}
                  value={nuevoHechos}
                  onChange={(e) => setNuevoHechos(e.target.value)}
                  placeholder="Describe la situación fáctica, las actuaciones procesales y las pruebas disponibles. La IA docente descompondrá los hechos acreditados, las inferencias y los datos que faltan por verificar..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 leading-relaxed font-sans"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAnalizarCasoIA}
                  disabled={analizandoCaso || !nuevoHechos.trim()}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow"
                >
                  <BrainCircuit className="w-4 h-4" />
                  {analizandoCaso ? 'Descomponiendo Hechos...' : '1. Descomponer Caso con IA Docente'}
                </button>
              </div>

              {/* Vista preliminar del análisis de la IA antes de guardar */}
              {analisisTemp && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Descomposición preliminar generada con éxito
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                    <p><strong>Hechos Acreditados:</strong> {analisisTemp.hechosAcreditados?.length || 0} identificados</p>
                    <p><strong>Inferencias por demostrar:</strong> {analisisTemp.inferenciasJuridicas?.length || 0} inferencias</p>
                    <p><strong>Datos por comprobar:</strong> {analisisTemp.informacionFaltanteYPorVerificar?.length || 0} presupuestos</p>
                    <p><strong>Problemas jurídicos:</strong> {analisisTemp.problemasJuridicos?.[0]}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMostrarModalNuevoCaso(false)}
                className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarCaso}
                disabled={!nuevoTitulo.trim() || !nuevoHechos.trim()}
                className="px-5 py-2 text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl shadow transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Guardar Caso en la Escuela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
