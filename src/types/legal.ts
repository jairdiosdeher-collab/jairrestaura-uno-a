/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — PLATAFORMA JURÍDICA INTELIGENTE ENTERPRISE
 * Definición integral de tipos de datos para el ordenamiento jurídico colombiano.
 */

export type TipoPersona = 'NATURAL' | 'JURIDICA';
export type TipoIdentificacion = 'CC' | 'NIT' | 'CE' | 'PASAPORTE' | 'TI';

export type RolUsuario = 
  | 'ADMIN_TITULAR'       // Abogado Titular / Director de Firma
  | 'ABOGADO_ASOCIADO'    // Abogado Litigante
  | 'ASISTENTE_JUDICIAL'  // Dependiente / Paralegal
  | 'AUDITOR_CUMPLIMIENTO'; // Oficial de Cumplimiento / Habeas Data

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  tarjetaProfesional?: string; // Número de TP expedido por el C.S. de la Judicatura
  rol: RolUsuario;
  organizacionId: string;
  organizacionNombre: string;
  avatarUrl?: string;
  fechaCreacion: string;
  ultimoAcceso: string;
}

export interface ConsentimientoHabeasData {
  autorizado: boolean;
  fechaAutorizacion: string;
  canalAutorizacion: 'DIGITAL_APP' | 'FIRMA_FISICA' | 'CORREO_ELECTRONICO';
  finalidadTratamiento: string;
  soporteId?: string;
}

export interface Cliente {
  id: string;
  tipoPersona: TipoPersona;
  tipoIdentificacion: TipoIdentificacion;
  numeroIdentificacion: string;
  dv?: string; // Dígito de verificación para NIT
  nombreCompletoORazonSocial: string;
  representanteLegal?: {
    nombre: string;
    tipoIdentificacion: TipoIdentificacion;
    numeroIdentificacion: string;
    cargo: string;
  };
  emailPrincipal: string;
  emailNotificacionesJudiciales: string; // Ley 2213 de 2022
  telefono: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'ARCHIVADO';
  consentimientoLey1581: ConsentimientoHabeasData;
  notasInternas?: string;
  organizacionId: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  expedientesIds: string[];
}

export type AreaJuridica = 
  | 'CIVIL'
  | 'CIVIL_COMERCIAL'
  | 'LABORAL_SEGURIDAD_SOCIAL'
  | 'ADMINISTRATIVO'
  | 'COMERCIAL'
  | 'CONSTITUCIONAL'
  | 'PENAL'
  | 'FAMILIA'
  | 'TRIBUTARIO'
  | 'DISCIPLINARIO';

export type EstadoExpediente = 
  | 'PREJUDICIAL'
  | 'RADICADO'
  | 'ADMITIDO'
  | 'NOTIFICACION'
  | 'CONTESTACION_TRASLADO'
  | 'AUDIENCIA_INICIAL'
  | 'AUDIENCIA_INICIAL_372'
  | 'AUDIENCIA_INSTRUCCION_373'
  | 'ALEGATOS_CONCLUSION'
  | 'SENTENCIA_PRIMERA_INSTANCIA'
  | 'SEGUNDA_INSTANCIA_APELACION'
  | 'EJECUCION_SENTENCIA'
  | 'TERMINADO_CONCILIACION'
  | 'ARCHIVADO';

export interface ActuacionProcesal {
  id: string;
  expedienteId: string;
  fechaActuacion: string; // YYYY-MM-DD
  fechaNotificacion?: string;
  cuaderno: string; // e.g. "Cuaderno Principal 1", "Medidas Cautelares"
  folio?: string;
  tipoProvidencia: 'AUTO_ADMISORIO' | 'AUTO_INTERLOCUTORIO' | 'AUTO_SUSTANCIACION' | 'SENTENCIA' | 'MEMORIAL_PARTE' | 'AUDIENCIA' | 'CONSTANCIA';
  anotacion: string;
  actuacionRamaJudicial?: string; // Anotación literal del sistema de consulta Rama Judicial
  tieneTermino: boolean;
  terminoDias?: number;
  tipoDias?: 'HABILES' | 'CALENDARIO';
  fechaVencimientoCalculada?: string;
  creadoPor: string;
  fechaCreacion: string;
}

export interface Expediente {
  id: string;
  codigoInterno: string; // e.g. "EXP-2026-0042"
  radicadoJudicial?: string; // 23 dígitos: e.g. 11001310300120260012300
  despachoJudicial?: string; // e.g. "Juzgado 15 Civil del Circuito de Bogotá"
  clienteId: string;
  clienteNombre: string;
  areaJuridica: AreaJuridica;
  jurisdiccion: 'ORDINARIA' | 'CONTENCIOSO_ADMINISTRATIVO' | 'CONSTITUCIONAL' | 'ARBITRAL' | 'EXTRAJUDICIAL';
  autoridadCompetente: string;
  
  partes: {
    demandanteOAccionante: string;
    apoderadoDemandante?: string;
    demandadoOAccionado: string;
    apoderadoDemandado?: string;
    vinculadosTerceros?: string[];
    juezOMagistradoPonente?: string;
  };
  
  sintesisHechos: string;
  pretensionesUObjetivos: string;
  cuantiaEstimadaCOP?: number; // Cuantía en pesos colombianos
  esMayorCuantia?: boolean;
  
  estado: EstadoExpediente;
  estrategiaDefensiva?: string;
  notasPrivadas?: string;
  
  fechaInicio: string;
  fechaActualizacion: string;
  organizacionId: string;
  abogadoResponsableId: string;
  abogadoResponsableNombre: string;
}

export type TipoTermino = 
  | 'TRASLADO_DEMANDA'
  | 'CONTESTACION_DEMANDA'
  | 'CONTESTACION_TRASLADO'
  | 'RECURSO_REPOSICION'
  | 'RECURSO_APELACION'
  | 'ALEGATOS_CONCLUSION'
  | 'SUBSANACION_DEMANDA'
  | 'CONTESTACION_TUTELA'
  | 'CUMPLIMIENTO_TUTELA'
  | 'RESPUESTA_PETICION'
  | 'AUDIENCIA'
  | 'REUNION_CLIENTE'
  | 'VENCIMIENTO_CONTRACTUAL'
  | 'OTRO';

export interface TerminoAgenda {
  id: string;
  expedienteId?: string;
  expedienteCodigo?: string;
  clienteId?: string;
  clienteNombre?: string;
  titulo: string;
  descripcion: string;
  tipoTermino: TipoTermino;
  
  fechaNotificacionOInicio: string; // Fecha en que se notificó o inició
  aplicaReglaLey2213: boolean; // 2 días de gracia por notificación electrónica
  duracionDias: number;
  tipoDias: 'HABILES_JUDICIALES' | 'CALENDARIO';
  
  fechaVencimientoCalculada: string;
  calculoConfirmadoPorAbogado: boolean;
  abogadoQueConfirmo?: string;
  notasCómputo?: string;
  
  estado: 'PENDIENTE' | 'VERIFICADO' | 'CUMPLIDO' | 'VENCIDO';
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  responsableId: string;
  responsableNombre: string;
  organizacionId: string;
}

export type TipoDocumentoLegal = 
  | 'ACCION_TUTELA'
  | 'DERECHO_PETICION'
  | 'PODER_ESPECIAL'
  | 'CONTRATO_PRESTACION_SERVICIOS'
  | 'RECURSO_REPOSICION_APELACION'
  | 'DEMANDA_VERBAL_DECLARATIVA'
  | 'CONCEPTO_JURIDICO'
  | 'REQUERIMIENTO_EXTRAJUDICIAL'
  | 'MEMORIAL_IMPULSO';

export interface DocumentoLegal {
  id: string;
  titulo: string;
  tipo?: TipoDocumentoLegal;
  tipoPlantilla?: string;
  expedienteId?: string;
  expedienteCodigo?: string;
  clienteId?: string;
  version: number;
  contenidoTexto: string;
  parametrosGeneracion?: Record<string, any>;
  estadoRevision?: 'BORRADOR_PRELIMINAR' | 'EN_REVISION' | 'APROBADO_PARA_RADICACION' | 'RADICADO';
  estado?: string;
  advertenciasRequisitos?: string[];
  fechaCreacion: string;
  fechaModificacion?: string;
  fechaActualizacion?: string;
  autorId?: string;
  autorNombre?: string;
  creadoPor?: string;
  organizacionId: string;
}

export interface RegistroHonorario {
  id: string;
  expedienteId?: string;
  expedienteCodigo?: string;
  clienteId: string;
  clienteNombre: string;
  concepto: string;
  modalidad: 'CUOTA_FIJA' | 'CUOTA_LITIS' | 'MIXTO' | 'HORA_PROFESIONAL';
  valorAcordadoCOP: number;
  valorPagadoCOP: number;
  saldoPendienteCOP: number;
  estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADO_TOTAL' | 'VENCIDO';
  fechaAcuerdo: string;
  fechaVencimiento?: string;
  pagosRegistrados: {
    id: string;
    fechaPago: string;
    montoCOP: number;
    medioPago: 'TRANSFERENCIA_BANCARIA' | 'EFECTIVO' | 'CONSIGNACION' | 'CHEQUE';
    numeroComprobante: string;
    verificadoPorContabilidad: boolean; // Distinción obligatoria
    registradoPor: string;
  }[];
  gastosProcesales: {
    id: string;
    concepto: string; // e.g. "Arancel judicial", "Peritaje contable", "Copias auténticas"
    montoCOP: number;
    fecha: string;
    asumidoPor: 'CLIENTE' | 'FIRMA';
    soporteFactura?: string;
  }[];
  organizacionId: string;
}

export interface RegistroAuditoria {
  id: string;
  timestamp: string;
  usuarioId: string;
  usuarioNombre: string;
  usuarioRol: RolUsuario;
  accion: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'AI_QUERY' | 'CONFIRM_TERM' | 'RESTORE';
  modulo: 'CLIENTES' | 'EXPEDIENTES' | 'ASISTENTE_IA' | 'INVESTIGACION' | 'DOCUMENTOS' | 'AGENDA' | 'HONORARIOS' | 'SEGURIDAD' | 'ESCUELA_JURIDICA';
  registroIdAfectado?: string;
  descripcionDetallada: string;
  ipAddress?: string;
  organizacionId: string;
}

export interface FuenteJuridicaOficial {
  id: string;
  nombreFuente: 'SUIN_JURISCOL' | 'CORTE_CONSTITUCIONAL' | 'CORTE_SUPREMA_JUSTICIA' | 'CONSEJO_ESTADO' | 'RAMA_JUDICIAL' | 'DIARIO_OFICIAL' | 'PRESIDENCIA_JURIDICA';
  tipoNormaOProvidencia: 'CONSTITUCION' | 'LEY' | 'DECRETO_REGLAMENTARIO' | 'SENTENCIA_C' | 'SENTENCIA_T' | 'SENTENCIA_SU' | 'SENTENCIA_CASACION' | 'AUTO';
  identificador: string; // e.g. "Ley 1564 de 2012", "Sentencia C-590/05"
  autoridadEmisora: string;
  fechaExpedicion: string;
  epigrafeOTitulo: string;
  articulosOFundamentosClave: string;
  enlaceVerificado: string;
  enlaceOficial?: string;
  estadoVigenciaComprobado: 'VIGENTE' | 'DEROGADA' | 'EXEQUIBLE_CONDICIONADA' | 'INEXEQUIBLE' | 'JURISPRUDENCIA_VIGENTE';
  fechaUltimaConsulta: string;
  resumenExtracto: string;
  materias: string[];
}

// ============================================================
// ESCUELA JURÍDICA INTELIGENTE (MÓDULO ACADÉMICO PARA ESTUDIANTES)
// Espacio pedagógico estrictamente separado de expedientes reales
// ============================================================

export type EstadoEstudioCaso = 
  | 'EN_ANALISIS' 
  | 'FUENTES_REVISADAS' 
  | 'BORRADOR_LISTO' 
  | 'CONCLUIDO';

export interface TareaInvestigacionAcademica {
  id: string;
  descripcion: string;
  completada: boolean;
  fuenteAsociada?: string;
}

export type EstadoVerificacionFuente = 
  | 'CATALOGO_LOCAL_VERIFICADO'
  | 'EN_LINEA_VERIFICADO'
  | 'PENDIENTE_VERIFICACION';

export interface FuenteAcademicaRecomendada {
  identificador: string;
  tipo: string;
  entidadEmisora?: string;
  motivoPertinencia: string;
  fragmentoPertinente?: string;
  enlaceOficial?: string;
  fechaConsultaReal?: string;
  estadoVerificacion: EstadoVerificacionFuente;
  verificadaEnCatalogo: boolean;
}

export interface LineaAnalisisAcademico {
  titulo: string;
  fundamentoJuridico: string;
  pros: string;
  limitacionesORiesgos: string;
}

// B. Matriz de Hechos y Pruebas con trazabilidad probatoria
export type EstadoHechoProbatorio = 
  | 'RELATADO_POR_PARTE' 
  | 'CONTROVERTIDO' 
  | 'RESPALDADO_POR_SOPORTE' 
  | 'PENDIENTE_CORROBORACION';

export interface HechoMatrizProbatoria {
  id: string;
  texto: string;
  textoHecho?: string;
  origenInformacion: string; // e.g. "Relato escrito del estudiante", "Documento soporte aportado", "Declaración de parte"
  origenFuente?: string;
  soporteProbatorio: string; // e.g. "Contrato de trabajo suscrito", "Constancia de correo", "Sin soporte identificado"
  soporteProbatorioIdentificado?: string;
  estado: EstadoHechoProbatorio;
  inferenciasAsociadas: string[];
  informacionFaltante: string[] | string;
}

// C. Análisis de Hipótesis Contrapuestas
export interface HipotesisContrapuesta {
  id: string;
  titulo: string;
  esPrincipal: boolean;
  tesisJuridica: string;
  descripcion?: string;
  argumentosAFavor: string[];
  argumentosEnContra: string[];
  elementosConfirmacionProbatoria: string[];
  pruebasQueConfirman?: string[];
  elementosRefutacionProbatoria: string[];
  pruebasQueDesvirtuan?: string[];
  reglasJuridicasAplicables: string[];
  incertidumbresYLimitaciones: string[];
}

export interface AnalisisHipotesisCaso {
  hipotesisPrincipal: HipotesisContrapuesta;
  hipotesisAlternativa: HipotesisContrapuesta;
  puntosControvertidos?: string[];
  cargaProbatoria?: string[];
  preguntasAdicionalesPorResolver: string[];
  preguntasParaProfundizar?: string[];
  sintesisDocente: string;
  sintesisPonderacion?: string;
  criterioDecisionSugerido?: string;
}

// A. Análisis Socrático y Progresión Pedagógica
export type EtapaSocratica = 
  | 'HECHOS' 
  | 'CONTROVERSIA' 
  | 'REGLA_JURIDICA' 
  | 'PRUEBAS' 
  | 'INFERENCIAS' 
  | 'CONCLUSION';

export interface PasoSocratico {
  id: string;
  orden: number;
  etapa: EtapaSocratica;
  preguntaGuia: string;
  preguntaDocente?: string;
  contextoNormativo: string;
  respuestaEstudiante?: string;
  fechaRegistro?: string;
  evaluacionDocente?: {
    esAcierto: boolean;
    esValido?: boolean;
    analisisCritico: string;
    falaciasOVaciosIdentificados?: string[];
    orientacionMejora: string;
    sugerenciaMejora?: string;
  };
  retroalimentacionCompletada: boolean;
}

export interface CasoAcademico {
  id: string;
  titulo: string;
  areaDerecho: AreaJuridica;
  materiaEspecifica?: string;
  hechosOriginales: string;
  
  // Descomposición analítica estructurada (IA pedagógica)
  hechosAcreditados: string[];
  inferenciasJuridicas: string[];
  informacionFaltanteYPorVerificar: string[];
  problemasJuridicos: string[];
  preguntasPorResolver: string[];
  fuentesRecomendadas: FuenteAcademicaRecomendada[];
  lineasAnalisis: LineaAnalisisAcademico[];

  // Componentes interactivos pedagógicos avanzados
  matrizHechosYPruebas?: HechoMatrizProbatoria[];
  analisisHipotesis?: AnalisisHipotesisCaso;
  dialogoSocratico?: PasoSocratico[];
  datosFaltantesAntesDeRuta?: string[];
  fuentesVinculadasAProblemas?: {
    problemaJuridico: string;
    fuenteIdentificador: string;
    justificacionPertinencia: string;
  }[];
  
  // Estado pedagógico y seguimiento
  estadoEstudio: EstadoEstudioCaso;
  tareasInvestigacion: TareaInvestigacionAcademica[];
  proximaActividadAcademica: string;
  notasEstudiante?: string;
  historialCambios?: {
    fecha: string;
    accion: string;
    detalles: string;
  }[];

  // Separación y metadatos
  esCasoPedagogico: true; // Marca imperativa de no contaminación
  creadoPor: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  organizacionId: string;
}

export interface RutaProcesalEtapa {
  orden: number;
  nombre: string;
  descripcion: string;
  terminoLegal?: string;
  fundamentoLegal: string;
  condicionesComputo?: string;
  actuacionSugerida: string;
  advertencias: string;
}

export interface RutaProcesalAcademica {
  materia: string;
  tipoProcedimiento: string;
  autoridadYCompetencia: string;
  requisitosPrevios: string[];
  datosFaltantesPrevios?: string[];
  supuestosCalculoTerminos?: string[];
  etapas: RutaProcesalEtapa[];
  proximaActuacionInmediata: string;
  riesgosYExcepciones: string[];
  fuentesOficialesComprobacion: {
    nombre: string;
    enlace: string;
    tipo: string;
    estadoVerificacion?: EstadoVerificacionFuente;
  }[];
  advertenciaDeontologica: string;
}

export type TutorAcademicoModo =
  | 'CONCEPTOS'               // Explicación de conceptos jurídicos
  | 'CASOS_PRACTICOS'         // Análisis de casos prácticos
  | 'METODO_RESOLUCION'       // Método para resolver problemas jurídicos (IRAC / subsunción)
  | 'PREPARACION_EXAMENES'    // Preparación para exámenes y preparatorios
  | 'PREGUNTAS_PRACTICA'      // Preguntas de práctica con retroalimentación formativa
  | 'ENSAYOS_TRABAJOS'        // Estructuración de ensayos y trabajos académicos
  | 'LECTURA_GUIADA'          // Lectura guiada de normas y sentencias
  | 'ARGUMENTACION';          // Ejercicios de argumentación jurídica

export type DocumentoAcademicoTipo =
  | 'FICHA_JURISPRUDENCIAL'
  | 'MATRIZ_PROBATORIA'
  | 'RESUMEN_NORMATIVO'
  | 'MATRIZ_ANALISIS'
  | 'CONCEPTO_ACADEMICO'
  | 'LINEA_TIEMPO'
  | 'ESQUEMA_PROCESAL';

export interface DocumentoAcademicoBorrador {
  id: string;
  titulo: string;
  tipo: DocumentoAcademicoTipo;
  casoAcademicoId?: string;
  contenidoTexto: string;
  fechaCreacion: string;
  esBorradorAcademico: true;
  advertenciaNoRadicable: string;
}

// ============================================================
// ORIENTADOR JURÍDICO CIUDADANO IA — TIPOS Y CONTRATOS
// ============================================================

export type NivelAutogestion =
  | 'AUTOGESTIONABLE'                  // Nivel 1: Trámite realizable directamente por el ciudadano sin apoderado
  | 'CONVIENE_ASESORIA'                // Nivel 2: Es viable autogestión pero conviene asesoría previa o centro de conciliación
  | 'VERIFICAR_REQUISITO_ABOGADO'      // Nivel 3: Requiere verificar cuantía y competencia procesal (Art. 73 CGP)
  | 'ASISTENCIA_PROFESIONAL_PRIORITARIA'; // Nivel 4: Requiere abogado titulado obligatorio (mayor cuantía, penal ordinario, casación)

export interface UrgenciaCiudadana {
  esUrgente: boolean;
  nivelUrgencia: 'ALTA' | 'MEDIA' | 'INFORMATIVA';
  motivoUrgencia: string;
  plazoVerificar?: string;
  advertenciaInmediata: string;
  diasRestantesEstimados?: number;
  accionesInmediatas: string[];
}

export interface PasoRutaCiudadana {
  orden: number;
  titulo: string;
  paraQueSirve: string;
  queHacer: string;
  documentosAReunir: string[];
  anteQuien: string;
  canalOficial: string;
  enlaceCanalOficial?: string;
  queEsperar: string;
  queHacerSiFalla: string;
  precauciones: string[];
}

export interface DocumentoRequeridoCiudadano {
  id: string;
  nombre: string;
  descripcion: string;
  comoObtenerlo: string;
  comoConservarlo: string;
  obligatorio: boolean;
  reunido?: boolean;
}

export interface EntidadCompetenteCiudadana {
  nombre: string;
  tipo: 'ADMINISTRATIVA' | 'JUDICIAL' | 'CONTROL' | 'CONCILIACION' | 'ORIENTACION_GRATUITA';
  competencia: string;
  sedeOCanal: string;
  esGratuita: boolean;
  enlaceOficial: string;
}

export interface OpcionLegalCiudadana {
  titulo: string;
  descripcion: string;
  consecuencias: string;
  pros: string[];
  contras: string[];
}

export interface OrientacionGratuitaItem {
  entidad: string;
  descripcion: string;
  requisitos: string;
  canal: string;
  enlaceOficial?: string;
}

export interface ResultadoOrientacionCiudadana {
  id: string;
  fechaOrientacion: string;
  resumenSituacion: {
    loQueEntendemos: string;
    datosFaltantesPorConfirmar: string[];
    hechosRelatados: string[];
    pruebasRevisadas: string[];
    suposiciones: string[];
    hechosNoComprobados?: string[];
    normasAplicables?: string[];
    hipotesisYAlternativas?: string[];
    recomendacionProfesional?: string;
  };
  categoriasIdentificadas: string[];
  urgencia: UrgenciaCiudadana;
  opcionesLegales: OpcionLegalCiudadana[];
  queHacerPrimero: {
    accion: string;
    porQueEsImportante: string;
    plazoRecomendado: string;
  };
  procedimientoPasoAPaso: PasoRutaCiudadana[];
  clasificacionAutogestion: {
    nivel: NivelAutogestion;
    justificacion: string;
    advertenciaRepresentacion: string;
  };
  documentosRequeridos: DocumentoRequeridoCiudadano[];
  dondeAcudir: EntidadCompetenteCiudadana[];
  orientacionGratuitaDisponible: OrientacionGratuitaItem[];
  queHacerDespues: string[];
  proximoPasoInmediato: string;
  fuentesOficiales: FuenteJuridicaOficial[];
  avisoLegal: string;
}

export interface ProblemaCiudadanoEntrada {
  descripcionProblema: string;
  ciudad?: string;
  fechaAproximada?: string;
  notificacionRecibida?: boolean;
  detalleNotificacion?: string;
  fechaNotificacion?: string;
  fechaLimite?: string;
  resultadoEsperado?: string;
  documentosDisponibles?: string[];
}

export type TipoBorradorCiudadano =
  | 'DERECHO_PETICION_ART23'
  | 'RECLAMACION_DIRECTA_CONSUMIDOR'
  | 'COMUNICACION_ARRENDAMIENTO'
  | 'SOLICITUD_CONCILIACION_EXTRAJUDICIAL'
  | 'REQUERIMIENTO_PAGO_EXTRAJUDICIAL';

export interface BorradorCiudadano {
  id: string;
  tipo: TipoBorradorCiudadano;
  titulo: string;
  contenidoTexto: string;
  fechaCreacion: string;
  advertenciaNoRadicacion: string;
  camposPendientesCompletar: string[];
  normativaAplicable: string[];
}

export interface ConceptoGlosarioCiudadano {
  id: string;
  termino: string;
  definicionClara: string;
  enPalabrasSencillas: string;
  ejemploHipotetico: string;
  queNoEs: string;
  baseLegal: string;
  categoria: 'CONCEPTOS_BASICOS' | 'PROCEDIMIENTOS' | 'DERECHOS' | 'TERMINOS_Y_PLAZOS';
}

