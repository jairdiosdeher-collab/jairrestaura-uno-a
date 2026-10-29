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
  tipo: TipoDocumentoLegal;
  expedienteId?: string;
  clienteId?: string;
  version: number;
  contenidoTexto: string;
  parametrosGeneracion?: Record<string, any>;
  estadoRevision: 'BORRADOR_PRELIMINAR' | 'EN_REVISION' | 'APROBADO_PARA_RADICACION' | 'RADICADO';
  advertenciasRequisitos: string[];
  fechaCreacion: string;
  fechaModificacion: string;
  autorId: string;
  autorNombre: string;
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
  accion: 'LOGIN' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'AI_QUERY' | 'CONFIRM_TERM' | 'RESTORE';
  modulo: 'CLIENTES' | 'EXPEDIENTES' | 'ASISTENTE_IA' | 'INVESTIGACION' | 'DOCUMENTOS' | 'AGENDA' | 'HONORARIOS' | 'SEGURIDAD';
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
  estadoVigenciaComprobado: 'VIGENTE' | 'DEROGADA' | 'EXEQUIBLE_CONDICIONADA' | 'INEXEQUIBLE' | 'JURISPRUDENCIA_VIGENTE';
  fechaUltimaConsulta: string;
  resumenExtracto: string;
  materias: string[];
}
