/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — PLATAFORMA JURÍDICA INTELIGENTE ENTERPRISE
 * Servidor Backend Express con integración Gemini SDK y persistencia transaccional.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { calcularTerminoColombiano, esDiaHabilJudicial, obtenerFestivosColombia } from './src/utils/colombianHolidays.ts';
import { CORPUS_JURIDICO_COLOMBIA, PORTALES_OFICIALES_COLOMBIA } from './src/utils/colombianLegalCorpus.ts';
import { PLANTILLAS_JURIDICAS } from './src/utils/colombianLegalDrafting.ts';
import type { 
  Cliente, 
  Expediente, 
  TerminoAgenda, 
  DocumentoLegal, 
  RegistroHonorario, 
  RegistroAuditoria, 
  Usuario 
} from './src/types/legal.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'jairrestaura_db.json');

app.use(express.json({ limit: '15mb' }));

// Inicialización de Google GenAI en servidor según estándares del skill
const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Interfaz para la Base de Datos Persistente
interface DatabaseSchema {
  organizacion: {
    id: string;
    nombre: string;
    nit: string;
    representante: string;
    tarjetaProfesionalDireccion: string;
    fechaRegistro: string;
  };
  usuarios: Usuario[];
  clientes: Cliente[];
  expedientes: Expediente[];
  actuaciones: Record<string, any[]>; // expedienteId -> Actuaciones[]
  terminos: TerminoAgenda[];
  documentos: DocumentoLegal[];
  honorarios: RegistroHonorario[];
  auditoria: RegistroAuditoria[];
}

// Datos semilla de nivel profesional para ordenamiento jurídico colombiano
function crearDatosSemilla(): DatabaseSchema {
  const orgId = 'org-jairrestaura-001';
  const orgNombre = 'JairRestaura Uno A & Asociados — Firma Jurídica';

  const usuarios: Usuario[] = [
    {
      id: 'usr-jair-01',
      nombre: 'Dr. Jair (Director Jurídico)',
      email: 'jairdiosdeher@gmail.com',
      tarjetaProfesional: 'T.P. No. 284.910 del C.S.J.',
      rol: 'ADMIN_TITULAR',
      organizacionId: orgId,
      organizacionNombre: orgNombre,
      fechaCreacion: '2026-01-10T08:00:00Z',
      ultimoAcceso: new Date().toISOString(),
    },
    {
      id: 'usr-marcela-02',
      nombre: 'Dra. Marcela Gómez',
      email: 'm.gomez@jairrestaura.co',
      tarjetaProfesional: 'T.P. No. 310.450 del C.S.J.',
      rol: 'ABOGADO_ASOCIADO',
      organizacionId: orgId,
      organizacionNombre: orgNombre,
      fechaCreacion: '2026-02-15T09:30:00Z',
      ultimoAcceso: new Date().toISOString(),
    },
    {
      id: 'usr-andres-03',
      nombre: 'Andrés Felipe Rojas',
      email: 'a.rojas@jairrestaura.co',
      rol: 'ASISTENTE_JUDICIAL',
      organizacionId: orgId,
      organizacionNombre: orgNombre,
      fechaCreacion: '2026-03-01T10:00:00Z',
      ultimoAcceso: new Date().toISOString(),
    },
  ];

  const clientes: Cliente[] = [
    {
      id: 'cli-andinas-01',
      tipoPersona: 'JURIDICA',
      tipoIdentificacion: 'NIT',
      numeroIdentificacion: '901.458.912',
      dv: '3',
      nombreCompletoORazonSocial: 'Inversiones Andinas de Colombia S.A.S.',
      representanteLegal: {
        nombre: 'Carlos Alberto Mejía Londoño',
        tipoIdentificacion: 'CC',
        numeroIdentificacion: '79.845.210',
        cargo: 'Gerente General y Representante Legal',
      },
      emailPrincipal: 'gerencia@inversionesandinas.co',
      emailNotificacionesJudiciales: 'notificaciones@inversionesandinas.co',
      telefono: '+57 (601) 745-8900',
      direccion: 'Carrera 7 No. 71-21 Torre B Of. 1102',
      ciudad: 'Bogotá D.C.',
      departamento: 'Cundinamarca',
      estado: 'ACTIVO',
      consentimientoLey1581: {
        autorizado: true,
        fechaAutorizacion: '2026-01-15T14:20:00Z',
        canalAutorizacion: 'DIGITAL_APP',
        finalidadTratamiento: 'Gestión procesal, representación judicial y custodia de expedientes conforme a la Ley 1581 de 2012.',
        soporteId: 'AUT-1581-2026-001',
      },
      notasInternas: 'Cliente corporativo del sector inmobiliario. Tarifa preferencial con facturación mensual por etapas.',
      organizacionId: orgId,
      fechaCreacion: '2026-01-15T14:20:00Z',
      fechaActualizacion: '2026-10-25T11:00:00Z',
      expedientesIds: ['exp-2026-001'],
    },
    {
      id: 'cli-cardona-02',
      tipoPersona: 'NATURAL',
      tipoIdentificacion: 'CC',
      numeroIdentificacion: '52.841.902',
      nombreCompletoORazonSocial: 'Dra. Elena Patricia Cardona Restrepo',
      emailPrincipal: 'dra.cardona.med@gmail.com',
      emailNotificacionesJudiciales: 'dra.cardona.notif@gmail.com',
      telefono: '+57 315 889 4512',
      direccion: 'Calle 127 No. 19-45 Apto 502',
      ciudad: 'Bogotá D.C.',
      departamento: 'Cundinamarca',
      estado: 'ACTIVO',
      consentimientoLey1581: {
        autorizado: true,
        fechaAutorizacion: '2026-02-01T10:15:00Z',
        canalAutorizacion: 'FIRMA_FISICA',
        finalidadTratamiento: 'Representación en litigio laboral y responsabilidad médica conforme a la Ley 1581 de 2012.',
        soporteId: 'AUT-1581-2026-002',
      },
      notasInternas: 'Médica especialista. Controversia sobre liquidación de acreencias laborales y vinculación por OPS.',
      organizacionId: orgId,
      fechaCreacion: '2026-02-01T10:15:00Z',
      fechaActualizacion: '2026-10-20T16:30:00Z',
      expedientesIds: ['exp-2026-002'],
    },
    {
      id: 'cli-morales-03',
      tipoPersona: 'NATURAL',
      tipoIdentificacion: 'CC',
      numeroIdentificacion: '1.018.492.381',
      nombreCompletoORazonSocial: 'Juan Sebastián Morales Pineda',
      emailPrincipal: 'jmorales.pineda@outlook.com',
      emailNotificacionesJudiciales: 'jmorales.pineda@outlook.com',
      telefono: '+57 320 634 1198',
      direccion: 'Transversal 38 No. 54-12 Sur',
      ciudad: 'Bogotá D.C.',
      departamento: 'Cundinamarca',
      estado: 'ACTIVO',
      consentimientoLey1581: {
        autorizado: true,
        fechaAutorizacion: '2026-04-10T09:00:00Z',
        canalAutorizacion: 'DIGITAL_APP',
        finalidadTratamiento: 'Trámite de Acción de Tutela de Salud y Derecho de Petición.',
        soporteId: 'AUT-1581-2026-003',
      },
      organizacionId: orgId,
      fechaCreacion: '2026-04-10T09:00:00Z',
      fechaActualizacion: '2026-10-26T08:15:00Z',
      expedientesIds: ['exp-2026-003'],
    },
  ];

  const expedientes: Expediente[] = [
    {
      id: 'exp-2026-001',
      codigoInterno: 'EXP-2026-001',
      radicadoJudicial: '11001310301520240049200',
      despachoJudicial: 'Juzgado 15 Civil del Circuito de Bogotá',
      clienteId: 'cli-andinas-01',
      clienteNombre: 'Inversiones Andinas de Colombia S.A.S.',
      areaJuridica: 'CIVIL',
      jurisdiccion: 'ORDINARIA',
      autoridadCompetente: 'Juez 15 Civil del Circuito de Bogotá',
      partes: {
        demandanteOAccionante: 'Inversiones Andinas de Colombia S.A.S.',
        apoderadoDemandante: 'Dr. Jair (T.P. 284.910)',
        demandadoOAccionado: 'Desarrollos Comerciales La Sabana S.A.',
        apoderadoDemandado: 'Dra. Victoria Eugenia Silva (T.P. 195.820)',
        vinculadosTerceros: ['Fiduciaria Central S.A.'],
        juezOMagistradoPonente: 'Dr. Humberto Gómez Rivera',
      },
      sintesisHechos: 'Incumplimiento de contrato de promesa de compraventa sobre lote comercial de 4.200 m2 ubicado en Chía. La demandada omitió saneamiento de servidumbres y entrega material dentro del plazo convenido.',
      pretensionesUObjetivos: 'Declaratoria de resolución judicial del contrato por culpa de la parte vendedora; restitución de anticipo indexado ($340.000.000 COP) y condena al pago de cláusula penal compensatoria ($68.000.000 COP).',
      cuantiaEstimadaCOP: 408000000,
      esMayorCuantia: true,
      estado: 'AUDIENCIA_INICIAL_372',
      estrategiaDefensiva: 'Carga dinámica de la prueba sobre el oportuno levantamiento de gravámenes; solicitar fijación de litigio restringida al término pactado de entrega.',
      notasPrivadas: 'Pendiente peritaje técnico sobre el valor comercial de la mejora y el impacto de la servidumbre de acueducto.',
      fechaInicio: '2024-09-12T10:00:00Z',
      fechaActualizacion: '2026-10-26T15:00:00Z',
      organizacionId: orgId,
      abogadoResponsableId: 'usr-jair-01',
      abogadoResponsableNombre: 'Dr. Jair',
    },
    {
      id: 'exp-2026-002',
      codigoInterno: 'EXP-2026-002',
      radicadoJudicial: '05001333300220250018800',
      despachoJudicial: 'Tribunal Administrativo de Antioquia - Sección Segunda',
      clienteId: 'cli-cardona-02',
      clienteNombre: 'Dra. Elena Patricia Cardona Restrepo',
      areaJuridica: 'ADMINISTRATIVO',
      jurisdiccion: 'CONTENCIOSO_ADMINISTRATIVO',
      autoridadCompetente: 'Magistrada Ponente Dra. Claudia Inés Peláez',
      partes: {
        demandanteOAccionante: 'Elena Patricia Cardona Restrepo',
        apoderadoDemandante: 'Dra. Marcela Gómez (T.P. 310.450)',
        demandadoOAccionado: 'Empresa Social del Estado Hospital Regional San Juan',
        apoderadoDemandado: 'Dr. Álvaro Pardo Botero',
      },
      sintesisHechos: 'Vinculación sucesiva e ininterrumpida durante 7 años mediante sucesivos contratos de prestación de servicios para cumplir funciones médicas de planta, subordinación estricta y turnos asistenciales continuos.',
      pretensionesUObjetivos: 'Nulidad y restablecimiento del derecho; reconocimiento del Contrato Realidad laboral, pago de cesantías, primas, vacaciones y cotizaciones a pensión.',
      cuantiaEstimadaCOP: 195000000,
      esMayorCuantia: true,
      estado: 'CONTESTACION_TRASLADO',
      estrategiaDefensiva: 'Acreditación probatoria de subordinación mediante circulares internas de asignación de turnos y evaluaciones de desempeño institucional.',
      fechaInicio: '2025-05-18T08:30:00Z',
      fechaActualizacion: '2026-10-24T12:00:00Z',
      organizacionId: orgId,
      abogadoResponsableId: 'usr-marcela-02',
      abogadoResponsableNombre: 'Dra. Marcela Gómez',
    },
    {
      id: 'exp-2026-003',
      codigoInterno: 'EXP-2026-003',
      radicadoJudicial: '11001400300420260002100',
      despachoJudicial: 'Juzgado 4 Laboral del Circuito de Bogotá',
      clienteId: 'cli-morales-03',
      clienteNombre: 'Juan Sebastián Morales Pineda',
      areaJuridica: 'LABORAL_SEGURIDAD_SOCIAL',
      jurisdiccion: 'ORDINARIA',
      autoridadCompetente: 'Juez 4 Laboral del Circuito de Bogotá',
      partes: {
        demandanteOAccionante: 'Juan Sebastián Morales Pineda',
        apoderadoDemandante: 'Dr. Jair (T.P. 284.910)',
        demandadoOAccionado: 'EPS Famisanar & Fondo de Pensiones Porvenir',
      },
      sintesisHechos: 'Negativa en reconocimiento y pago de incapacidades continuas que superan los 180 días con concepto desfavorable de rehabilitación emitido tardíamente.',
      pretensionesUObjetivos: 'Tutela transitoria y ordinario laboral para ordenar el pago retroactivo del subsidio de incapacidad por enfermedad general.',
      cuantiaEstimadaCOP: 38500000,
      esMayorCuantia: false,
      estado: 'ADMITIDO',
      fechaInicio: '2026-02-10T11:00:00Z',
      fechaActualizacion: '2026-10-27T09:00:00Z',
      organizacionId: orgId,
      abogadoResponsableId: 'usr-jair-01',
      abogadoResponsableNombre: 'Dr. Jair',
    },
  ];

  const actuaciones: Record<string, any[]> = {
    'exp-2026-001': [
      {
        id: 'act-001-1',
        expedienteId: 'exp-2026-001',
        fechaActuacion: '2024-09-12',
        cuaderno: 'Cuaderno Principal 1',
        folio: '1-34',
        tipoProvidencia: 'MEMORIAL_PARTE',
        anotacion: 'Radicación de demanda ordinaria declarativa de resolución de contrato con juramento estimatorio.',
        tieneTermino: false,
        creadoPor: 'Dr. Jair',
        fechaCreacion: '2024-09-12T10:00:00Z',
      },
      {
        id: 'act-001-2',
        expedienteId: 'exp-2026-001',
        fechaActuacion: '2024-11-20',
        cuaderno: 'Cuaderno Principal 1',
        folio: '45-48',
        tipoProvidencia: 'AUTO_ADMISORIO',
        anotacion: 'Auto admite demanda y ordena correr traslado por el término de veinte (20) días.',
        tieneTermino: true,
        terminoDias: 20,
        tipoDias: 'HABILES',
        creadoPor: 'Sistema Judicial',
        fechaCreacion: '2024-11-20T14:30:00Z',
      },
      {
        id: 'act-001-3',
        expedienteId: 'exp-2026-001',
        fechaActuacion: '2026-10-15',
        cuaderno: 'Cuaderno Principal 1',
        tipoProvidencia: 'AUTO_INTERLOCUTORIO',
        anotacion: 'Fija fecha y hora para la celebración de la Audiencia Inicial prevista en el Artículo 372 del CGP (Conciliación, Excepciones Previas y Fijación de Litigio) para el 12 de noviembre de 2026 a las 09:00 a.m.',
        tieneTermino: true,
        terminoDias: 15,
        tipoDias: 'HABILES',
        creadoPor: 'Dr. Jair',
        fechaCreacion: '2026-10-15T16:00:00Z',
      },
    ],
  };

  const terminos: TerminoAgenda[] = [
    {
      id: 'term-001',
      expedienteId: 'exp-2026-001',
      expedienteCodigo: 'EXP-2026-001',
      clienteId: 'cli-andinas-01',
      clienteNombre: 'Inversiones Andinas de Colombia S.A.S.',
      titulo: 'Audiencia Inicial Art. 372 CGP (Virtual vía Teams)',
      descripcion: 'Preparación de fórmulas de arreglo conciliatorio, ratificación de juramento estimatorio y oposición a excepciones previas.',
      tipoTermino: 'AUDIENCIA',
      fechaNotificacionOInicio: '2026-10-15',
      aplicaReglaLey2213: false,
      duracionDias: 18,
      tipoDias: 'HABILES_JUDICIALES',
      fechaVencimientoCalculada: '2026-11-12',
      calculoConfirmadoPorAbogado: true,
      abogadoQueConfirmo: 'Dr. Jair',
      notasCómputo: 'Fijación formal por Auto del 15 de Octubre. Cédula del representante legal requerida para autenticación en sala virtual.',
      estado: 'VERIFICADO',
      prioridad: 'ALTA',
      responsableId: 'usr-jair-01',
      responsableNombre: 'Dr. Jair',
      organizacionId: orgId,
    },
    {
      id: 'term-002',
      expedienteId: 'exp-2026-002',
      expedienteCodigo: 'EXP-2026-002',
      clienteId: 'cli-cardona-02',
      clienteNombre: 'Dra. Elena Patricia Cardona Restrepo',
      titulo: 'Descorrer traslado de excepciones de mérito (30 días CPACA)',
      descripcion: 'Presentar memorial desvirtuando excepción de prescripción y falta de causa invocadas por la E.S.E. demandada.',
      tipoTermino: 'CONTESTACION_TRASLADO',
      fechaNotificacionOInicio: '2026-10-18',
      aplicaReglaLey2213: true,
      duracionDias: 30,
      tipoDias: 'HABILES_JUDICIALES',
      fechaVencimientoCalculada: '2026-12-04',
      calculoConfirmadoPorAbogado: true,
      abogadoQueConfirmo: 'Dra. Marcela Gómez',
      notasCómputo: 'Notificación electrónica conforme al Art. 8 Ley 2213/2022. Término empezó a correr al tercer día hábil siguiente.',
      estado: 'PENDIENTE',
      prioridad: 'ALTA',
      responsableId: 'usr-marcela-02',
      responsableNombre: 'Dra. Marcela Gómez',
      organizacionId: orgId,
    },
    {
      id: 'term-003',
      expedienteId: 'exp-2026-003',
      expedienteCodigo: 'EXP-2026-003',
      clienteId: 'cli-morales-03',
      clienteNombre: 'Juan Sebastián Morales Pineda',
      titulo: 'Subsanación de requisitos formales de demanda (5 días Art. 90 CGP)',
      descripcion: 'Aclarar acápite de notificaciones conforme a la Ley 2213 de 2022 y aportar historial clínico actualizado.',
      tipoTermino: 'SUBSANACION_DEMANDA',
      fechaNotificacionOInicio: '2026-10-24',
      aplicaReglaLey2213: true,
      duracionDias: 5,
      tipoDias: 'HABILES_JUDICIALES',
      fechaVencimientoCalculada: '2026-11-04',
      calculoConfirmadoPorAbogado: false,
      notasCómputo: 'Pendiente refrendación final del abogado titular con el cómputo del puente festivo del 2 de noviembre.',
      estado: 'PENDIENTE',
      prioridad: 'ALTA',
      responsableId: 'usr-andres-03',
      responsableNombre: 'Andrés Felipe Rojas',
      organizacionId: orgId,
    },
  ];

  const documentos: DocumentoLegal[] = [
    {
      id: 'doc-001',
      titulo: 'Poder Especial y Amplio - Inversiones Andinas S.A.S.',
      tipo: 'PODER_ESPECIAL',
      expedienteId: 'exp-2026-001',
      clienteId: 'cli-andinas-01',
      version: 1,
      contenidoTexto: PLANTILLAS_JURIDICAS.find((p) => p.id === 'PODER_ESPECIAL')?.generarBorrador({
        ciudad: 'Bogotá D.C.',
        poderdanteNombre: 'Inversiones Andinas de Colombia S.A.S. (Rep. Carlos Alberto Mejía)',
        poderdanteId: 'NIT 901.458.912-3 / C.C. 79.845.210',
        apoderadoNombre: 'Dr. Jair',
        apoderadoId: '80.123.456',
        apoderadoTP: '284.910',
        asuntoObjeto: 'Proceso declarativo verbal de resolución de contrato de promesa de compraventa de mayor cuantía en contra de Desarrollos Comerciales La Sabana S.A.',
        contraparte: 'Desarrollos Comerciales La Sabana S.A.',
      }) || '',
      estadoRevision: 'APROBADO_PARA_RADICACION',
      advertenciasRequisitos: ['Verificar envío desde el buzón de notificaciones registrado en Certificado de Cámara de Comercio conforme al Art. 5 Ley 2213/2022.'],
      fechaCreacion: '2024-09-10T10:00:00Z',
      fechaModificacion: '2024-09-11T12:00:00Z',
      autorId: 'usr-jair-01',
      autorNombre: 'Dr. Jair',
      organizacionId: orgId,
    },
  ];

  const honorarios: RegistroHonorario[] = [
    {
      id: 'hon-001',
      expedienteId: 'exp-2026-001',
      expedienteCodigo: 'EXP-2026-001',
      clienteId: 'cli-andinas-01',
      clienteNombre: 'Inversiones Andinas de Colombia S.A.S.',
      concepto: 'Representación judicial integral proceso de resolución contractual de mayor cuantía.',
      modalidad: 'MIXTO',
      valorAcordadoCOP: 28000000,
      valorPagadoCOP: 14000000,
      saldoPendienteCOP: 14000000,
      estado: 'PARCIAL',
      fechaAcuerdo: '2024-09-10',
      fechaVencimiento: '2026-11-30',
      pagosRegistrados: [
        {
          id: 'pag-01',
          fechaPago: '2024-09-15',
          montoCOP: 14000000,
          medioPago: 'TRANSFERENCIA_BANCARIA',
          numeroComprobante: 'BCO-BOG-984120',
          verificadoPorContabilidad: true,
          registradoPor: 'Dr. Jair',
        },
      ],
      gastosProcesales: [
        {
          id: 'gas-01',
          concepto: 'Arancel de notificación personal certificada por correo electrónico con acuse técnico',
          montoCOP: 185000,
          fecha: '2024-11-25',
          asumidoPor: 'CLIENTE',
        },
      ],
      organizacionId: orgId,
    },
    {
      id: 'hon-002',
      expedienteId: 'exp-2026-002',
      expedienteCodigo: 'EXP-2026-002',
      clienteId: 'cli-cardona-02',
      clienteNombre: 'Dra. Elena Patricia Cardona Restrepo',
      concepto: 'Demanda de Nulidad y Restablecimiento del Derecho (Contrato Realidad)',
      modalidad: 'CUOTA_LITIS',
      valorAcordadoCOP: 39000000, // 20% estimado sobre pretensiones
      valorPagadoCOP: 3000000,
      saldoPendienteCOP: 36000000,
      estado: 'PARCIAL',
      fechaAcuerdo: '2025-05-15',
      pagosRegistrados: [
        {
          id: 'pag-02',
          fechaPago: '2025-05-20',
          montoCOP: 3000000,
          medioPago: 'CONSIGNACION',
          numeroComprobante: 'REC-CAJA-0045',
          verificadoPorContabilidad: true,
          registradoPor: 'Dra. Marcela Gómez',
        },
      ],
      gastosProcesales: [],
      organizacionId: orgId,
    },
  ];

  const auditoria: RegistroAuditoria[] = [
    {
      id: 'aud-001',
      timestamp: '2026-10-28T16:00:00Z',
      usuarioId: 'usr-jair-01',
      usuarioNombre: 'Dr. Jair',
      usuarioRol: 'ADMIN_TITULAR',
      accion: 'LOGIN',
      modulo: 'SEGURIDAD',
      descripcionDetallada: 'Inicio de sesión exitoso en plataforma enterprise JAIRRESTAURA UNO A con token institucional.',
      organizacionId: orgId,
    },
    {
      id: 'aud-002',
      timestamp: '2026-10-28T16:30:00Z',
      usuarioId: 'usr-jair-01',
      usuarioNombre: 'Dr. Jair',
      usuarioRol: 'ADMIN_TITULAR',
      accion: 'CONFIRM_TERM',
      modulo: 'AGENDA',
      registroIdAfectado: 'term-001',
      descripcionDetallada: 'Validación manual del término procesal de Audiencia Inicial Art. 372 CGP para expediente EXP-2026-001.',
      organizacionId: orgId,
    },
  ];

  return {
    organizacion: {
      id: orgId,
      nombre: orgNombre,
      nit: '901.890.123-4',
      representante: 'Dr. Jair',
      tarjetaProfesionalDireccion: 'T.P. 284.910 del C.S.J.',
      fechaRegistro: '2026-01-01T00:00:00Z',
    },
    usuarios,
    clientes,
    expedientes,
    actuaciones,
    terminos,
    documentos,
    honorarios,
    auditoria,
  };
}

// Carga o inicializa la base de datos persistente
function leerDB(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const inicial = crearDatosSemilla();
      fs.writeFileSync(DB_FILE, JSON.stringify(inicial, null, 2), 'utf-8');
      return inicial;
    }
    const contenido = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(contenido) as DatabaseSchema;
  } catch (error) {
    console.error('Error al leer base de datos, reiniciando con semilla:', error);
    const inicial = crearDatosSemilla();
    fs.writeFileSync(DB_FILE, JSON.stringify(inicial, null, 2), 'utf-8');
    return inicial;
  }
}

function guardarDB(db: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (error) {
    console.error('Error al guardar base de datos:', error);
  }
}

// Registrar acción en pista de auditoría inmutable
function registrarAuditoria(
  usuarioId: string,
  usuarioNombre: string,
  usuarioRol: any,
  accion: RegistroAuditoria['accion'],
  modulo: RegistroAuditoria['modulo'],
  descripcion: string,
  registroIdAfectado?: string
) {
  const db = leerDB();
  const nuevoRegistro: RegistroAuditoria = {
    id: `aud-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    timestamp: new Date().toISOString(),
    usuarioId,
    usuarioNombre,
    usuarioRol,
    accion,
    modulo,
    registroIdAfectado,
    descripcionDetallada: descripcion,
    organizacionId: db.organizacion.id,
  };
  db.auditoria.unshift(nuevoRegistro);
  if (db.auditoria.length > 500) {
    db.auditoria = db.auditoria.slice(0, 500); // Conservar últimos 500 eventos
  }
  guardarDB(db);
}

// ==========================================
// RUTAS DE LA API REST
// ==========================================

// 1. Sesión y Autenticación
app.get('/api/auth/me', (req: Request, res: Response) => {
  const db = leerDB();
  // Retorna el usuario activo (por defecto Dr. Jair o según header)
  const userId = req.headers['x-user-id'] as string;
  const user = db.usuarios.find((u) => u.id === userId) || db.usuarios[0];
  res.json({
    usuario: user,
    organizacion: db.organizacion,
    usuariosDisponibles: db.usuarios,
  });
});

app.post('/api/auth/switch-user', (req: Request, res: Response) => {
  const { userId } = req.body;
  const db = leerDB();
  const user = db.usuarios.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  user.ultimoAcceso = new Date().toISOString();
  guardarDB(db);
  registrarAuditoria(user.id, user.nombre, user.rol, 'LOGIN', 'SEGURIDAD', `Cambio de perfil activo a ${user.nombre} (${user.rol})`);
  res.json({ success: true, usuario: user });
});

// 2. Indicadores Consolidados del Dashboard
app.get('/api/dashboard/stats', (req: Request, res: Response) => {
  const db = leerDB();
  const totalClientes = db.clientes.filter((c) => c.estado === 'ACTIVO').length;
  const expedientesActivos = db.expedientes.filter((e) => e.estado !== 'ARCHIVADO' && e.estado !== 'TERMINADO_CONCILIACION').length;
  
  // Términos próximos a vencer (en los próximos 10 días o vencidos)
  const hoyStr = new Date().toISOString().split('T')[0];
  const terminosPendientes = db.terminos.filter((t) => t.estado === 'PENDIENTE' || t.estado === 'VERIFICADO');
  const terminosCriticos = terminosPendientes.filter((t) => t.fechaVencimientoCalculada <= hoyStr || t.prioridad === 'ALTA');

  // Total honorarios pactados vs recaudados
  const totalHonorariosPactados = db.honorarios.reduce((acc, h) => acc + h.valorAcordadoCOP, 0);
  const totalHonorariosRecaudados = db.honorarios.reduce((acc, h) => acc + h.valorPagadoCOP, 0);
  const saldoPorCobrar = totalHonorariosPactados - totalHonorariosRecaudados;

  res.json({
    totalClientes,
    expedientesActivos,
    terminosPendientesTotal: terminosPendientes.length,
    terminosCriticosTotal: terminosCriticos.length,
    totalDocumentos: db.documentos.length,
    totalHonorariosPactados,
    totalHonorariosRecaudados,
    saldoPorCobrar,
    proximosTerminos: terminosPendientes.slice(0, 5),
    expedientesRecientes: db.expedientes.slice(0, 5),
    actividadReciente: db.auditoria.slice(0, 6),
  });
});

// 3. Módulo de Clientes (CRUD y Protección Ley 1581)
app.get('/api/clientes', (req: Request, res: Response) => {
  const db = leerDB();
  const { buscar, estado, tipo } = req.query;
  let filtrados = db.clientes;

  if (estado && typeof estado === 'string') {
    filtrados = filtrados.filter((c) => c.estado === estado);
  }
  if (tipo && typeof tipo === 'string') {
    filtrados = filtrados.filter((c) => c.tipoPersona === tipo);
  }
  if (buscar && typeof buscar === 'string') {
    const q = buscar.toLowerCase();
    filtrados = filtrados.filter(
      (c) =>
        c.nombreCompletoORazonSocial.toLowerCase().includes(q) ||
        c.numeroIdentificacion.includes(q) ||
        c.emailPrincipal.toLowerCase().includes(q)
    );
  }

  res.json({ clientes: filtrados });
});

app.post('/api/clientes', (req: Request, res: Response) => {
  const db = leerDB();
  const nuevoClienteData = req.body;

  if (!nuevoClienteData.nombreCompletoORazonSocial || !nuevoClienteData.numeroIdentificacion) {
    return res.status(400).json({ error: 'El nombre/razón social y la identificación son obligatorios' });
  }

  const nuevoCliente: Cliente = {
    ...nuevoClienteData,
    id: `cli-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    organizacionId: db.organizacion.id,
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
    expedientesIds: [],
    estado: nuevoClienteData.estado || 'ACTIVO',
    consentimientoLey1581: nuevoClienteData.consentimientoLey1581 || {
      autorizado: true,
      fechaAutorizacion: new Date().toISOString(),
      canalAutorizacion: 'DIGITAL_APP',
      finalidadTratamiento: 'Gestión y trámite de asesoría y representación jurídica.',
    },
  };

  db.clientes.unshift(nuevoCliente);
  guardarDB(db);

  registrarAuditoria(
    'usr-jair-01',
    'Dr. Jair',
    'ADMIN_TITULAR',
    'CREATE',
    'CLIENTES',
    `Creación de cliente: ${nuevoCliente.nombreCompletoORazonSocial} (${nuevoCliente.tipoIdentificacion} ${nuevoCliente.numeroIdentificacion})`,
    nuevoCliente.id
  );

  res.status(201).json({ cliente: nuevoCliente });
});

app.put('/api/clientes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = leerDB();
  const index = db.clientes.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }

  db.clientes[index] = {
    ...db.clientes[index],
    ...req.body,
    fechaActualizacion: new Date().toISOString(),
  };

  guardarDB(db);
  registrarAuditoria(
    'usr-jair-01',
    'Dr. Jair',
    'ADMIN_TITULAR',
    'UPDATE',
    'CLIENTES',
    `Actualización de datos del cliente: ${db.clientes[index].nombreCompletoORazonSocial}`,
    id
  );

  res.json({ cliente: db.clientes[index] });
});

app.post('/api/clientes/:id/archive', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = leerDB();
  const cliente = db.clientes.find((c) => c.id === id);
  if (!cliente) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }

  cliente.estado = cliente.estado === 'ARCHIVADO' ? 'ACTIVO' : 'ARCHIVADO';
  cliente.fechaActualizacion = new Date().toISOString();
  guardarDB(db);

  registrarAuditoria(
    'usr-jair-01',
    'Dr. Jair',
    'ADMIN_TITULAR',
    'UPDATE',
    'CLIENTES',
    `Cambio de estado del cliente ${cliente.nombreCompletoORazonSocial} a ${cliente.estado}`,
    id
  );

  res.json({ cliente });
});

// 4. Módulo de Expedientes y Casos
app.get('/api/expedientes', (req: Request, res: Response) => {
  const db = leerDB();
  const { buscar, area, estado, clienteId } = req.query;
  let filtrados = db.expedientes;

  if (clienteId && typeof clienteId === 'string') {
    filtrados = filtrados.filter((e) => e.clienteId === clienteId);
  }
  if (area && typeof area === 'string') {
    filtrados = filtrados.filter((e) => e.areaJuridica === area);
  }
  if (estado && typeof estado === 'string') {
    filtrados = filtrados.filter((e) => e.estado === estado);
  }
  if (buscar && typeof buscar === 'string') {
    const q = buscar.toLowerCase();
    filtrados = filtrados.filter(
      (e) =>
        e.codigoInterno.toLowerCase().includes(q) ||
        (e.radicadoJudicial && e.radicadoJudicial.includes(q)) ||
        e.clienteNombre.toLowerCase().includes(q) ||
        e.sintesisHechos.toLowerCase().includes(q) ||
        e.partes.demandanteOAccionante.toLowerCase().includes(q) ||
        e.partes.demandadoOAccionado.toLowerCase().includes(q)
    );
  }

  res.json({ expedientes: filtrados });
});

app.get('/api/expedientes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = leerDB();
  const expediente = db.expedientes.find((e) => e.id === id);
  if (!expediente) {
    return res.status(404).json({ error: 'Expediente no encontrado' });
  }

  const actuaciones = db.actuaciones[id] || [];
  const terminos = db.terminos.filter((t) => t.expedienteId === id);
  const documentos = db.documentos.filter((d) => d.expedienteId === id);
  const cliente = db.clientes.find((c) => c.id === expediente.clienteId);

  res.json({
    expediente,
    actuaciones,
    terminos,
    documentos,
    cliente,
  });
});

app.post('/api/expedientes', (req: Request, res: Response) => {
  const db = leerDB();
  const datos = req.body;

  if (!datos.clienteId || !datos.areaJuridica || !datos.sintesisHechos) {
    return res.status(400).json({ error: 'El cliente, área jurídica y síntesis de hechos son obligatorios' });
  }

  // Generar código interno consecutivo
  const year = new Date().getFullYear();
  const count = db.expedientes.length + 1;
  const codigoInterno = `EXP-${year}-${String(count).padStart(3, '0')}`;

  const nuevoExpediente: Expediente = {
    ...datos,
    id: `exp-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    codigoInterno,
    organizacionId: db.organizacion.id,
    fechaInicio: datos.fechaInicio || new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
    estado: datos.estado || 'PREJUDICIAL',
  };

  db.expedientes.unshift(nuevoExpediente);
  db.actuaciones[nuevoExpediente.id] = [
    {
      id: `act-${Date.now()}`,
      expedienteId: nuevoExpediente.id,
      fechaActuacion: new Date().toISOString().split('T')[0],
      cuaderno: 'Cuaderno Principal',
      tipoProvidencia: 'CONSTANCIA',
      anotacion: 'Apertura formal de expediente en plataforma jurídica JAIRRESTAURA UNO A.',
      tieneTermino: false,
      creadoPor: nuevoExpediente.abogadoResponsableNombre || 'Dr. Jair',
      fechaCreacion: new Date().toISOString(),
    },
  ];

  // Asociar con cliente
  const cli = db.clientes.find((c) => c.id === nuevoExpediente.clienteId);
  if (cli) {
    cli.expedientesIds.push(nuevoExpediente.id);
  }

  guardarDB(db);

  registrarAuditoria(
    nuevoExpediente.abogadoResponsableId || 'usr-jair-01',
    nuevoExpediente.abogadoResponsableNombre || 'Dr. Jair',
    'ADMIN_TITULAR',
    'CREATE',
    'EXPEDIENTES',
    `Apertura de expediente ${nuevoExpediente.codigoInterno} (${nuevoExpediente.areaJuridica}) para cliente ${nuevoExpediente.clienteNombre}`,
    nuevoExpediente.id
  );

  res.status(201).json({ expediente: nuevoExpediente });
});

app.post('/api/expedientes/:id/actuaciones', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = leerDB();
  const expediente = db.expedientes.find((e) => e.id === id);
  if (!expediente) {
    return res.status(404).json({ error: 'Expediente no encontrado' });
  }

  const { anotacion, tipoProvidencia, cuaderno, tieneTermino, terminoDias, tipoDias } = req.body;
  if (!anotacion) {
    return res.status(400).json({ error: 'La anotación de la actuación es obligatoria' });
  }

  if (!db.actuaciones[id]) {
    db.actuaciones[id] = [];
  }

  const nuevaActuacion = {
    id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    expedienteId: id,
    fechaActuacion: req.body.fechaActuacion || new Date().toISOString().split('T')[0],
    cuaderno: cuaderno || 'Cuaderno Principal 1',
    folio: req.body.folio,
    tipoProvidencia: tipoProvidencia || 'MEMORIAL_PARTE',
    anotacion,
    actuacionRamaJudicial: req.body.actuacionRamaJudicial,
    tieneTermino: !!tieneTermino,
    terminoDias: terminoDias ? Number(terminoDias) : undefined,
    tipoDias: tipoDias || 'HABILES',
    creadoPor: req.body.creadoPor || 'Dr. Jair',
    fechaCreacion: new Date().toISOString(),
  };

  db.actuaciones[id].unshift(nuevaActuacion);

  // Si tiene término, registrar automáticamente en la agenda
  if (tieneTermino && terminoDias) {
    const calculo = calcularTerminoColombiano(
      nuevaActuacion.fechaActuacion,
      Number(terminoDias),
      tipoDias === 'CALENDARIO' ? 'CALENDARIO' : 'HABILES_JUDICIALES',
      true
    );

    const nuevoTermino: TerminoAgenda = {
      id: `term-${Date.now()}`,
      expedienteId: expediente.id,
      expedienteCodigo: expediente.codigoInterno,
      clienteId: expediente.clienteId,
      clienteNombre: expediente.clienteNombre,
      titulo: `Término procesal providencia ${nuevaActuacion.tipoProvidencia}`,
      descripcion: nuevaActuacion.anotacion,
      tipoTermino: 'OTRO',
      fechaNotificacionOInicio: nuevaActuacion.fechaActuacion,
      aplicaReglaLey2213: true,
      duracionDias: Number(terminoDias),
      tipoDias: tipoDias === 'CALENDARIO' ? 'CALENDARIO' : 'HABILES_JUDICIALES',
      fechaVencimientoCalculada: calculo.fechaVencimientoCalculada,
      calculoConfirmadoPorAbogado: false,
      estado: 'PENDIENTE',
      prioridad: 'ALTA',
      responsableId: expediente.abogadoResponsableId,
      responsableNombre: expediente.abogadoResponsableNombre,
      organizacionId: db.organizacion.id,
    };
    db.terminos.unshift(nuevoTermino);
  }

  expediente.fechaActualizacion = new Date().toISOString();
  guardarDB(db);

  registrarAuditoria(
    'usr-jair-01',
    'Dr. Jair',
    'ADMIN_TITULAR',
    'CREATE',
    'EXPEDIENTES',
    `Registro de actuación procesal en expediente ${expediente.codigoInterno}: ${anotacion.substring(0, 80)}...`,
    nuevaActuacion.id
  );

  res.status(201).json({ actuacion: nuevaActuacion });
});

// 5. Cómputo y Control de Términos Judiciales (CGP, CPACA, Ley 2213/2022)
app.post('/api/terminos/calculate', (req: Request, res: Response) => {
  const { fechaNotificacion, duracionDias, tipoDias, aplicaLey2213 } = req.body;

  if (!fechaNotificacion || !duracionDias) {
    return res.status(400).json({ error: 'La fecha de notificación y la duración en días son obligatorias' });
  }

  const resultado = calcularTerminoColombiano(
    fechaNotificacion,
    Number(duracionDias),
    tipoDias === 'CALENDARIO' ? 'CALENDARIO' : 'HABILES_JUDICIALES',
    aplicaLey2213 !== false
  );

  res.json({ resultado });
});

app.get('/api/terminos', (req: Request, res: Response) => {
  const db = leerDB();
  const { estado, prioridad } = req.query;
  let filtrados = db.terminos;

  if (estado && typeof estado === 'string') {
    filtrados = filtrados.filter((t) => t.estado === estado);
  }
  if (prioridad && typeof prioridad === 'string') {
    filtrados = filtrados.filter((t) => t.prioridad === prioridad);
  }

  // Ordenar por fecha de vencimiento más próxima
  filtrados.sort((a, b) => a.fechaVencimientoCalculada.localeCompare(b.fechaVencimientoCalculada));

  res.json({ terminos: filtrados });
});

app.post('/api/terminos', (req: Request, res: Response) => {
  const db = leerDB();
  const datos = req.body;

  if (!datos.titulo || !datos.fechaNotificacionOInicio || !datos.duracionDias) {
    return res.status(400).json({ error: 'Título, fecha inicial y duración son obligatorios' });
  }

  const calculo = calcularTerminoColombiano(
    datos.fechaNotificacionOInicio,
    Number(datos.duracionDias),
    datos.tipoDias === 'CALENDARIO' ? 'CALENDARIO' : 'HABILES_JUDICIALES',
    datos.aplicaReglaLey2213 !== false
  );

  const nuevoTermino: TerminoAgenda = {
    ...datos,
    id: `term-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    fechaVencimientoCalculada: calculo.fechaVencimientoCalculada,
    calculoConfirmadoPorAbogado: !!datos.calculoConfirmadoPorAbogado,
    abogadoQueConfirmo: datos.calculoConfirmadoPorAbogado ? 'Dr. Jair' : undefined,
    estado: datos.estado || 'PENDIENTE',
    prioridad: datos.prioridad || 'ALTA',
    organizacionId: db.organizacion.id,
    responsableId: datos.responsableId || 'usr-jair-01',
    responsableNombre: datos.responsableNombre || 'Dr. Jair',
  };

  db.terminos.unshift(nuevoTermino);
  guardarDB(db);

  registrarAuditoria(
    'usr-jair-01',
    'Dr. Jair',
    'ADMIN_TITULAR',
    'CREATE',
    'AGENDA',
    `Creación de término procesal: ${nuevoTermino.titulo} (Vencimiento: ${nuevoTermino.fechaVencimientoCalculada})`,
    nuevoTermino.id
  );

  res.status(201).json({ termino: nuevoTermino, calculoDetallado: calculo });
});

app.post('/api/terminos/:id/confirm', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = leerDB();
  const termino = db.terminos.find((t) => t.id === id);
  if (!termino) {
    return res.status(404).json({ error: 'Término no encontrado' });
  }

  termino.calculoConfirmadoPorAbogado = true;
  termino.abogadoQueConfirmo = req.body.abogadoNombre || 'Dr. Jair';
  termino.estado = 'VERIFICADO';
  guardarDB(db);

  registrarAuditoria(
    'usr-jair-01',
    'Dr. Jair',
    'ADMIN_TITULAR',
    'CONFIRM_TERM',
    'AGENDA',
    `Validación y confirmación jurídica manual del término procesal: ${termino.titulo}`,
    id
  );

  res.json({ termino });
});

app.post('/api/terminos/:id/complete', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = leerDB();
  const termino = db.terminos.find((t) => t.id === id);
  if (!termino) {
    return res.status(404).json({ error: 'Término no encontrado' });
  }

  termino.estado = 'CUMPLIDO';
  guardarDB(db);

  registrarAuditoria(
    'usr-jair-01',
    'Dr. Jair',
    'ADMIN_TITULAR',
    'UPDATE',
    'AGENDA',
    `Término marcado como cumplido: ${termino.titulo}`,
    id
  );

  res.json({ termino });
});

// Festivos de Colombia
app.get('/api/terminos/festivos/:year', (req: Request, res: Response) => {
  const year = parseInt(req.params.year) || new Date().getFullYear();
  const festivos = obtenerFestivosColombia(year);
  res.json({ year, festivos });
});

// 6. Redacción y Gestión Documental
app.get('/api/documentos', (req: Request, res: Response) => {
  const db = leerDB();
  res.json({ documentos: db.documentos, plantillas: PLANTILLAS_JURIDICAS });
});

app.post('/api/documentos', (req: Request, res: Response) => {
  const db = leerDB();
  const datos = req.body;

  if (!datos.titulo || !datos.contenidoTexto) {
    return res.status(400).json({ error: 'El título y el contenido son obligatorios' });
  }

  const nuevoDocumento: DocumentoLegal = {
    ...datos,
    id: `doc-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    version: 1,
    estadoRevision: datos.estadoRevision || 'BORRADOR_PRELIMINAR',
    advertenciasRequisitos: datos.advertenciasRequisitos || [],
    fechaCreacion: new Date().toISOString(),
    fechaModificacion: new Date().toISOString(),
    autorId: 'usr-jair-01',
    autorNombre: 'Dr. Jair',
    organizacionId: db.organizacion.id,
  };

  db.documentos.unshift(nuevoDocumento);
  guardarDB(db);

  registrarAuditoria(
    'usr-jair-01',
    'Dr. Jair',
    'ADMIN_TITULAR',
    'CREATE',
    'DOCUMENTOS',
    `Creación de documento jurídico: ${nuevoDocumento.titulo} (${nuevoDocumento.tipo})`,
    nuevoDocumento.id
  );

  res.status(201).json({ documento: nuevoDocumento });
});

app.put('/api/documentos/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = leerDB();
  const doc = db.documentos.find((d) => d.id === id);
  if (!doc) {
    return res.status(404).json({ error: 'Documento no encontrado' });
  }

  doc.titulo = req.body.titulo || doc.titulo;
  doc.contenidoTexto = req.body.contenidoTexto || doc.contenidoTexto;
  doc.estadoRevision = req.body.estadoRevision || doc.estadoRevision;
  doc.version += 1;
  doc.fechaModificacion = new Date().toISOString();

  guardarDB(db);

  registrarAuditoria(
    'usr-jair-01',
    'Dr. Jair',
    'ADMIN_TITULAR',
    'UPDATE',
    'DOCUMENTOS',
    `Edición y nueva versión v${doc.version} de documento: ${doc.titulo}`,
    id
  );

  res.json({ documento: doc });
});

// Descarga en formato Word / DOC (HTML MIME compatible con Microsoft Word y LibreOffice)
app.get('/api/documentos/:id/download-word', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = leerDB();
  const doc = db.documentos.find((d) => d.id === id);
  if (!doc) {
    return res.status(404).send('Documento no encontrado');
  }

  // Generación de archivo HTML estructurado con encabezados XML para Word
  const htmlParaWord = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${doc.titulo}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; margin: 2.5cm; }
        h1, h2, h3 { font-family: 'Arial', sans-serif; }
        .encabezado { text-align: center; font-weight: bold; margin-bottom: 24pt; }
        .pie { font-size: 9pt; color: #555; text-align: center; margin-top: 36pt; border-top: 1px solid #ccc; padding-top: 8pt; }
      </style>
    </head>
    <body>
      <div class="encabezado">
        <p style="margin:0; font-size: 14pt;">${db.organizacion.nombre}</p>
        <p style="margin:0; font-size: 10pt;">${db.organizacion.tarjetaProfesionalDireccion} — NIT: ${db.organizacion.nit}</p>
      </div>
      <div>
        ${doc.contenidoTexto.replace(/\n/g, '<br/>')}
      </div>
      <div class="pie">
        Documento generado a través de JAIRRESTAURA UNO A — Asistente Jurídico Inteligente. Sujeto a revisión y firma del abogado titular.
      </div>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'application/msword');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.titulo.replace(/\s+/g, '_'))}.doc"`);
  res.send(htmlParaWord);
});

// 7. Honorarios y Gestión Administrativa
app.get('/api/honorarios', (req: Request, res: Response) => {
  const db = leerDB();
  res.json({ honorarios: db.honorarios });
});

app.post('/api/honorarios', (req: Request, res: Response) => {
  const db = leerDB();
  const datos = req.body;

  if (!datos.clienteId || !datos.concepto || !datos.valorAcordadoCOP) {
    return res.status(400).json({ error: 'Cliente, concepto y valor acordado son obligatorios' });
  }

  const nuevoHonorario: RegistroHonorario = {
    ...datos,
    id: `hon-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    valorAcordadoCOP: Number(datos.valorAcordadoCOP),
    valorPagadoCOP: 0,
    saldoPendienteCOP: Number(datos.valorAcordadoCOP),
    estado: 'PENDIENTE',
    fechaAcuerdo: datos.fechaAcuerdo || new Date().toISOString().split('T')[0],
    pagosRegistrados: [],
    gastosProcesales: [],
    organizacionId: db.organizacion.id,
  };

  db.honorarios.unshift(nuevoHonorario);
  guardarDB(db);

  registrarAuditoria(
    'usr-jair-01',
    'Dr. Jair',
    'ADMIN_TITULAR',
    'CREATE',
    'HONORARIOS',
    `Registro de acuerdo de honorarios: ${nuevoHonorario.concepto} ($${nuevoHonorario.valorAcordadoCOP.toLocaleString('es-CO')} COP)`,
    nuevoHonorario.id
  );

  res.status(201).json({ honorario: nuevoHonorario });
});

app.post('/api/honorarios/:id/pagos', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = leerDB();
  const honorario = db.honorarios.find((h) => h.id === id);
  if (!honorario) {
    return res.status(404).json({ error: 'Registro de honorarios no encontrado' });
  }

  const { montoCOP, medioPago, numeroComprobante, verificadoPorContabilidad } = req.body;
  if (!montoCOP || Number(montoCOP) <= 0) {
    return res.status(400).json({ error: 'El monto del pago debe ser mayor a cero' });
  }

  const nuevoPago = {
    id: `pag-${Date.now()}`,
    fechaPago: req.body.fechaPago || new Date().toISOString().split('T')[0],
    montoCOP: Number(montoCOP),
    medioPago: medioPago || 'TRANSFERENCIA_BANCARIA',
    numeroComprobante: numeroComprobante || `COMP-${Date.now().toString().slice(-6)}`,
    verificadoPorContabilidad: !!verificadoPorContabilidad,
    registradoPor: req.body.registradoPor || 'Dr. Jair',
  };

  honorario.pagosRegistrados.push(nuevoPago);
  honorario.valorPagadoCOP += nuevoPago.montoCOP;
  honorario.saldoPendienteCOP = Math.max(0, honorario.valorAcordadoCOP - honorario.valorPagadoCOP);
  honorario.estado = honorario.saldoPendienteCOP === 0 ? 'PAGADO_TOTAL' : 'PARCIAL';

  guardarDB(db);

  registrarAuditoria(
    'usr-jair-01',
    'Dr. Jair',
    'ADMIN_TITULAR',
    'UPDATE',
    'HONORARIOS',
    `Abono a honorarios: $${nuevoPago.montoCOP.toLocaleString('es-CO')} COP (${nuevoPago.medioPago}) para cliente ${honorario.clienteNombre}`,
    nuevoPago.id
  );

  res.status(201).json({ honorario, pago: nuevoPago });
});

// 8. Investigación Jurídica Oficial
app.get('/api/investigacion/corpus', (req: Request, res: Response) => {
  res.json({ corpus: CORPUS_JURIDICO_COLOMBIA, portales: PORTALES_OFICIALES_COLOMBIA });
});

app.get('/api/investigacion/search', (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    return res.json({ resultados: CORPUS_JURIDICO_COLOMBIA });
  }

  const query = q.toLowerCase();
  const resultados = CORPUS_JURIDICO_COLOMBIA.filter(
    (item) =>
      item.identificador.toLowerCase().includes(query) ||
      item.epigrafeOTitulo.toLowerCase().includes(query) ||
      item.articulosOFundamentosClave.toLowerCase().includes(query) ||
      item.resumenExtracto.toLowerCase().includes(query) ||
      item.materias.some((m) => m.toLowerCase().includes(query))
  );

  res.json({ resultados });
});

// 9. Asistente Jurídico Inteligente con Gemini AI (@google/genai)
app.post('/api/ai/analyze-facts', async (req: Request, res: Response) => {
  const { hechos, areaJuridica, partes } = req.body;
  if (!hechos) {
    return res.status(400).json({ error: 'La relación de hechos es obligatoria' });
  }

  if (!aiClient) {
    return res.status(503).json({
      error: 'Servicio Gemini AI no configurado. Verifique GEMINI_API_KEY en variables de entorno.',
    });
  }

  try {
    const prompt = `Actúa como un equipo de litigio senior y jurista experto en el ordenamiento jurídico de Colombia.
Analiza con rigor metodológico los siguientes hechos bajo la ley colombiana (CGP, CPACA, Código de Comercio o Código Laboral según aplique):

ÁREA JURÍDICA: ${areaJuridica || 'General'}
PARTES: ${JSON.stringify(partes || {})}
HECHOS PROPORCIONADOS POR EL CLIENTE/ABOGADO:
"""
${hechos}
"""

REGLAS DE EVALUACIÓN:
1. NUNCA inventes artículos, números de sentencias o radicados judiciales.
2. Si la información fáctica es incompleta o ambigua, señala explícitamente qué falta antes de formular una conclusión.
3. Diferencia con precisión científica:
   - Hechos fácticos con vocación probatoria demostrada.
   - Afirmaciones de parte no demostradas.
   - Inferencias jurídicas lógicas.
   - Información o pruebas faltantes indispensables.
4. Identifica problemas jurídicos procesales y sustanciales.
5. Evalúa términos de caducidad de la acción o prescripción de derechos.
6. Plantea una lista de comprobación probatoria (checklist).
7. Agrega la advertencia deontológica de rigor (Ley 1123 de 2007).

Responde en formato estructurado JSON con la siguiente estructura exacta:
{
  "resumenEjecutivo": "string",
  "problemasJuridicos": ["string"],
  "clasificacionHechos": {
    "acreditados": ["string"],
    "afirmacionesSinProbar": ["string"],
    "inferenciasJuridicas": ["string"],
    "datosFaltantes": ["string"]
  },
  "posiblesViasJuridicas": [
    {
      "via": "string",
      "autoridadCompetente": "string",
      "pros": ["string"],
      "contrasYRiesgos": ["string"],
      "caducidadOPrescripcion": "string"
    }
  ],
  "preguntasClaveParaElCliente": ["string"],
  "checklistProbatorio": ["string"],
  "advertenciaDeontologica": "string"
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    const jsonParsed = JSON.parse(rawText);

    registrarAuditoria(
      'usr-jair-01',
      'Dr. Jair',
      'ADMIN_TITULAR',
      'AI_QUERY',
      'ASISTENTE_IA',
      `Análisis de hechos asistido por IA para área ${areaJuridica || 'General'}`
    );

    res.json({ analisis: jsonParsed });
  } catch (error: any) {
    console.error('Error al invocar Gemini API:', error);
    res.status(500).json({ error: error.message || 'Error procesando análisis con IA' });
  }
});

// Espacio de Trabajo Jurídico Conversacional
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  const { mensaje, historial, contextoExpediente } = req.body;
  if (!mensaje) {
    return res.status(400).json({ error: 'El mensaje es obligatorio' });
  }

  if (!aiClient) {
    return res.status(503).json({
      error: 'Servicio Gemini AI no configurado. Verifique GEMINI_API_KEY en variables de entorno.',
    });
  }

  try {
    const systemInstruction = `Eres JAIRRESTAURA UNO A, el asistente jurídico digital enterprise especializado en el ordenamiento jurídico de Colombia.
Tu labor es asistir a abogados, litigantes y consultorios jurídicos con el más alto rigor doctrinal y procesal.
Directrices estrictas:
- NUNCA inventes sentencias, radicados ni citas normativas. Prioriza normas orgánicas y principios constitucionales vigentes.
- Si una afirmación no cuenta con sustento normativo verificado en Colombia, decláralo expresamente como "Criterio sujeto a comprobación en relatoría".
- Recuerda siempre que tus respuestas son insumos preparatorios de trabajo que deben ser refrendados por el abogado titular y no constituyen concepto definitivo vinculante ni garantizan resultado judicial (Ley 1123 de 2007).
- Utiliza terminología procesal colombiana precisa (demandante, accionante, traslado, recurso de reposición en subsidio apelación, auto interlocutorio, audiencia Art. 372/373 CGP, excepción previa, juramento estimatorio).
- Contexto de expediente si está activo: ${JSON.stringify(contextoExpediente || 'Sin expediente seleccionado')}.`;

    const contents = [
      ...(historial || []).map((h: any) => ({
        role: h.rol === 'usuario' ? 'user' : 'model',
        parts: [{ text: h.texto }],
      })),
      {
        role: 'user',
        parts: [{ text: mensaje }],
      },
    ];

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
      },
    });

    const respuestaTexto = response.text || '';

    registrarAuditoria(
      'usr-jair-01',
      'Dr. Jair',
      'ADMIN_TITULAR',
      'AI_QUERY',
      'ASISTENTE_IA',
      `Consulta interactiva con asistente jurídico IA: "${mensaje.substring(0, 50)}..."`
    );

    res.json({ respuesta: respuestaTexto });
  } catch (error: any) {
    console.error('Error en chat Gemini:', error);
    res.status(500).json({ error: error.message || 'Error en comunicación con asistente jurídico' });
  }
});

// Redacción Documental con IA
app.post('/api/ai/draft', async (req: Request, res: Response) => {
  const { tipoDocumento, parametros, instruccionesEspecificas } = req.body;
  if (!tipoDocumento) {
    return res.status(400).json({ error: 'El tipo de documento es obligatorio' });
  }

  if (!aiClient) {
    return res.status(503).json({
      error: 'Servicio Gemini AI no disponible.',
    });
  }

  try {
    const prompt = `Genera un borrador procesal formal de alta calidad para Colombia de: ${tipoDocumento}.
PARÁMETROS SUMINISTRADOS:
${JSON.stringify(parametros, null, 2)}

INSTRUCCIONES ESPECÍFICAS:
${instruccionesEspecificas || 'Redactar con estricta observancia del código procesal respectivo, numeración clara de hechos y pretensiones, invocación de la Ley 2213 de 2022 y advertencias de requisitos.'}

REGLAS:
- No inventes datos del cliente; deja campos [ENTRE CORCHETES] donde falte información.
- Redacta encabezado, consideraciones, hechos, pretensiones o peticiones, fundamentos de derecho y acápite de notificaciones judiciales.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const borradorGenerado = response.text || '';

    res.json({ borrador: borradorGenerado });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error generando borrador documental' });
  }
});

// Análisis Documental (Contratos, Piezas procesales, Demandas)
app.post('/api/ai/analyze-document', async (req: Request, res: Response) => {
  const { textoDocumento, nombreArchivo } = req.body;
  if (!textoDocumento || textoDocumento.length < 20) {
    return res.status(400).json({ error: 'El texto del documento a analizar es insuficiente o vacío' });
  }

  if (!aiClient) {
    return res.status(503).json({ error: 'Servicio Gemini AI no configurado' });
  }

  try {
    const prompt = `Analiza con rigor jurídico colombiano el siguiente documento contractual o procesal:
NOMBRE DEL ARCHIVO: ${nombreArchivo || 'documento_legal'}
TEXTO A EXAMINAR:
"""
${textoDocumento.slice(0, 30000)}
"""

Efectúa:
1. Resumen ejecutivo.
2. Identificación de partes intervinientes y sus calidades jurídicas.
3. Fechas críticas y términos perentorios identificados.
4. Obligaciones principales asumidas por cada parte.
5. Cláusulas de alto riesgo, leoninas o ambiguas.
6. Posibles contradicciones internas o vacíos jurídicos evidentes.
7. Tabla de citas referenciales vinculando extractos literales del documento.

Responde en formato JSON con la siguiente estructura:
{
  "resumenEjecutivo": "string",
  "partesIdentificadas": [{"nombre": "string", "rolOParte": "string", "identificacion": "string"}],
  "fechasYTerminos": [{"fechaOTermino": "string", "descripcion": "string", "relevancia": "ALTA"|"MEDIA"|"BAJA"}],
  "obligacionesPrincipales": [{"obligado": "string", "obligacion": "string", "condicion": "string"}],
  "clausulasRiesgo": [{"clausula": "string", "motivoRiesgo": "string", "recomendacion": "string"}],
  "contradiccionesOVacios": ["string"],
  "tablaCitas": [{"referencia": "string", "textoLiteral": "string", "comentarioJuridico": "string"}],
  "advertenciaRevision": "string"
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ analisis: parsed });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error en análisis documental' });
  }
});

// 10. Auditoría y Seguridad
app.get('/api/audit-log', (req: Request, res: Response) => {
  const db = leerDB();
  res.json({ auditoria: db.auditoria.slice(0, 100) });
});

// Exportación de Copia de Seguridad Completa (Habeas Data y Respaldo)
app.get('/api/system/backup', (req: Request, res: Response) => {
  const db = leerDB();
  registrarAuditoria(
    'usr-jair-01',
    'Dr. Jair',
    'ADMIN_TITULAR',
    'EXPORT',
    'SEGURIDAD',
    'Exportación completa de respaldo institucional de datos (Ley 1581 de 2012)'
  );

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="jairrestaura_backup_${new Date().toISOString().split('T')[0]}.json"`);
  res.send(JSON.stringify(db, null, 2));
});

// Reinicio a valores de fábrica / datos demo
app.post('/api/system/restore-default', (req: Request, res: Response) => {
  const nuevo = crearDatosSemilla();
  guardarDB(nuevo);
  registrarAuditoria('usr-jair-01', 'Dr. Jair', 'ADMIN_TITULAR', 'RESTORE', 'SEGURIDAD', 'Restablecimiento de base de datos a estado predeterminado.');
  res.json({ success: true, message: 'Base de datos restaurada correctamente' });
});

// ==========================================
// Integración con Vite para Frontend SPA
// ==========================================
async function iniciarServidor() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Servir estáticos en producción
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[JAIRRESTAURA UNO A] Servidor iniciado con éxito en http://0.0.0.0:${PORT}`);
  });
}

iniciarServidor().catch((err) => {
  console.error('Error fatal al iniciar servidor:', err);
});
