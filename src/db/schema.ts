/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — ESQUEMA RELACIONAL CLOUD SQL (POSTGRESQL / DRIZZLE)
 * Plataforma Jurídica Profesional, Despacho del Dr. Jair y Escuela Jurídica Inteligente
 */

import { pgTable, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. ORGANIZACIONES / FIRMAS JURÍDICAS (Multi-inquilino estricto)
export const organizaciones = pgTable('organizaciones', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  nit: text('nit').notNull(),
  representante: text('representante'),
  tarjetaProfesionalDireccion: text('tarjeta_profesional_direccion'),
  fechaRegistro: timestamp('fecha_registro', { withTimezone: true }).defaultNow(),
});

// 2. USUARIOS Y APODERADOS
export const usuarios = pgTable('usuarios', {
  id: text('id').primaryKey(),
  uid: text('uid').unique(), // Firebase Auth UID
  email: text('email').notNull().unique(),
  nombre: text('nombre').notNull(),
  tarjetaProfesional: text('tarjeta_profesional'),
  rol: text('rol').notNull(), // 'ADMIN_TITULAR', 'ABOGADO_ASOCIADO', 'ASISTENTE_JUDICIAL', 'AUDITOR_CUMPLIMIENTO'
  organizacionId: text('organizacion_id').notNull().references(() => organizaciones.id),
  organizacionNombre: text('organizacion_nombre'),
  fechaCreacion: timestamp('fecha_creacion', { withTimezone: true }).defaultNow(),
  ultimoAcceso: timestamp('ultimo_acceso', { withTimezone: true }),
});

// 3. CLIENTES (PERSONAS NATURALES Y JURÍDICAS — LEY 1581 HABEAS DATA)
export const clientes = pgTable('clientes', {
  id: text('id').primaryKey(),
  tipoPersona: text('tipo_persona').notNull(), // 'NATURAL' | 'JURIDICA'
  tipoIdentificacion: text('tipo_identificacion').notNull(), // 'CC', 'NIT', 'CE', 'PASAPORTE'
  numeroIdentificacion: text('numero_identificacion').notNull(),
  dv: text('dv'),
  nombreCompletoORazonSocial: text('nombre_completo_o_razon_social').notNull(),
  representanteNombre: text('representante_nombre'),
  representanteId: text('representante_id'),
  representanteCargo: text('representante_cargo'),
  emailPrincipal: text('email_principal').notNull(),
  emailNotificacionesJudiciales: text('email_notificaciones_judiciales').notNull(), // Ley 2213 de 2022
  telefono: text('telefono'),
  direccion: text('direccion'),
  ciudad: text('ciudad'),
  departamento: text('departamento'),
  estado: text('estado').notNull().default('ACTIVO'), // 'ACTIVO', 'INACTIVO', 'ARCHIVADO'
  habeasDataAutorizado: boolean('habeas_data_autorizado').notNull().default(false),
  habeasDataFecha: timestamp('habeas_data_fecha', { withTimezone: true }),
  habeasDataCanal: text('habeas_data_canal'), // 'DIGITAL_APP', 'FIRMA_FISICA', 'CORREO_ELECTRONICO', 'PENDIENTE'
  habeasDataFinalidad: text('habeas_data_finalidad'),
  notasInternas: text('notas_internas'),
  organizacionId: text('organizacion_id').notNull().references(() => organizaciones.id),
  fechaCreacion: timestamp('fecha_creacion', { withTimezone: true }).defaultNow(),
  fechaActualizacion: timestamp('fecha_actualizacion', { withTimezone: true }).defaultNow(),
});

// 4. EXPEDIENTES JUDICIALES Y EXTRAJUDICIALES
export const expedientes = pgTable('expedientes', {
  id: text('id').primaryKey(),
  codigoInterno: text('codigo_interno').notNull(),
  radicadoJudicial: text('radicado_judicial'), // 23 dígitos estándar Rama Judicial de Colombia
  despachoJudicial: text('despacho_judicial').notNull(),
  clienteId: text('cliente_id').notNull().references(() => clientes.id),
  clienteNombre: text('cliente_nombre').notNull(),
  areaJuridica: text('area_juridica').notNull(), // 'CIVIL_COMERCIAL', 'LABORAL_SEGURIDAD_SOCIAL', 'PENAL', etc.
  jurisdiccion: text('jurisdiccion').notNull(), // 'ORDINARIA', 'CONTENCIOSO_ADMINISTRATIVO', 'CONSTITUCIONAL', etc.
  autoridadCompetente: text('autoridad_competente'),
  demandanteOAccionante: text('demandante_o_accionante').notNull(),
  apoderadoDemandante: text('apoderado_demandante'),
  demandadoOAccionado: text('demandado_o_accionado').notNull(),
  apoderadoDemandado: text('apoderado_demandado'),
  sintesisHechos: text('sintesis_hechos').notNull(),
  pretensionesUObjetivos: text('pretensiones_u_objetivos').notNull(),
  cuantiaEstimadaCOP: text('cuantia_estimada_cop'),
  esMayorCuantia: boolean('es_mayor_cuantia').default(false),
  estado: text('estado').notNull().default('PREJUDICIAL'),
  estrategiaDefensiva: text('estrategia_defensiva'),
  notasPrivadas: text('notas_privadas'),
  abogadoResponsableId: text('abogado_responsable_id'),
  abogadoResponsableNombre: text('abogado_responsable_nombre'),
  organizacionId: text('organizacion_id').notNull().references(() => organizaciones.id),
  fechaInicio: timestamp('fecha_inicio', { withTimezone: true }).defaultNow(),
  fechaActualizacion: timestamp('fecha_actualizacion', { withTimezone: true }).defaultNow(),
});

// 5. ACTUACIONES PROCESALES
export const actuaciones = pgTable('actuaciones', {
  id: text('id').primaryKey(),
  expedienteId: text('expediente_id').notNull().references(() => expedientes.id),
  fechaActuacion: text('fecha_actuacion').notNull(),
  cuaderno: text('cuaderno').notNull(),
  tipoProvidencia: text('tipo_providencia').notNull(),
  anotacion: text('anotacion').notNull(),
  tieneTermino: boolean('tiene_termino').default(false),
  terminoDias: integer('termino_dias'),
  tipoDias: text('tipo_dias'),
  fechaRegistro: timestamp('fecha_registro', { withTimezone: true }).defaultNow(),
  usuarioRegistroId: text('usuario_registro_id'),
  usuarioRegistroNombre: text('usuario_registro_nombre'),
});

// 6. AGENDA Y CONTROL DE TÉRMINOS JUDICIALES
export const terminos = pgTable('terminos', {
  id: text('id').primaryKey(),
  titulo: text('titulo').notNull(),
  descripcion: text('descripcion'),
  tipoTermino: text('tipo_termino').notNull(),
  expedienteId: text('expediente_id').references(() => expedientes.id),
  expedienteCodigo: text('expediente_codigo'),
  clienteId: text('cliente_id').references(() => clientes.id),
  clienteNombre: text('cliente_nombre'),
  fechaNotificacionOInicio: text('fecha_notificacion_o_inicio').notNull(),
  duracionDias: integer('duracion_dias').notNull(),
  tipoDias: text('tipo_dias').notNull().default('HABILES_JUDICIALES'),
  aplicaReglaLey2213: boolean('aplica_regla_ley_2213').default(true),
  fechaVencimientoCalculada: text('fecha_vencimiento_calculada').notNull(),
  calculoConfirmadoPorAbogado: boolean('calculo_confirmado_por_abogado').default(false),
  confirmadoPorNombre: text('confirmado_por_nombre'),
  confirmadoEn: timestamp('confirmado_en', { withTimezone: true }),
  estado: text('estado').notNull().default('PENDIENTE'), // 'PENDIENTE', 'VERIFICADO', 'CUMPLIDO', 'VENCIDO'
  prioridad: text('prioridad').notNull().default('MEDIA'),
  notasComputo: text('notas_computo'),
  responsableId: text('responsable_id'),
  responsableNombre: text('responsable_nombre'),
  organizacionId: text('organizacion_id').notNull().references(() => organizaciones.id),
  fechaCreacion: timestamp('fecha_creacion', { withTimezone: true }).defaultNow(),
});

// 7. DOCUMENTOS JURÍDICOS Y BORRADORES
export const documentos = pgTable('documentos', {
  id: text('id').primaryKey(),
  titulo: text('titulo').notNull(),
  tipoDocumento: text('tipo_documento').notNull(),
  expedienteId: text('expediente_id').references(() => expedientes.id),
  clienteId: text('cliente_id').references(() => clientes.id),
  contenido: text('contenido').notNull(),
  version: integer('version').default(1),
  esBorradorNoRadicable: boolean('es_borrador_no_radicable').default(true),
  estado: text('estado').default('BORRADOR'),
  metadatos: text('metadatos'),
  organizacionId: text('organizacion_id').notNull().references(() => organizaciones.id),
  creadoPorId: text('creado_por_id'),
  creadoPorNombre: text('creado_por_nombre'),
  fechaCreacion: timestamp('fecha_creacion', { withTimezone: true }).defaultNow(),
  fechaActualizacion: timestamp('fecha_actualizacion', { withTimezone: true }).defaultNow(),
});

// 8. REGISTRO DE HONORARIOS Y GASTOS PROCESALES
export const honorarios = pgTable('honorarios', {
  id: text('id').primaryKey(),
  clienteId: text('cliente_id').notNull().references(() => clientes.id),
  clienteNombre: text('cliente_nombre').notNull(),
  expedienteId: text('expediente_id').references(() => expedientes.id),
  expedienteCodigo: text('expediente_codigo'),
  concepto: text('concepto').notNull(),
  modalidad: text('modalidad').notNull().default('CUOTA_FIJA'),
  valorAcordadoCOP: integer('valor_acordado_cop').notNull().default(0),
  valorPagadoCOP: integer('valor_pagado_cop').notNull().default(0),
  saldoPendienteCOP: integer('saldo_pendiente_cop').notNull().default(0),
  estadoPago: text('estado_pago').notNull().default('PENDIENTE'),
  fechaAcuerdo: text('fecha_acuerdo').notNull(),
  pagosHistorial: text('pagos_historial'), // JSON stringificado
  organizacionId: text('organizacion_id').notNull().references(() => organizaciones.id),
  fechaRegistro: timestamp('fecha_registro', { withTimezone: true }).defaultNow(),
});

// 9. AUDITORÍA INMUTABLE DE EVENTOS (ISO 27001 / HABEAS DATA)
export const auditoria = pgTable('auditoria', {
  id: text('id').primaryKey(),
  usuarioId: text('usuario_id').notNull(),
  usuarioNombre: text('usuario_nombre').notNull(),
  usuarioRol: text('usuario_rol').notNull(),
  accion: text('accion').notNull(),
  modulo: text('modulo').notNull(),
  descripcion: text('descripcion').notNull(),
  recursoId: text('recurso_id'),
  organizacionId: text('organizacion_id').notNull(),
  ip: text('ip'),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow(),
});

// 10. CASOS DE ESTUDIO ACADÉMICOS (ESCUELA JURÍDICA INTELIGENTE)
export const casosAcademicos = pgTable('casos_academicos', {
  id: text('id').primaryKey(),
  titulo: text('titulo').notNull(),
  area: text('area').notNull(),
  jurisdiccion: text('jurisdiccion').notNull(),
  descripcion: text('descripcion').notNull(),
  hechos: text('hechos'), // JSON stringificado
  evidencias: text('evidencias'), // JSON stringificado
  preguntasSocraticas: text('preguntas_socraticas'), // JSON stringificado
  rutaProcesal: text('ruta_procesal'), // JSON stringificado
  fechaCreacion: timestamp('fecha_creacion', { withTimezone: true }).defaultNow(),
});

// RELACIONES RELACIONALES DRIZZLE
export const organizacionesRelations = relations(organizaciones, ({ many }) => ({
  usuarios: many(usuarios),
  clientes: many(clientes),
  expedientes: many(expedientes),
  terminos: many(terminos),
}));

export const clientesRelations = relations(clientes, ({ one, many }) => ({
  organizacion: one(organizaciones, {
    fields: [clientes.organizacionId],
    references: [organizaciones.id],
  }),
  expedientes: many(expedientes),
  terminos: many(terminos),
  honorarios: many(honorarios),
}));

export const expedientesRelations = relations(expedientes, ({ one, many }) => ({
  cliente: one(clientes, {
    fields: [expedientes.clienteId],
    references: [clientes.id],
  }),
  organizacion: one(organizaciones, {
    fields: [expedientes.organizacionId],
    references: [organizaciones.id],
  }),
  actuaciones: many(actuaciones),
  terminos: many(terminos),
  documentos: many(documentos),
  honorarios: many(honorarios),
}));

export const actuacionesRelations = relations(actuaciones, ({ one }) => ({
  expediente: one(expedientes, {
    fields: [actuaciones.expedienteId],
    references: [expedientes.id],
  }),
}));

export const terminosRelations = relations(terminos, ({ one }) => ({
  expediente: one(expedientes, {
    fields: [terminos.expedienteId],
    references: [expedientes.id],
  }),
  cliente: one(clientes, {
    fields: [terminos.clienteId],
    references: [clientes.id],
  }),
}));
