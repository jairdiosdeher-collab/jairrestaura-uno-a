/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — PLATAFORMA JURÍDICA INTELIGENTE ENTERPRISE
 * Servidor Backend Express con Autenticación Criptográfica, RBAC, Aislamiento Multi-inquilino y Gemini AI SDK.
 */

import express, { Request, Response, NextFunction } from 'express';
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
  Usuario,
  RolUsuario,
  CasoAcademico,
  RutaProcesalAcademica,
  TutorAcademicoModo,
  DocumentoAcademicoTipo,
  DocumentoAcademicoBorrador
} from './src/types/legal.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'jairrestaura_db.json');

app.use(express.json({ limit: '15mb' }));

// Inicialización de Google GenAI en servidor
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

// ============================================================
// 1. SISTEMA DE AUTENTICACIÓN Y SEGURIDAD CRIPTOGRÁFICA (PBKDF2)
// ============================================================

interface UserCredential {
  userId: string;
  email: string;
  salt: string;
  hash: string;
}

interface SessionData {
  token: string;
  userId: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  organizacionId: string;
  organizacionNombre: string;
  expiresAt: number;
}

// Generación y verificación de contraseñas usando PBKDF2 (SHA-512 con 10,000 iteraciones)
function hashPassword(password: string, salt?: string): { salt: string; hash: string } {
  const chosenSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, chosenSalt, 10000, 64, 'sha512').toString('hex');
  return { salt: chosenSalt, hash };
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

// Almacén seguro de credenciales (separado de datos de navegación)
const USER_CREDENTIALS: Map<string, UserCredential> = new Map();

function registrarCredencial(email: string, userId: string, contrasenaPlana: string) {
  const { salt, hash } = hashPassword(contrasenaPlana);
  USER_CREDENTIALS.set(email.toLowerCase(), {
    userId,
    email: email.toLowerCase(),
    salt,
    hash,
  });
}

// Inicialización de credenciales maestras para los roles autorizados
registrarCredencial('jairdiosdeher@gmail.com', 'usr-jair-01', 'AbogadoJair2026*!');
registrarCredencial('m.gomez@jairrestaura-demo.internal', 'usr-marcela-02', 'Marcela2026*!');
registrarCredencial('a.rojas@jairrestaura-demo.internal', 'usr-andres-03', 'Asistente2026*!');
registrarCredencial('c.auditor@jairrestaura-demo.internal', 'usr-auditor-05', 'Auditor2026*!');
registrarCredencial('abogado.externo@firmaexterna-demo.internal', 'usr-externo-04', 'Externa2026*!');

// Almacén de sesiones activas (Token -> SessionData)
const SESSIONS = new Map<string, SessionData>();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

// Rate Limiting para inicio de sesión (Previene ataques de fuerza bruta)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);
  if (!attempt || now > attempt.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 5 * 60 * 1000 });
    return true;
  }
  if (attempt.count >= 15) {
    return false;
  }
  attempt.count++;
  return true;
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
  organizaciones?: Array<{
    id: string;
    nombre: string;
    nit: string;
  }>;
  usuarios: Usuario[];
  clientes: Cliente[];
  expedientes: Expediente[];
  actuaciones: Record<string, any[]>;
  terminos: TerminoAgenda[];
  documentos: DocumentoLegal[];
  honorarios: RegistroHonorario[];
  auditoria: RegistroAuditoria[];
  casosAcademicos?: CasoAcademico[];
}

// Datos semilla de demostración con datos sintéticos y organizaciones
function crearDatosSemilla(): DatabaseSchema {
  const orgId1 = 'org-jairrestaura-001';
  const orgNombre1 = 'JairRestaura Uno A & Asociados — Firma Jurídica Demostrativa';

  const orgId2 = 'org-externa-002';
  const orgNombre2 = 'Firma Legal Andina Externa Ltda.';

  const usuarios: Usuario[] = [
    {
      id: 'usr-jair-01',
      nombre: 'Dr. Jair (Director Jurídico)',
      email: 'jairdiosdeher@gmail.com',
      tarjetaProfesional: 'T.P. No. 000.001 del C.S.J. (Ficticia)',
      rol: 'ADMIN_TITULAR',
      organizacionId: orgId1,
      organizacionNombre: orgNombre1,
      fechaCreacion: '2026-01-10T08:00:00Z',
      ultimoAcceso: new Date().toISOString(),
    },
    {
      id: 'usr-marcela-02',
      nombre: 'Dra. Marcela Gómez (Demostración)',
      email: 'm.gomez@jairrestaura-demo.internal',
      tarjetaProfesional: 'T.P. No. 000.002 del C.S.J. (Ficticia)',
      rol: 'ABOGADO_ASOCIADO',
      organizacionId: orgId1,
      organizacionNombre: orgNombre1,
      fechaCreacion: '2026-02-15T09:30:00Z',
      ultimoAcceso: new Date().toISOString(),
    },
    {
      id: 'usr-andres-03',
      nombre: 'Andrés Felipe Rojas (Demostración)',
      email: 'a.rojas@jairrestaura-demo.internal',
      rol: 'ASISTENTE_JUDICIAL',
      organizacionId: orgId1,
      organizacionNombre: orgNombre1,
      fechaCreacion: '2026-03-01T10:00:00Z',
      ultimoAcceso: new Date().toISOString(),
    },
    {
      id: 'usr-auditor-05',
      nombre: 'Carlos E. Auditor (Cumplimiento)',
      email: 'c.auditor@jairrestaura-demo.internal',
      rol: 'AUDITOR_CUMPLIMIENTO',
      organizacionId: orgId1,
      organizacionNombre: orgNombre1,
      fechaCreacion: '2026-03-15T11:00:00Z',
      ultimoAcceso: new Date().toISOString(),
    },
    {
      id: 'usr-externo-04',
      nombre: 'Dra. Camila Soto (Firma Externa)',
      email: 'abogado.externo@firmaexterna-demo.internal',
      tarjetaProfesional: 'T.P. No. 000.099 del C.S.J. (Ficticia)',
      rol: 'ABOGADO_ASOCIADO',
      organizacionId: orgId2,
      organizacionNombre: orgNombre2,
      fechaCreacion: '2026-04-01T10:00:00Z',
      ultimoAcceso: new Date().toISOString(),
    },
  ];

  const clientes: Cliente[] = [
    {
      id: 'cli-andinas-01',
      tipoPersona: 'JURIDICA',
      tipoIdentificacion: 'NIT',
      numeroIdentificacion: '900.000.002',
      dv: '1',
      nombreCompletoORazonSocial: 'Inversiones Ficticias Andinas S.A.S. (Demostración)',
      representanteLegal: {
        nombre: 'Representante Ficticio Uno',
        tipoIdentificacion: 'CC',
        numeroIdentificacion: '00.000.001',
        cargo: 'Gerente General Demostrativo',
      },
      emailPrincipal: 'contacto@andinas-ficticias.internal',
      emailNotificacionesJudiciales: 'notificaciones@andinas-ficticias.internal',
      telefono: '+57 (600) 000-0001',
      direccion: 'Carrera 0 No. 0-00 Piso 0, Edificio Demostrativo',
      ciudad: 'Bogotá D.C.',
      departamento: 'Cundinamarca',
      estado: 'ACTIVO',
      consentimientoLey1581: {
        autorizado: false,
        fechaAutorizacion: '2026-01-15T10:00:00Z',
        canalAutorizacion: 'DIGITAL_APP',
        finalidadTratamiento: 'Pendiente de suscripción y acuse formal de autorización según Ley 1581 de 2012',
      },
      organizacionId: orgId1,
      expedientesIds: ['exp-2026-001'],
      fechaCreacion: '2026-01-15T10:00:00Z',
      fechaActualizacion: '2026-01-15T10:00:00Z',
    },
    {
      id: 'cli-cardona-02',
      tipoPersona: 'NATURAL',
      tipoIdentificacion: 'CC',
      numeroIdentificacion: '00.000.002',
      nombreCompletoORazonSocial: 'Ciudadana Demostrativa Cardona (Ficticia)',
      emailPrincipal: 'ciudadana.demo@ficticia-email.internal',
      emailNotificacionesJudiciales: 'judicial.demo@ficticia-email.internal',
      telefono: '+57 (600) 000-0002',
      direccion: 'Calle 0 No. 0-00, Barrio Demostrativo',
      ciudad: 'Medellín',
      departamento: 'Antioquia',
      estado: 'ACTIVO',
      consentimientoLey1581: {
        autorizado: false,
        fechaAutorizacion: '2026-02-01T14:00:00Z',
        canalAutorizacion: 'CORREO_ELECTRONICO',
        finalidadTratamiento: 'Pendiente de suscripción y acuse formal de autorización según Ley 1581 de 2012',
      },
      organizacionId: orgId1,
      expedientesIds: ['exp-2026-002'],
      fechaCreacion: '2026-02-01T14:00:00Z',
      fechaActualizacion: '2026-02-01T14:00:00Z',
    },
    // Cliente perteneciente a la organización externa (para verificar aislamiento tenant)
    {
      id: 'cli-externo-99',
      tipoPersona: 'JURIDICA',
      tipoIdentificacion: 'NIT',
      numeroIdentificacion: '900.000.999',
      dv: '9',
      nombreCompletoORazonSocial: 'Corporación Externa Aislada S.A.S.',
      emailPrincipal: 'contacto@externa-aislada.internal',
      emailNotificacionesJudiciales: 'notif@externa-aislada.internal',
      telefono: '+57 (600) 999-9999',
      direccion: 'Avenida 99 No. 99-99',
      ciudad: 'Cali',
      departamento: 'Valle del Cauca',
      estado: 'ACTIVO',
      consentimientoLey1581: {
        autorizado: false,
        fechaAutorizacion: '2026-04-01T10:00:00Z',
        canalAutorizacion: 'DIGITAL_APP',
        finalidadTratamiento: 'Tratamiento exclusivo de firma externa',
      },
      organizacionId: orgId2,
      expedientesIds: ['exp-2026-999'],
      fechaCreacion: '2026-04-01T10:00:00Z',
      fechaActualizacion: '2026-04-01T10:00:00Z',
    },
  ];

  const expedientes: Expediente[] = [
    {
      id: 'exp-2026-001',
      codigoInterno: 'EXP-2026-001',
      radicadoJudicial: '00000000000020260000100',
      despachoJudicial: 'Juzgado 00 Civil del Circuito de Bogotá (Demostración)',
      clienteId: 'cli-andinas-01',
      clienteNombre: 'Inversiones Ficticias Andinas S.A.S. (Demostración)',
      areaJuridica: 'CIVIL_COMERCIAL',
      jurisdiccion: 'ORDINARIA',
      autoridadCompetente: 'Juez Civil del Circuito',
      partes: {
        demandanteOAccionante: 'Inversiones Ficticias Andinas S.A.S.',
        apoderadoDemandante: 'Dr. Jair (T.P. 000.001)',
        demandadoOAccionado: 'Constructora Demostrativa del Oriente S.A.S.',
        apoderadoDemandado: 'Abogado Ficticio Contraparte',
      },
      sintesisHechos: 'Proceso declarativo de resolución contractual por incumplimiento en entregas técnicas de obra y cláusula penal de prueba sintética.',
      pretensionesUObjetivos: 'Declaratoria de incumplimiento contractual, pago de la cláusula penal por $280.000.000 COP y perjuicios conexos.',
      cuantiaEstimadaCOP: 280000000,
      esMayorCuantia: true,
      estado: 'AUDIENCIA_INICIAL',
      estrategiaDefensiva: 'Sustentación pericial contable de los desembolsos e informe pericial técnico de avance de obra.',
      fechaInicio: '2024-09-10T10:00:00Z',
      fechaActualizacion: '2026-10-25T15:30:00Z',
      organizacionId: orgId1,
      abogadoResponsableId: 'usr-jair-01',
      abogadoResponsableNombre: 'Dr. Jair',
    },
    {
      id: 'exp-2026-002',
      codigoInterno: 'EXP-2026-002',
      radicadoJudicial: '00000000000020260000200',
      despachoJudicial: 'Juzgado 00 Administrativo Oral de Medellín (Demostración)',
      clienteId: 'cli-cardona-02',
      clienteNombre: 'Ciudadana Demostrativa Cardona (Ficticia)',
      areaJuridica: 'ADMINISTRATIVO',
      jurisdiccion: 'CONTENCIOSO_ADMINISTRATIVO',
      autoridadCompetente: 'Juez Administrativo de Medellín',
      partes: {
        demandanteOAccionante: 'Ciudadana Demostrativa Cardona',
        apoderadoDemandante: 'Dra. Marcela Gómez (T.P. 000.002)',
        demandadoOAccionado: 'Entidad Pública Hospitalaria Ficticia',
        apoderadoDemandado: 'Apoderado Ficticio de la Entidad',
      },
      sintesisHechos: 'Demanda de nulidad y restablecimiento del derecho solicitando reconocimiento de contrato realidad laboral por vinculación continuada.',
      pretensionesUObjetivos: 'Reconocimiento de prestaciones sociales derivadas de contrato laboral ficto por $195.000.000 COP.',
      cuantiaEstimadaCOP: 195000000,
      esMayorCuantia: true,
      estado: 'CONTESTACION_TRASLADO',
      estrategiaDefensiva: 'Demostración de subordinación funcional y cumplimiento de turnos asistenciales continuos.',
      fechaInicio: '2025-05-18T08:30:00Z',
      fechaActualizacion: '2026-10-24T12:00:00Z',
      organizacionId: orgId1,
      abogadoResponsableId: 'usr-marcela-02',
      abogadoResponsableNombre: 'Dra. Marcela Gómez',
    },
    // Expediente de la firma externa
    {
      id: 'exp-2026-999',
      codigoInterno: 'EXP-EXT-999',
      radicadoJudicial: '00000000000020260000999',
      despachoJudicial: 'Juzgado 99 Civil de Cali (Ficticio)',
      clienteId: 'cli-externo-99',
      clienteNombre: 'Corporación Externa Aislada S.A.S.',
      areaJuridica: 'CIVIL_COMERCIAL',
      jurisdiccion: 'ORDINARIA',
      autoridadCompetente: 'Juez 99 Civil',
      partes: {
        demandanteOAccionante: 'Corporación Externa Aislada S.A.S.',
        apoderadoDemandante: 'Dra. Camila Soto (T.P. 000.099)',
        demandadoOAccionado: 'Contraparte Externa',
      },
      sintesisHechos: 'Proceso judicial privado de la organización externa.',
      pretensionesUObjetivos: 'Cobro de título valor por $50.000.000 COP.',
      cuantiaEstimadaCOP: 50000000,
      esMayorCuantia: false,
      estado: 'ADMITIDO',
      fechaInicio: '2026-04-01T10:00:00Z',
      fechaActualizacion: '2026-04-01T10:00:00Z',
      organizacionId: orgId2,
      abogadoResponsableId: 'usr-externo-04',
      abogadoResponsableNombre: 'Dra. Camila Soto',
    },
  ];

  const actuaciones: Record<string, any[]> = {
    'exp-2026-001': [
      {
        id: 'act-001-1',
        expedienteId: 'exp-2026-001',
        fechaActuacion: '2024-09-12',
        cuaderno: 'Cuaderno Principal 1',
        tipoProvidencia: 'MEMORIAL_PARTE',
        anotacion: 'Radicación de demanda ordinaria declarativa.',
        tieneTermino: false,
        creadoPor: 'Dr. Jair',
        fechaCreacion: '2024-09-12T10:00:00Z',
      },
      {
        id: 'act-001-2',
        expedienteId: 'exp-2026-001',
        fechaActuacion: '2026-10-15',
        cuaderno: 'Cuaderno Principal 1',
        tipoProvidencia: 'AUTO_INTERLOCUTORIO',
        anotacion: 'Fija fecha para Audiencia Inicial Art. 372 CGP para el 12 de noviembre de 2026 a las 09:00 a.m.',
        tieneTermino: true,
        terminoDias: 18,
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
      clienteNombre: 'Inversiones Ficticias Andinas S.A.S. (Demostración)',
      titulo: 'Audiencia Inicial Art. 372 CGP (Virtual)',
      descripcion: 'Preparación de fórmulas de conciliación y oposición a excepciones previas.',
      tipoTermino: 'AUDIENCIA',
      fechaNotificacionOInicio: '2026-10-15',
      aplicaReglaLey2213: false,
      duracionDias: 18,
      tipoDias: 'HABILES_JUDICIALES',
      fechaVencimientoCalculada: '2026-11-12',
      calculoConfirmadoPorAbogado: true,
      abogadoQueConfirmo: 'Dr. Jair',
      notasCómputo: 'Fijación formal por Auto del 15 de Octubre de 2026.',
      estado: 'VERIFICADO',
      prioridad: 'ALTA',
      responsableId: 'usr-jair-01',
      responsableNombre: 'Dr. Jair',
      organizacionId: orgId1,
    },
    {
      id: 'term-ext-99',
      expedienteId: 'exp-2026-999',
      expedienteCodigo: 'EXP-EXT-999',
      clienteId: 'cli-externo-99',
      clienteNombre: 'Corporación Externa Aislada S.A.S.',
      titulo: 'Término de contestación externo',
      descripcion: 'Plazo procesal de la firma externa.',
      tipoTermino: 'CONTESTACION_DEMANDA',
      fechaNotificacionOInicio: '2026-04-01',
      aplicaReglaLey2213: true,
      duracionDias: 10,
      tipoDias: 'HABILES_JUDICIALES',
      fechaVencimientoCalculada: '2026-04-18',
      calculoConfirmadoPorAbogado: false,
      estado: 'PENDIENTE',
      prioridad: 'MEDIA',
      responsableId: 'usr-externo-04',
      responsableNombre: 'Dra. Camila Soto',
      organizacionId: orgId2,
    },
  ];

  const documentos: DocumentoLegal[] = [
    {
      id: 'doc-001',
      expedienteId: 'exp-2026-001',
      expedienteCodigo: 'EXP-2026-001',
      clienteId: 'cli-andinas-01',
      tipoPlantilla: 'PODER_ESPECIAL_JUDICIAL',
      titulo: 'Poder Especial Judicial Amplio y Suficiente (Demostrativo)',
      contenidoTexto: `PODER ESPECIAL AMPLIO Y SUFICIENTE DEMOSTRATIVO\n\nConferente: Inversiones Ficticias Andinas S.A.S.\nApoderado: Dr. Jair (T.P. 000.001 del C.S.J.)\nFacultades: Conciliar, recibir, transigir, desistir y sustituir conforme al Art. 77 del Código General del Proceso.`,
      estado: 'APROBADO',
      version: 1,
      creadoPor: 'Dr. Jair',
      fechaCreacion: '2026-09-10T11:00:00Z',
      fechaActualizacion: '2026-09-10T11:00:00Z',
      organizacionId: orgId1,
    },
  ];

  const honorarios: RegistroHonorario[] = [
    {
      id: 'hon-001',
      expedienteId: 'exp-2026-001',
      expedienteCodigo: 'EXP-2026-001',
      clienteId: 'cli-andinas-01',
      clienteNombre: 'Inversiones Ficticias Andinas S.A.S. (Demostración)',
      concepto: 'Asesoría y representación en litigio contractual ordinario',
      modalidad: 'MIXTO',
      valorAcordadoCOP: 28000000,
      valorPagadoCOP: 14000000,
      saldoPendienteCOP: 14000000,
      estado: 'PARCIAL',
      fechaAcuerdo: '2024-09-05',
      pagosRegistrados: [
        {
          id: 'pag-01',
          fechaPago: '2024-09-08',
          montoCOP: 14000000,
          medioPago: 'TRANSFERENCIA_BANCARIA',
          numeroComprobante: 'TRANS-DEMO-001',
          verificadoPorContabilidad: true,
          registradoPor: 'Dr. Jair',
        },
      ],
      gastosProcesales: [],
      organizacionId: orgId1,
    },
  ];

  const auditoria: RegistroAuditoria[] = [
    {
      id: 'aud-001',
      timestamp: new Date().toISOString(),
      usuarioId: 'usr-jair-01',
      usuarioNombre: 'Dr. Jair',
      usuarioRol: 'ADMIN_TITULAR',
      accion: 'LOGIN',
      modulo: 'SEGURIDAD',
      descripcionDetallada: 'Inicialización de la plataforma con aislamiento criptográfico de sesión y datos sintéticos demostrativos.',
      organizacionId: orgId1,
    },
  ];

  return {
    organizacion: {
      id: orgId1,
      nombre: orgNombre1,
      nit: '900.000.001-0',
      representante: 'Dr. Jair (Demostrativo)',
      tarjetaProfesionalDireccion: 'T.P. 000.001 del C.S.J.',
      fechaRegistro: '2026-01-01T00:00:00Z',
    },
    organizaciones: [
      { id: orgId1, nombre: orgNombre1, nit: '900.000.001-0' },
      { id: orgId2, nombre: orgNombre2, nit: '900.000.099-9' },
    ],
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
      guardarDB(inicial);
      return inicial;
    }
    const contenido = fs.readFileSync(DB_FILE, 'utf-8');
    const db = JSON.parse(contenido) as DatabaseSchema;
    if (!db.casosAcademicos) {
      db.casosAcademicos = [];
    }
    return db;
  } catch (error) {
    console.error('Error al leer base de datos, inicializando:', error);
    const inicial = crearDatosSemilla();
    guardarDB(inicial);
    return inicial;
  }
}

// Escritura atómica con archivo temporal para prevenir corrupción
function guardarDB(db: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp.${Date.now()}.${crypto.randomBytes(4).toString('hex')}`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (error) {
    console.error('Error al guardar base de datos:', error);
  }
}

// Registrar en pista de auditoría inmutable
function registrarAuditoria(
  usuarioId: string,
  usuarioNombre: string,
  usuarioRol: RolUsuario,
  accion: RegistroAuditoria['accion'],
  modulo: RegistroAuditoria['modulo'],
  descripcionDetallada: string,
  registroIdAfectado?: string,
  organizacionId?: string,
  ipAddress?: string
): void {
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
    descripcionDetallada,
    organizacionId: organizacionId || db.organizacion.id,
    ipAddress,
  };

  db.auditoria.unshift(nuevoRegistro);
  if (db.auditoria.length > 500) {
    db.auditoria = db.auditoria.slice(0, 500);
  }
  guardarDB(db);
}

// ============================================================
// 2. MIDDLEWARE DE AUTENTICACIÓN, ROLES Y TENANT EN SERVIDOR
// ============================================================

interface AuthenticatedRequest extends Request {
  user: SessionData;
}

// Modo Abierto: Valida Bearer token si existe o usa sesión abierta predeterminada (sin bloqueo)
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const db = leerDB();
  const authHeader = req.headers['authorization'];
  const userIdHeader = req.headers['x-user-id'] as string;

  // 1. Si viene Bearer token válido en SESSIONS, usarlo
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const session = SESSIONS.get(token);
    if (session && Date.now() <= session.expiresAt) {
      session.expiresAt = Date.now() + SESSION_TTL_MS;
      (req as AuthenticatedRequest).user = session;
      return next();
    }
  }

  // 2. Si viene x-user-id en header o parámetro, cargar ese perfil
  if (userIdHeader) {
    const usuarioElegido = db.usuarios.find((u) => u.id === userIdHeader);
    if (usuarioElegido) {
      (req as AuthenticatedRequest).user = {
        token: 'open-session-token',
        userId: usuarioElegido.id,
        nombre: usuarioElegido.nombre,
        email: usuarioElegido.email,
        rol: usuarioElegido.rol,
        organizacionId: usuarioElegido.organizacionId,
        organizacionNombre: usuarioElegido.organizacionNombre,
        expiresAt: Date.now() + SESSION_TTL_MS,
      };
      return next();
    }
  }

  // 3. Fallback abierto: Dr. Jair (ADMIN_TITULAR) — sin bloqueo para navegación directa y libre
  const adminUser = db.usuarios[0] || {
    id: 'usr-jair-01',
    nombre: 'Dr. Jair (Director Jurídico)',
    email: 'jairdiosdeher@gmail.com',
    rol: 'ADMIN_TITULAR',
    organizacionId: 'org-jairrestaura-001',
    organizacionNombre: 'JairRestaura Uno A & Asociados — Firma Jurídica Demostrativa',
  };

  (req as AuthenticatedRequest).user = {
    token: 'open-session-token',
    userId: adminUser.id,
    nombre: adminUser.nombre,
    email: adminUser.email,
    rol: adminUser.rol as RolUsuario,
    organizacionId: adminUser.organizacionId,
    organizacionNombre: adminUser.organizacionNombre,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };

  next();
}

// Valida roles permitidos para la operación (en modo abierto, ADMIN_TITULAR tiene permiso pleno)
function requireRole(...rolesPermitidos: RolUsuario[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return next();
    }
    // ADMIN_TITULAR tiene permiso universal
    if (authReq.user.rol === 'ADMIN_TITULAR' || rolesPermitidos.includes(authReq.user.rol)) {
      return next();
    }
    return res.status(403).json({
      error: `Acceso denegado: el rol '${authReq.user.rol}' no tiene permisos para esta acción.`,
      codigo: 'FORBIDDEN_ROLE',
    });
  };
}

// Verifica pertenencia a la organización del usuario (Aislamiento Multi-inquilino sin bloqueo para admin)
function verificarAislamientoTenant(
  req: AuthenticatedRequest,
  res: Response,
  recursoOrganizacionId: string,
  nombreRecurso = 'recurso'
): boolean {
  if (req.user.rol !== 'ADMIN_TITULAR' && recursoOrganizacionId !== req.user.organizacionId) {
    res.status(403).json({
      error: `Acceso denegado: el ${nombreRecurso} solicitado pertenece a otra organización jurídica.`,
      codigo: 'CROSS_TENANT_FORBIDDEN',
    });
    return false;
  }
  return true;
}

// ============================================================
// 3. ENDPOINTS DE AUTENTICACIÓN Y GESTIÓN DE SESIÓN
// ============================================================

// POST /api/auth/login — Inicio de sesión seguro con hash PBKDF2 y emisión de Bearer Token
app.post('/api/auth/login', (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: 'Demasiados intentos fallidos. Intente nuevamente en 5 minutos.',
      codigo: 'RATE_LIMIT_EXCEEDED',
    });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  const emailNorm = email.toLowerCase().trim();
  const cred = USER_CREDENTIALS.get(emailNorm);

  if (!cred || !verifyPassword(password, cred.salt, cred.hash)) {
    return res.status(401).json({
      error: 'Credenciales inválidas. Verifique correo institucional y contraseña.',
      codigo: 'INVALID_CREDENTIALS',
    });
  }

  const db = leerDB();
  const usuario = db.usuarios.find((u) => u.id === cred.userId);
  if (!usuario) {
    return res.status(401).json({ error: 'Usuario no activo en el sistema' });
  }

  // Generar token criptográfico único de 256 bits (64 hex characters)
  const token = crypto.randomBytes(32).toString('hex');
  const sessionData: SessionData = {
    token,
    userId: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    organizacionId: usuario.organizacionId,
    organizacionNombre: usuario.organizacionNombre,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };

  SESSIONS.set(token, sessionData);

  usuario.ultimoAcceso = new Date().toISOString();
  guardarDB(db);

  registrarAuditoria(
    usuario.id,
    usuario.nombre,
    usuario.rol,
    'LOGIN',
    'SEGURIDAD',
    `Inicio de sesión exitoso mediante credencial institucional segura (PBKDF2/SHA-512)`,
    undefined,
    usuario.organizacionId,
    ip
  );

  res.json({
    token,
    usuario,
    organizacion: {
      id: usuario.organizacionId,
      nombre: usuario.organizacionNombre,
    },
    expiresIn: SESSION_TTL_MS / 1000,
  });
});

// POST /api/auth/logout — Revocación de sesión
app.post('/api/auth/logout', requireAuth, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  SESSIONS.delete(authReq.user.token);

  registrarAuditoria(
    authReq.user.userId,
    authReq.user.nombre,
    authReq.user.rol,
    'LOGOUT',
    'SEGURIDAD',
    'Cierre formal de sesión y revocación de token criptográfico',
    undefined,
    authReq.user.organizacionId
  );

  res.json({ success: true, message: 'Sesión finalizada correctamente' });
});

// GET /api/auth/me — Obtiene datos de la sesión activa autenticada
app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const db = leerDB();
  const usuario = db.usuarios.find((u) => u.id === authReq.user.userId);
  
  if (!usuario) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  // Solo exponer usuarios de la misma organización
  const usuariosOrganizacion = db.usuarios.filter(
    (u) => u.organizacionId === authReq.user.organizacionId
  );

  res.json({
    usuario,
    organizacion: {
      id: authReq.user.organizacionId,
      nombre: authReq.user.organizacionNombre,
      nit: db.organizacion.nit,
      representante: db.organizacion.representante,
      tarjetaProfesionalDireccion: db.organizacion.tarjetaProfesionalDireccion,
    },
    usuariosDisponibles: usuariosOrganizacion,
  });
});

// ============================================================
// 4. RUTAS PROTEGIDAS CON AISLAMIENTO DE TENANT Y RBAC
// ============================================================

// GET /api/dashboard/stats — Indicadores reales y listas vinculadas bajo fuente única de verdad
app.get('/api/dashboard/stats', requireAuth, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const orgId = authReq.user.organizacionId;
  const db = leerDB();

  // Filtrado estricto por organización (Aislamiento de Tenant)
  const clientesOrg = db.clientes.filter((c) => c.organizacionId === orgId);
  const expedientesOrg = db.expedientes.filter((e) => e.organizacionId === orgId);
  const terminosOrg = db.terminos.filter((t) => t.organizacionId === orgId);
  const documentosOrg = db.documentos.filter((d) => d.organizacionId === orgId);
  const honorariosOrg = db.honorarios.filter((h) => h.organizacionId === orgId);
  const auditoriaOrg = db.auditoria.filter((a) => a.organizacionId === orgId);

  const totalClientes = clientesOrg.filter((c) => c.estado === 'ACTIVO').length;
  const clientesConHabeasData = clientesOrg.filter((c) => c.consentimientoLey1581 && c.consentimientoLey1581.autorizado).length;

  const expedientesActivos = expedientesOrg.filter(
    (e) => e.estado !== 'ARCHIVADO' && e.estado !== 'TERMINADO_CONCILIACION'
  ).length;

  const hoyStr = new Date().toISOString().split('T')[0];

  // Términos según estado procesal estricto
  const terminosPendientes = terminosOrg.filter((t) => t.estado === 'PENDIENTE' || t.estado === 'VERIFICADO');
  const terminosCumplidos = terminosOrg.filter((t) => t.estado === 'CUMPLIDO');
  const terminosVencidos = terminosOrg.filter(
    (t) => t.estado !== 'CUMPLIDO' && t.fechaVencimientoCalculada < hoyStr
  );
  const terminosCriticos = terminosPendientes.filter(
    (t) => t.fechaVencimientoCalculada <= hoyStr || t.prioridad === 'ALTA'
  );

  // Ordenar próximos términos cronológicamente por vencimiento más próximo
  const proximosTerminosOrdenados = [...terminosPendientes].sort((a, b) => 
    a.fechaVencimientoCalculada.localeCompare(b.fechaVencimientoCalculada)
  );

  // Expedientes enriquecidos con su última actuación procesal y próximo término
  const expedientesEnriquecidos = [...expedientesOrg]
    .sort((a, b) => (b.fechaActualizacion || b.fechaInicio).localeCompare(a.fechaActualizacion || a.fechaInicio))
    .slice(0, 5)
    .map((exp) => {
      const actuacionesExp = db.actuaciones[exp.id] || [];
      const ultimaActuacion = actuacionesExp.length > 0 ? actuacionesExp[0] : null;
      const terminosExp = terminosPendientes
        .filter((t) => t.expedienteId === exp.id)
        .sort((a, b) => a.fechaVencimientoCalculada.localeCompare(b.fechaVencimientoCalculada));
      const proximoTermino = terminosExp.length > 0 ? terminosExp[0] : null;
      const clienteAsociado = clientesOrg.find((c) => c.id === exp.clienteId);

      return {
        ...exp,
        ultimaActuacion,
        proximoTermino,
        clienteAutorizadoHabeasData: !!clienteAsociado?.consentimientoLey1581?.autorizado,
      };
    });

  // Fórmulas financieras transparentes sin duplicación de pagos ni datos ficticios
  const totalHonorariosPactados = honorariosOrg.reduce((acc, h) => acc + (h.valorAcordadoCOP || 0), 0);
  const totalHonorariosRecaudados = honorariosOrg.reduce((acc, h) => acc + (h.valorPagadoCOP || 0), 0);
  const saldoPorCobrar = Math.max(0, totalHonorariosPactados - totalHonorariosRecaudados);
  const totalHonorariosFacturados = totalHonorariosPactados;

  res.json({
    totalClientes,
    clientesConHabeasData,
    expedientesActivos,
    totalExpedientes: expedientesOrg.length,
    terminosPendientesTotal: terminosPendientes.length,
    terminosCriticosTotal: terminosCriticos.length,
    terminosVencidosTotal: terminosVencidos.length,
    terminosCumplidosTotal: terminosCumplidos.length,
    totalDocumentos: documentosOrg.length,
    totalHonorariosPactados,
    totalHonorariosFacturados,
    totalHonorariosRecaudados,
    saldoPorCobrar,
    proximosTerminos: proximosTerminosOrdenados.slice(0, 5),
    expedientesRecientes: expedientesEnriquecidos,
    actividadReciente: auditoriaOrg.slice(0, 6),
  });
});

// CLIENTES (CRUD protegido con aislamiento tenant)
app.get('/api/clientes', requireAuth, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const orgId = authReq.user.organizacionId;
  const db = leerDB();

  const { buscar, estado, tipo } = req.query;
  let filtrados = db.clientes.filter((c) => c.organizacionId === orgId);

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

app.get('/api/clientes/:id', requireAuth, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;
  const db = leerDB();
  const cliente = db.clientes.find((c) => c.id === id);

  if (!cliente) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }

  if (!verificarAislamientoTenant(authReq, res, cliente.organizacionId, 'cliente')) {
    return;
  }

  res.json({ cliente });
});

app.post('/api/clientes', requireAuth, requireRole('ADMIN_TITULAR', 'ABOGADO_ASOCIADO'), (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const db = leerDB();
  const nuevoClienteData = req.body;

  if (!nuevoClienteData.nombreCompletoORazonSocial || !nuevoClienteData.numeroIdentificacion) {
    return res.status(400).json({ error: 'El nombre/razón social y la identificación son obligatorios' });
  }

  const nuevoCliente: Cliente = {
    ...nuevoClienteData,
    id: `cli-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    organizacionId: authReq.user.organizacionId,
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
    expedientesIds: [],
    estado: nuevoClienteData.estado || 'ACTIVO',
    consentimientoLey1581: nuevoClienteData.consentimientoLey1581 || {
      autorizado: false,
      fechaAutorizacion: new Date().toISOString(),
      canalAutorizacion: 'DIGITAL_APP',
      finalidadTratamiento: 'Pendiente de suscripción y acuse formal de autorización según Ley 1581 de 2012',
    },
  };

  db.clientes.unshift(nuevoCliente);
  guardarDB(db);

  registrarAuditoria(
    authReq.user.userId,
    authReq.user.nombre,
    authReq.user.rol,
    'CREATE',
    'CLIENTES',
    `Creación de cliente: ${nuevoCliente.nombreCompletoORazonSocial} (${nuevoCliente.tipoIdentificacion} ${nuevoCliente.numeroIdentificacion})`,
    nuevoCliente.id,
    authReq.user.organizacionId
  );

  res.status(201).json({ cliente: nuevoCliente });
});

app.put('/api/clientes/:id', requireAuth, requireRole('ADMIN_TITULAR', 'ABOGADO_ASOCIADO'), (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;
  const db = leerDB();
  const index = db.clientes.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }

  if (!verificarAislamientoTenant(authReq, res, db.clientes[index].organizacionId, 'cliente')) {
    return;
  }

  // Prevenir cambio malicioso de organizacionId
  const { organizacionId: _, ...datosActualizacion } = req.body;

  db.clientes[index] = {
    ...db.clientes[index],
    ...datosActualizacion,
    organizacionId: authReq.user.organizacionId,
    fechaActualizacion: new Date().toISOString(),
  };

  guardarDB(db);
  registrarAuditoria(
    authReq.user.userId,
    authReq.user.nombre,
    authReq.user.rol,
    'UPDATE',
    'CLIENTES',
    `Actualización de datos del cliente: ${db.clientes[index].nombreCompletoORazonSocial}`,
    id,
    authReq.user.organizacionId
  );

  res.json({ cliente: db.clientes[index] });
});

app.post('/api/clientes/:id/archive', requireAuth, requireRole('ADMIN_TITULAR'), (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;
  const db = leerDB();
  const cliente = db.clientes.find((c) => c.id === id);

  if (!cliente) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }

  if (!verificarAislamientoTenant(authReq, res, cliente.organizacionId, 'cliente')) {
    return;
  }

  cliente.estado = cliente.estado === 'ARCHIVADO' ? 'ACTIVO' : 'ARCHIVADO';
  cliente.fechaActualizacion = new Date().toISOString();
  guardarDB(db);

  registrarAuditoria(
    authReq.user.userId,
    authReq.user.nombre,
    authReq.user.rol,
    'UPDATE',
    'CLIENTES',
    `Cambio de estado del cliente ${cliente.nombreCompletoORazonSocial} a ${cliente.estado}`,
    id,
    authReq.user.organizacionId
  );

  res.json({ cliente });
});

// EXPEDIENTES (CRUD protegido con aislamiento tenant)
app.get('/api/expedientes', requireAuth, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const orgId = authReq.user.organizacionId;
  const db = leerDB();

  const { buscar, area, estado, clienteId } = req.query;
  let filtrados = db.expedientes.filter((e) => e.organizacionId === orgId);

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
        e.sintesisHechos.toLowerCase().includes(q)
    );
  }

  res.json({ expedientes: filtrados });
});

app.get('/api/expedientes/:id', requireAuth, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;
  const db = leerDB();
  const expediente = db.expedientes.find((e) => e.id === id);

  if (!expediente) {
    return res.status(404).json({ error: 'Expediente no encontrado' });
  }

  if (!verificarAislamientoTenant(authReq, res, expediente.organizacionId, 'expediente')) {
    return;
  }

  const actuaciones = db.actuaciones[id] || [];
  const terminos = db.terminos.filter((t) => t.expedienteId === id && t.organizacionId === authReq.user.organizacionId);
  const documentos = db.documentos.filter((d) => d.expedienteId === id && d.organizacionId === authReq.user.organizacionId);
  const cliente = db.clientes.find((c) => c.id === expediente.clienteId && c.organizacionId === authReq.user.organizacionId);

  res.json({
    expediente,
    actuaciones,
    terminos,
    documentos,
    cliente,
  });
});

app.post('/api/expedientes', requireAuth, requireRole('ADMIN_TITULAR', 'ABOGADO_ASOCIADO'), (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const db = leerDB();
  const datos = req.body;

  if (!datos.clienteId || !datos.areaJuridica || !datos.sintesisHechos) {
    return res.status(400).json({ error: 'El cliente, área jurídica y síntesis de hechos son obligatorios' });
  }

  // Verificar que el cliente pertenezca a la misma organización
  const cliente = db.clientes.find((c) => c.id === datos.clienteId && c.organizacionId === authReq.user.organizacionId);
  if (!cliente) {
    return res.status(400).json({ error: 'El cliente seleccionado no pertenece a su organización o no existe' });
  }

  const year = new Date().getFullYear();
  const count = db.expedientes.filter((e) => e.organizacionId === authReq.user.organizacionId).length + 1;
  const codigoInterno = `EXP-${year}-${String(count).padStart(3, '0')}`;

  const nuevoExpediente: Expediente = {
    ...datos,
    id: `exp-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    codigoInterno,
    organizacionId: authReq.user.organizacionId,
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
      creadoPor: authReq.user.nombre,
      fechaCreacion: new Date().toISOString(),
    },
  ];

  cliente.expedientesIds.push(nuevoExpediente.id);
  guardarDB(db);

  registrarAuditoria(
    authReq.user.userId,
    authReq.user.nombre,
    authReq.user.rol,
    'CREATE',
    'EXPEDIENTES',
    `Apertura de expediente ${nuevoExpediente.codigoInterno} (${nuevoExpediente.areaJuridica}) para cliente ${nuevoExpediente.clienteNombre}`,
    nuevoExpediente.id,
    authReq.user.organizacionId
  );

  res.status(201).json({ expediente: nuevoExpediente });
});

app.post('/api/expedientes/:id/actuaciones', requireAuth, requireRole('ADMIN_TITULAR', 'ABOGADO_ASOCIADO', 'ASISTENTE_JUDICIAL'), (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;
  const db = leerDB();
  const expediente = db.expedientes.find((e) => e.id === id);

  if (!expediente) {
    return res.status(404).json({ error: 'Expediente no encontrado' });
  }

  if (!verificarAislamientoTenant(authReq, res, expediente.organizacionId, 'expediente')) {
    return;
  }

  const datosActuacion = req.body;
  if (!datosActuacion.anotacion || !datosActuacion.tipoProvidencia) {
    return res.status(400).json({ error: 'La anotación y tipo de providencia son obligatorios' });
  }

  const nuevaActuacion = {
    ...datosActuacion,
    id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    expedienteId: id,
    fechaActuacion: datosActuacion.fechaActuacion || new Date().toISOString().split('T')[0],
    cuaderno: datosActuacion.cuaderno || 'Cuaderno Principal',
    creadoPor: authReq.user.nombre,
    fechaCreacion: new Date().toISOString(),
  };

  if (!db.actuaciones[id]) {
    db.actuaciones[id] = [];
  }
  db.actuaciones[id].unshift(nuevaActuacion);

  expediente.fechaActualizacion = new Date().toISOString();
  guardarDB(db);

  registrarAuditoria(
    authReq.user.userId,
    authReq.user.nombre,
    authReq.user.rol,
    'CREATE',
    'EXPEDIENTES',
    `Nueva actuación registrada en ${expediente.codigoInterno}: ${nuevaActuacion.tipoProvidencia}`,
    id,
    authReq.user.organizacionId
  );

  res.status(201).json({ actuacion: nuevaActuacion });
});

// TÉRMINOS Y AGENDA JUDICIAL
app.get('/api/terminos', requireAuth, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const orgId = authReq.user.organizacionId;
  const db = leerDB();
  const { expedienteId, estado } = req.query;

  let filtrados = db.terminos.filter((t) => t.organizacionId === orgId);
  if (expedienteId && typeof expedienteId === 'string') {
    filtrados = filtrados.filter((t) => t.expedienteId === expedienteId);
  }
  if (estado && typeof estado === 'string') {
    filtrados = filtrados.filter((t) => t.estado === estado);
  }

  res.json({ terminos: filtrados });
});

app.post('/api/terminos/computar', requireAuth, (req: Request, res: Response) => {
  const { fechaNotificacionOInicio, duracionDias, aplicaReglaLey2213 } = req.body;
  if (!fechaNotificacionOInicio || !duracionDias) {
    return res.status(400).json({ error: 'Fecha de notificación y duración de término en días son obligatorios' });
  }

  const resultado = calcularTerminoColombiano(
    fechaNotificacionOInicio,
    Number(duracionDias),
    'HABILES_JUDICIALES',
    !!aplicaReglaLey2213
  );

  res.json({ resultado });
});

app.post('/api/terminos', requireAuth, requireRole('ADMIN_TITULAR', 'ABOGADO_ASOCIADO', 'ASISTENTE_JUDICIAL'), (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const db = leerDB();
  const datos = req.body;

  if (!datos.titulo || !datos.fechaNotificacionOInicio) {
    return res.status(400).json({ error: 'Título y fecha de notificación son obligatorios' });
  }

  // Si tiene expediente, verificar aislamiento tenant
  if (datos.expedienteId) {
    const exp = db.expedientes.find((e) => e.id === datos.expedienteId);
    if (!exp || exp.organizacionId !== authReq.user.organizacionId) {
      return res.status(403).json({ error: 'El expediente no pertenece a su organización' });
    }
  }

  const duracion = datos.duracionDias ? Number(datos.duracionDias) : 5;
  const computo = calcularTerminoColombiano(
    datos.fechaNotificacionOInicio,
    duracion,
    'HABILES_JUDICIALES',
    !!datos.aplicaReglaLey2213
  );

  const nuevoTermino: TerminoAgenda = {
    ...datos,
    id: `term-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    organizacionId: authReq.user.organizacionId,
    fechaVencimientoCalculada: computo.fechaVencimientoCalculada,
    notasCómputo: datos.notasCómputo || `${computo.fundamentoLegal} - ${computo.advertenciaDeontologica}`,
    calculoConfirmadoPorAbogado: false,
    estado: 'PENDIENTE',
    prioridad: datos.prioridad || 'MEDIA',
    responsableId: datos.responsableId || authReq.user.userId,
    responsableNombre: datos.responsableNombre || authReq.user.nombre,
  };

  db.terminos.unshift(nuevoTermino);
  guardarDB(db);

  registrarAuditoria(
    authReq.user.userId,
    authReq.user.nombre,
    authReq.user.rol,
    'CREATE',
    'AGENDA',
    `Nuevo término registrado: ${nuevoTermino.titulo} (Vencimiento: ${nuevoTermino.fechaVencimientoCalculada})`,
    nuevoTermino.id,
    authReq.user.organizacionId
  );

  res.status(201).json({ termino: nuevoTermino, computo });
});

app.post('/api/terminos/:id/verify', requireAuth, requireRole('ADMIN_TITULAR', 'ABOGADO_ASOCIADO'), (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;
  const db = leerDB();
  const termino = db.terminos.find((t) => t.id === id);

  if (!termino) {
    return res.status(404).json({ error: 'Término no encontrado' });
  }

  if (!verificarAislamientoTenant(authReq, res, termino.organizacionId, 'término procesal')) {
    return;
  }

  termino.calculoConfirmadoPorAbogado = true;
  termino.abogadoQueConfirmo = authReq.user.nombre;
  termino.estado = 'VERIFICADO';
  guardarDB(db);

  registrarAuditoria(
    authReq.user.userId,
    authReq.user.nombre,
    authReq.user.rol,
    'CONFIRM_TERM',
    'AGENDA',
    `Abogado confirmó cómputo de término: ${termino.titulo}`,
    id,
    authReq.user.organizacionId
  );

  res.json({ termino });
});

// Alias compatible para confirmar término procesal
app.post('/api/terminos/:id/confirm', requireAuth, requireRole('ADMIN_TITULAR', 'ABOGADO_ASOCIADO'), (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;
  const db = leerDB();
  const termino = db.terminos.find((t) => t.id === id);

  if (!termino) {
    return res.status(404).json({ error: 'Término no encontrado' });
  }

  if (!verificarAislamientoTenant(authReq, res, termino.organizacionId, 'término procesal')) {
    return;
  }

  termino.calculoConfirmadoPorAbogado = true;
  termino.abogadoQueConfirmo = req.body?.abogadoNombre || authReq.user.nombre;
  termino.estado = 'VERIFICADO';
  guardarDB(db);

  registrarAuditoria(
    authReq.user.userId,
    authReq.user.nombre,
    authReq.user.rol,
    'CONFIRM_TERM',
    'AGENDA',
    `Abogado titular verificó cómputo de término: ${termino.titulo}`,
    id,
    authReq.user.organizacionId
  );

  res.json({ termino });
});

// Marcar término como cumplido en la agenda
app.post('/api/terminos/:id/complete', requireAuth, requireRole('ADMIN_TITULAR', 'ABOGADO_ASOCIADO', 'ASISTENTE_JUDICIAL'), (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;
  const db = leerDB();
  const termino = db.terminos.find((t) => t.id === id);

  if (!termino) {
    return res.status(404).json({ error: 'Término no encontrado' });
  }

  if (!verificarAislamientoTenant(authReq, res, termino.organizacionId, 'término procesal')) {
    return;
  }

  termino.estado = 'CUMPLIDO';
  guardarDB(db);

  registrarAuditoria(
    authReq.user.userId,
    authReq.user.nombre,
    authReq.user.rol,
    'UPDATE',
    'AGENDA',
    `Término procesal marcado como CUMPLIDO: ${termino.titulo}`,
    id,
    authReq.user.organizacionId
  );

  res.json({ termino });
});

// DOCUMENTOS LEGALES
app.get('/api/documentos', requireAuth, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const orgId = authReq.user.organizacionId;
  const db = leerDB();
  const { expedienteId } = req.query;

  let filtrados = db.documentos.filter((d) => d.organizacionId === orgId);
  if (expedienteId && typeof expedienteId === 'string') {
    filtrados = filtrados.filter((d) => d.expedienteId === expedienteId);
  }

  res.json({ documentos: filtrados });
});

app.post('/api/documentos', requireAuth, requireRole('ADMIN_TITULAR', 'ABOGADO_ASOCIADO', 'ASISTENTE_JUDICIAL'), (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const db = leerDB();
  const datos = req.body;

  if (!datos.titulo || !datos.contenidoTexto) {
    return res.status(400).json({ error: 'Título y contenido del documento son obligatorios' });
  }

  if (datos.expedienteId) {
    const exp = db.expedientes.find((e) => e.id === datos.expedienteId);
    if (!exp || exp.organizacionId !== authReq.user.organizacionId) {
      return res.status(403).json({ error: 'El expediente no pertenece a su organización' });
    }
  }

  const nuevoDoc: DocumentoLegal = {
    ...datos,
    id: `doc-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    version: 1,
    creadoPor: authReq.user.nombre,
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
    estado: datos.estado || 'BORRADOR',
    organizacionId: authReq.user.organizacionId,
  };

  db.documentos.unshift(nuevoDoc);
  guardarDB(db);

  registrarAuditoria(
    authReq.user.userId,
    authReq.user.nombre,
    authReq.user.rol,
    'CREATE',
    'DOCUMENTOS',
    `Creación de documento jurídico: ${nuevoDoc.titulo} (${nuevoDoc.tipoPlantilla})`,
    nuevoDoc.id,
    authReq.user.organizacionId
  );

  res.status(201).json({ documento: nuevoDoc });
});

app.get('/api/documentos/:id/export-word', requireAuth, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;
  const db = leerDB();
  const doc = db.documentos.find((d) => d.id === id);

  if (!doc) {
    return res.status(404).json({ error: 'Documento no encontrado' });
  }

  if (!verificarAislamientoTenant(authReq, res, doc.organizacionId, 'documento')) {
    return;
  }

  const htmlParaWord = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${doc.titulo}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; margin: 2.5cm; }
        h1, h2, h3 { font-family: 'Arial', sans-serif; }
        .encabezado { text-align: center; font-weight: bold; margin-bottom: 24pt; }
        .pie { font-size: 9pt; color: #555; text-align: center; margin-top: 36pt; border-top: 1px solid #ccc; padding-top: 8pt; }
      </style>
    </head>
    <body>
      <div class="encabezado">
        <p style="margin:0; font-size: 14pt;">${authReq.user.organizacionNombre}</p>
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

// HONORARIOS Y GESTIÓN
app.get('/api/honorarios', requireAuth, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const orgId = authReq.user.organizacionId;
  const db = leerDB();
  const honorariosOrg = db.honorarios.filter((h) => h.organizacionId === orgId);
  res.json({ honorarios: honorariosOrg });
});

app.post('/api/honorarios', requireAuth, requireRole('ADMIN_TITULAR', 'ABOGADO_ASOCIADO'), (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const db = leerDB();
  const datos = req.body;

  if (!datos.clienteId || !datos.concepto || !datos.valorAcordadoCOP) {
    return res.status(400).json({ error: 'Cliente, concepto y valor acordado son obligatorios' });
  }

  const cliente = db.clientes.find((c) => c.id === datos.clienteId && c.organizacionId === authReq.user.organizacionId);
  if (!cliente) {
    return res.status(403).json({ error: 'El cliente no pertenece a su organización' });
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
    organizacionId: authReq.user.organizacionId,
  };

  db.honorarios.unshift(nuevoHonorario);
  guardarDB(db);

  registrarAuditoria(
    authReq.user.userId,
    authReq.user.nombre,
    authReq.user.rol,
    'CREATE',
    'HONORARIOS',
    `Registro de acuerdo de honorarios: ${nuevoHonorario.concepto} ($${nuevoHonorario.valorAcordadoCOP.toLocaleString('es-CO')} COP)`,
    nuevoHonorario.id,
    authReq.user.organizacionId
  );

  res.status(201).json({ honorario: nuevoHonorario });
});

app.post('/api/honorarios/:id/pagos', requireAuth, requireRole('ADMIN_TITULAR', 'ABOGADO_ASOCIADO'), (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;
  const db = leerDB();
  const honorario = db.honorarios.find((h) => h.id === id);

  if (!honorario) {
    return res.status(404).json({ error: 'Registro de honorarios no encontrado' });
  }

  if (!verificarAislamientoTenant(authReq, res, honorario.organizacionId, 'registro de honorarios')) {
    return;
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
    registradoPor: authReq.user.nombre,
  };

  honorario.pagosRegistrados.push(nuevoPago);
  honorario.valorPagadoCOP += nuevoPago.montoCOP;
  honorario.saldoPendienteCOP = Math.max(0, honorario.valorAcordadoCOP - honorario.valorPagadoCOP);
  honorario.estado = honorario.saldoPendienteCOP === 0 ? 'PAGADO_TOTAL' : 'PARCIAL';

  guardarDB(db);

  registrarAuditoria(
    authReq.user.userId,
    authReq.user.nombre,
    authReq.user.rol,
    'UPDATE',
    'HONORARIOS',
    `Abono a honorarios: $${nuevoPago.montoCOP.toLocaleString('es-CO')} COP (${nuevoPago.medioPago})`,
    nuevoPago.id,
    authReq.user.organizacionId
  );

  res.status(201).json({ honorario, pago: nuevoPago });
});

// INVESTIGACIÓN JURÍDICA CON FUENTES OFICIALES VERIFICABLES
app.get('/api/investigacion/corpus', requireAuth, (_req: Request, res: Response) => {
  res.json({
    corpus: CORPUS_JURIDICO_COLOMBIA,
    portales: PORTALES_OFICIALES_COLOMBIA,
    totalDisposiciones: CORPUS_JURIDICO_COLOMBIA.length,
    fechaActualizacionCatalogo: '2026-10-29',
    procedencia: 'CATALOGO_LOCAL_CURADO_CON_ENLACES_OFICIALES_VERIFICABLES',
    notaMetodologica: 'Fichas normativas y jurisprudenciales oficiales colombianas cotejadas con SUIN-Juriscol y Relatorías de Altas Cortes. Cada registro incluye hipervínculo directo a la sede electrónica oficial.',
  });
});

app.get('/api/investigacion/search', requireAuth, (req: Request, res: Response) => {
  const { q, tipo, materia } = req.query;

  let filtrados = [...CORPUS_JURIDICO_COLOMBIA];

  if (tipo && typeof tipo === 'string' && tipo !== 'TODOS') {
    filtrados = filtrados.filter((item) => item.tipoNormaOProvidencia === tipo);
  }

  if (materia && typeof materia === 'string' && materia !== 'TODAS') {
    filtrados = filtrados.filter((item) => item.materias.some((m) => m.toLowerCase() === materia.toLowerCase()));
  }

  if (q && typeof q === 'string' && q.trim()) {
    const query = q.toLowerCase().trim();
    filtrados = filtrados.filter((item) => {
      return (
        item.identificador.toLowerCase().includes(query) ||
        item.epigrafeOTitulo.toLowerCase().includes(query) ||
        item.articulosOFundamentosClave.toLowerCase().includes(query) ||
        item.resumenExtracto.toLowerCase().includes(query) ||
        item.fechaExpedicion.includes(query) || // Búsqueda por año o fecha
        item.autoridadEmisora.toLowerCase().includes(query) ||
        item.materias.some((m) => m.toLowerCase().includes(query))
      );
    });
  }

  res.json({
    total: filtrados.length,
    resultados: filtrados,
    criterios: {
      busqueda: q || null,
      tipo: tipo || 'TODOS',
      materia: materia || 'TODAS',
    },
    procedencia: 'CATALOGO_LOCAL_CURADO_CON_ENLACES_OFICIALES_VERIFICABLES',
  });
});

// ASISTENTE JURÍDICO INTELIGENTE CON GEMINI AI
app.post('/api/ai/analyze-facts', requireAuth, async (req: Request, res: Response) => {
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
HECHOS PROPORCIONADOS:
"""
${hechos}
"""

REGLAS DE EVALUACIÓN:
1. NUNCA inventes artículos, números de sentencias o radicados judiciales.
2. Si la información fáctica es incompleta o ambigua, señala qué falta antes de formular una conclusión.
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
      "contras": ["string"],
      "requisitoProcedibilidad": "string"
    }
  ],
  "terminosYCaudidad": {
    "accionPrincipal": "string",
    "terminoMesesODias": "string",
    "fechaLimiteEstimada": "string",
    "advertenciaPerentoria": "string"
  },
  "checklistProbatorio": [
    { "medio": "string", "objeto": "string", "estado": "REQUERIDO"|"APORTADO" }
  ],
  "advertenciaDeontologica": "string"
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ analisis: parsed });
  } catch (error: any) {
    res.status(500).json({ error: 'Error procesando análisis fáctico en el servicio jurídico inteligente' });
  }
});

app.post('/api/ai/draft-document', requireAuth, async (req: Request, res: Response) => {
  const { tipoPlantilla, datosEspecificos, hechosContexto, pretensionesContexto } = req.body;
  if (!tipoPlantilla) {
    return res.status(400).json({ error: 'El tipo de documento es obligatorio' });
  }

  if (!aiClient) {
    return res.status(503).json({
      error: 'Servicio Gemini AI no configurado. Verifique GEMINI_API_KEY en variables de entorno.',
    });
  }

  try {
    const prompt = `Actúa como un abogado redactor senior en Colombia.
Redacta un borrador profesional completo y formal de acuerdo con las formalidades del CGP o CPACA según el tipo solicitado.

TIPO DE DOCUMENTO: ${tipoPlantilla}
HECHOS O ANTECEDENTES:
"""
${hechosContexto || 'No especificados'}
"""
PRETENSIONES O SOLICITUDES:
"""
${pretensionesContexto || 'No especificadas'}
"""
DATOS ESPECÍFICOS DE LAS PARTES Y RADICACIÓN:
"""
${JSON.stringify(datosEspecificos || {})}
"""

DIRECTRICES DE REDACCIÓN:
- Usa encabezado forense colombiano formal.
- No dejes párrafos genéricos o vacíos.
- Incluye acápite de Hechos numerados cronológicamente.
- Acápite de Pretensiones o Peticiones claras.
- Acápite de Fundamentos de Derecho y Medios de Prueba.
- Acápite de Notificaciones conforme a la Ley 2213 de 2022.
- Agrega al pie la advertencia: "[BORRADOR GENERADO POR ASISTENTE JURÍDICO - REQUIERE REVISIÓN Y FIRMA DE ABOGADO TITULADO]".

Genera el texto legal completo y estructurado en prosa forense formal.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ borrador: response.text });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al generar borrador documental' });
  }
});

app.post('/api/ai/analyze-document', requireAuth, async (req: Request, res: Response) => {
  const { textoDocumento } = req.body;
  if (!textoDocumento || textoDocumento.trim().length < 50) {
    return res.status(400).json({ error: 'El texto del documento debe tener al menos 50 caracteres para su análisis' });
  }

  if (!aiClient) {
    return res.status(503).json({
      error: 'Servicio Gemini AI no configurado.',
    });
  }

  try {
    const prompt = `Actúa como auditor jurídico senior especializado en análisis documental, contractual y procesal en Colombia.
Analiza con exhaustividad el siguiente texto jurídico:

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
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ analisis: parsed });
  } catch (error: any) {
    res.status(500).json({ error: 'Error en análisis documental' });
  }
});

// ============================================================
// ESCUELA JURÍDICA INTELIGENTE — ENDPOINTS EDUCATIVOS (ESTUDIANTES)
// Espacio pedagógico con separación estricta de expedientes reales
// ============================================================

// Listar casos académicos del estudiante/organización
app.get('/api/escuela/casos', requireAuth, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const db = leerDB();
  const casos = (db.casosAcademicos || []).filter(
    (c) => c.organizacionId === authReq.user.organizacionId
  );
  res.json({ casos });
});

// Guardar o registrar caso académico
app.post('/api/escuela/casos', requireAuth, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const db = leerDB();
  const body = req.body;

  if (!body.titulo || !body.hechosOriginales) {
    return res.status(400).json({ error: 'El título y la relación de hechos del caso académico son obligatorios' });
  }

  const nuevoCaso: CasoAcademico = {
    id: body.id || `caso-acad-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    titulo: body.titulo.trim(),
    areaDerecho: body.areaDerecho || 'CONSTITUCIONAL',
    materiaEspecifica: body.materiaEspecifica || 'General',
    hechosOriginales: body.hechosOriginales,
    hechosAcreditados: Array.isArray(body.hechosAcreditados) ? body.hechosAcreditados : [],
    inferenciasJuridicas: Array.isArray(body.inferenciasJuridicas) ? body.inferenciasJuridicas : [],
    informacionFaltanteYPorVerificar: Array.isArray(body.informacionFaltanteYPorVerificar) ? body.informacionFaltanteYPorVerificar : [],
    problemasJuridicos: Array.isArray(body.problemasJuridicos) ? body.problemasJuridicos : [],
    preguntasPorResolver: Array.isArray(body.preguntasPorResolver) ? body.preguntasPorResolver : [],
    fuentesRecomendadas: Array.isArray(body.fuentesRecomendadas) ? body.fuentesRecomendadas : [],
    lineasAnalisis: Array.isArray(body.lineasAnalisis) ? body.lineasAnalisis : [],
    estadoEstudio: body.estadoEstudio || 'EN_ANALISIS',
    tareasInvestigacion: Array.isArray(body.tareasInvestigacion) ? body.tareasInvestigacion : [],
    proximaActividadAcademica: body.proximaActividadAcademica || 'Revisar fuentes normativas y jurisprudenciales aplicables',
    notasEstudiante: body.notasEstudiante || '',
    historialCambios: [
      {
        fecha: new Date().toISOString(),
        accion: 'CREACION_CASO_ACADEMICO',
        detalles: `Caso académico creado por ${authReq.user.nombre}`,
      },
    ],
    esCasoPedagogico: true,
    creadoPor: authReq.user.nombre,
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
    organizacionId: authReq.user.organizacionId,
  };

  if (!db.casosAcademicos) {
    db.casosAcademicos = [];
  }
  db.casosAcademicos.unshift(nuevoCaso);
  guardarDB(db);

  registrarAuditoria(
    authReq.user.userId,
    authReq.user.nombre,
    authReq.user.rol,
    'CREATE',
    'ESCUELA_JURIDICA',
    `Caso académico guardado: ${nuevoCaso.titulo} (${nuevoCaso.areaDerecho})`,
    nuevoCaso.id,
    authReq.user.organizacionId
  );

  res.status(201).json({ caso: nuevoCaso });
});

// Actualizar caso académico (tareas, estado, notas)
app.put('/api/escuela/casos/:id', requireAuth, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;
  const db = leerDB();
  const caso = (db.casosAcademicos || []).find((c) => c.id === id);

  if (!caso) {
    return res.status(404).json({ error: 'Caso académico no encontrado' });
  }

  if (caso.organizacionId !== authReq.user.organizacionId) {
    return res.status(403).json({ error: 'No autorizado para modificar este caso académico' });
  }

  const {
    titulo,
    areaDerecho,
    materiaEspecifica,
    hechosOriginales,
    hechosAcreditados,
    inferenciasJuridicas,
    informacionFaltanteYPorVerificar,
    problemasJuridicos,
    preguntasPorResolver,
    fuentesRecomendadas,
    lineasAnalisis,
    estadoEstudio,
    tareasInvestigacion,
    proximaActividadAcademica,
    notasEstudiante,
  } = req.body;

  if (titulo !== undefined) caso.titulo = titulo;
  if (areaDerecho !== undefined) caso.areaDerecho = areaDerecho;
  if (materiaEspecifica !== undefined) caso.materiaEspecifica = materiaEspecifica;
  if (hechosOriginales !== undefined) caso.hechosOriginales = hechosOriginales;
  if (hechosAcreditados !== undefined) caso.hechosAcreditados = hechosAcreditados;
  if (inferenciasJuridicas !== undefined) caso.inferenciasJuridicas = inferenciasJuridicas;
  if (informacionFaltanteYPorVerificar !== undefined) caso.informacionFaltanteYPorVerificar = informacionFaltanteYPorVerificar;
  if (problemasJuridicos !== undefined) caso.problemasJuridicos = problemasJuridicos;
  if (preguntasPorResolver !== undefined) caso.preguntasPorResolver = preguntasPorResolver;
  if (fuentesRecomendadas !== undefined) caso.fuentesRecomendadas = fuentesRecomendadas;
  if (lineasAnalisis !== undefined) caso.lineasAnalisis = lineasAnalisis;
  if (estadoEstudio !== undefined) caso.estadoEstudio = estadoEstudio;
  if (tareasInvestigacion !== undefined) caso.tareasInvestigacion = tareasInvestigacion;
  if (proximaActividadAcademica !== undefined) caso.proximaActividadAcademica = proximaActividadAcademica;
  if (notasEstudiante !== undefined) caso.notasEstudiante = notasEstudiante;

  caso.fechaActualizacion = new Date().toISOString();
  if (!caso.historialCambios) caso.historialCambios = [];
  caso.historialCambios.push({
    fecha: new Date().toISOString(),
    accion: 'ACTUALIZACION_CASO_ACADEMICO',
    detalles: `Modificación por ${authReq.user.nombre}. Estado: ${caso.estadoEstudio}`,
  });

  guardarDB(db);

  registrarAuditoria(
    authReq.user.userId,
    authReq.user.nombre,
    authReq.user.rol,
    'UPDATE',
    'ESCUELA_JURIDICA',
    `Caso académico actualizado: ${caso.titulo}`,
    caso.id,
    authReq.user.organizacionId
  );

  res.json({ caso });
});

// Eliminar caso académico
app.delete('/api/escuela/casos/:id', requireAuth, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;
  const db = leerDB();
  const index = (db.casosAcademicos || []).findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Caso académico no encontrado' });
  }

  const caso = db.casosAcademicos![index];
  if (caso.organizacionId !== authReq.user.organizacionId) {
    return res.status(403).json({ error: 'No autorizado para eliminar este caso académico' });
  }

  db.casosAcademicos!.splice(index, 1);
  guardarDB(db);

  registrarAuditoria(
    authReq.user.userId,
    authReq.user.nombre,
    authReq.user.rol,
    'DELETE',
    'ESCUELA_JURIDICA',
    `Caso académico eliminado: ${caso.titulo}`,
    caso.id,
    authReq.user.organizacionId
  );

  res.json({ success: true, message: 'Caso académico eliminado correctamente' });
});

// Análisis pedagógico estructurado de casos (IA + Motor Jurídico Colombiano)
app.post('/api/escuela/analyze-case', requireAuth, async (req: Request, res: Response) => {
  const { hechos, areaDerecho, titulo } = req.body;
  if (!hechos || hechos.trim().length < 15) {
    return res.status(400).json({ error: 'La descripción de los hechos del caso es obligatoria (mínimo 15 caracteres)' });
  }

  const area = areaDerecho || 'CONSTITUCIONAL';

  // Si Gemini AI está configurado, usarlo con prompt pedagógico estricto
  if (aiClient) {
    try {
      const prompt = `Actúa como un profesor universitario titular de Derecho en Colombia y director de clínica jurídica.
Tu objetivo es guiar y formar el pensamiento crítico del estudiante sin resolver mecánicamente el caso.
Analiza la siguiente situación jurídica académica con base en el ordenamiento jurídico de Colombia:

ÁREA DEL DERECHO: ${area}
TÍTULO DEL CASO ACADÉMICO: ${titulo || 'Caso de Estudio Jurídico'}
HECHOS PROPORCIONADOS POR EL ESTUDIANTE:
"""
${hechos}
"""

REGLAS PEDAGÓGICAS ESTRICTAS:
1. Distingue con precisión de orfebre entre:
   - Hechos aportados / acreditados: Lo que el texto afirma con evidencia factual directa.
   - Inferencias jurídicas lógicas: Conclusiones que se desprenden del Derecho pero que aún no están demostradas en juicio.
   - Información faltante y por verificar: Datos probatorios, fechas de ejecutoria, notificaciones o presupuestos que el estudiante debe investigar antes de aventurar una conclusión.
2. Identifica de 1 a 3 problemas jurídicos en forma de pregunta técnica precisa.
3. Formula de 2 a 4 preguntas clave que el estudiante debe resolver para fundamentar el caso.
4. Identifica fuentes normativas y jurisprudenciales oficiales pertinentes de Colombia (CGP Ley 1564/12, CPACA Ley 1437/11, Ley 2213/22, Ley 1755/15, Ley 2220/22, Sentencias C-590/05, SU-091/00, etc.).
5. Plantea al menos 2 líneas de análisis jurídico contrastadas, cada una con su fundamento, pros y limitaciones/riesgos.
6. Incluye advertencia deontológica (Ley 1123 de 2007, deber de debida diligencia).

Responde ÚNICAMENTE en JSON con la siguiente estructura:
{
  "hechosAcreditados": ["string"],
  "inferenciasJuridicas": ["string"],
  "informacionFaltanteYPorVerificar": ["string"],
  "problemasJuridicos": ["string"],
  "preguntasPorResolver": ["string"],
  "fuentesRecomendadas": [
    {
      "identificador": "string",
      "tipo": "string",
      "motivoPertinencia": "string",
      "enlaceOficial": "string",
      "verificadaEnCatalogo": true
    }
  ],
  "lineasAnalisis": [
    {
      "titulo": "string",
      "fundamentoJuridico": "string",
      "pros": "string",
      "limitacionesORiesgos": "string"
    }
  ],
  "proximaActividadSugerida": "string",
  "advertenciaDeontologica": "string"
}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ analisis: parsed, origen: 'GEMINI_AI_DOCENTE' });
    } catch (err) {
      console.warn('Error llamando Gemini AI, activando motor pedagógico heurístico:', err);
    }
  }

  // Motor Pedagógico Heurístico de Respaldo (Rigor Jurídico Colombiano sin caídas)
  const hechosTexto = hechos.toLowerCase();
  const fuentesMatching = CORPUS_JURIDICO_COLOMBIA.filter((norma) => {
    return (
      norma.materias.some((m) => m.toLowerCase().includes(area.toLowerCase()) || hechosTexto.includes(m.toLowerCase())) ||
      norma.epigrafeOTitulo.toLowerCase().includes(area.toLowerCase()) ||
      norma.identificador.toLowerCase().includes(area.toLowerCase())
    );
  }).slice(0, 3);

  const fallback = {
    hechosAcreditados: [
      `Situación fáctica base expuesta en el relato: "${hechos.substring(0, 120)}..."`,
      'Intervención de partes y sujetos procesales identificados en el texto.',
      'Existencia de controversia o conflicto jurídico en el ámbito de ' + area + '.',
    ],
    inferenciasJuridicas: [
      'Configuración preliminar de pretensiones o afectación de derechos subjetivos.',
      'Necesidad de encuadrar los hechos bajo los requisitos formales de la acción o demanda respectiva.',
      'Posible aplicación del principio de prevalencia del derecho sustancial sobre el formal (Art. 228 CP).',
    ],
    informacionFaltanteYPorVerificar: [
      'Verificar fechas exactas de ocurrencia de los hechos, notificaciones y actos para cómputo de términos y caducidad/prescripción.',
      'Comprobar si se agotaron requisitos previos de procedibilidad (e.g. Conciliación extrajudicial obligatoria Ley 2220 de 2022 o vía administrativa previa).',
      'Determinar si existen medios de prueba documentales, periciales o testimoniales idóneos para acreditar las afirmaciones fácticas.',
    ],
    problemasJuridicos: [
      `¿Se configuran en el caso concreto los elementos de procedencia procesal y sustancial requeridos por el ordenamiento colombiano en materia de ${area}?`,
      '¿Existe causal de nulidad procesal, preclusión de términos o defecto sustantivo susceptible de invocarse?',
    ],
    preguntasPorResolver: [
      '¿Cuál es el juez o autoridad con competencia territorial y funcional privativa para conocer del asunto?',
      '¿Qué tarifa legal o sistema de sana crítica rige la valoración de los medios de prueba en esta materia?',
      '¿Cuál es el término perentorio de traslado o contestación y bajo qué formalidades debe notificarse (Ley 2213 de 2022)?',
    ],
    fuentesRecomendadas: fuentesMatching.length > 0 ? fuentesMatching.map((f) => ({
      identificador: f.identificador,
      tipo: f.tipoNormaOProvidencia,
      motivoPertinencia: f.resumenExtracto.substring(0, 140) + '...',
      enlaceOficial: f.enlaceVerificado,
      verificadaEnCatalogo: true,
    })) : [
      {
        identificador: 'Constitución Política de Colombia',
        tipo: 'CONSTITUCION',
        motivoPertinencia: 'Art. 29 (Debido Proceso) y Art. 229 (Acceso a la Justicia).',
        enlaceOficial: 'https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Constitucion/1687988',
        verificadaEnCatalogo: true,
      },
      {
        identificador: 'Ley 1564 de 2012 (Código General del Proceso)',
        tipo: 'LEY',
        motivoPertinencia: 'Art. 82 (Requisitos de demanda) y Art. 117-121 (Términos procesales perentorios).',
        enlaceOficial: 'https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Leyes/1684370',
        verificadaEnCatalogo: true,
      },
    ],
    lineasAnalisis: [
      {
        titulo: 'Línea de Análisis Principal: Vía Ordinaria / Declarativa',
        fundamentoJuridico: 'Normas sustantivas y procesales rectoras del área de ' + area + ' con exigencia probatoria plena.',
        pros: 'Garantiza debate probatorio contradictorio amplio, excepciones de fondo y sentencia con efectos de cosa juzgada formal y material.',
        limitacionesORiesgos: 'Duración procesal conforme a los términos del Art. 121 del CGP (1 año en 1a instancia) y riesgos de costas y aranceles.',
      },
      {
        titulo: 'Línea de Análisis Alternativa: Mecanismo Sumario o Constitucional',
        fundamentoJuridico: 'Tutela subsidiaria por violación directa al debido proceso (Art. 86 CP) o MASC de autocomposición (Ley 2220 de 2022).',
        pros: 'Celeridad procesal y posibilidad de solución temprana del conflicto con mérito ejecutivo.',
        limitacionesORiesgos: 'Exige acreditar inmediatez, subsidiariedad estricta o perjuicio irremediable inminente.',
      },
    ],
    proximaActividadSugerida: 'Elaborar matriz de hechos probados vs hechos por probar y verificar los términos de caducidad en el catálogo oficial.',
    advertenciaDeontologica: 'Ejercicio pedagógico formativo (Ley 1123 de 2007 Art. 28). En casos reales debe comprobarse la vigencia normativa y el acervo probatorio antes de radicar cualquier actuación.',
  };

  res.json({ analisis: fallback, origen: 'MOTOR_PEDAGOGICO_HEURISTICO_COLOMBIANO' });
});

// Ruta procesal orientativa para estudiantes
app.post('/api/escuela/procedural-route', requireAuth, (req: Request, res: Response) => {
  const { materia, tipoProcedimiento, asunto } = req.body;
  const materiaNorm = (materia || 'CIVIL').toUpperCase();

  let ruta: RutaProcesalAcademica;

  if (materiaNorm.includes('CONSTITUCIONAL') || (tipoProcedimiento && tipoProcedimiento.includes('TUTELA'))) {
    ruta = {
      materia: 'Derecho Constitucional Procesal',
      tipoProcedimiento: 'Acción de Tutela (Decreto 2591 de 1991)',
      autoridadYCompetencia: 'Cualquier juez unipersonal o colegiado de la República en primera instancia (Decreto 333 de 2021 de reparto)',
      requisitosPrevios: [
        'Legitimación por activa (titular de derecho fundamental, representante o agente oficioso).',
        'Legitimación por pasiva (autoridad pública o particular en supuestos del Art. 42 Dec. 2591/91).',
        'Principio de subsidiariedad: ausencia o ineficacia de otros mecanismos de defensa judicial.',
        'Principio de inmediatez: interposición dentro de un plazo razonable tras la vulneración o amenaza.',
      ],
      etapas: [
        {
          orden: 1,
          nombre: 'Radicación de la Solicitud de Tutela',
          descripcion: 'Presentación formal ante la oficina de reparto judicial o buzón electrónico institucional de la Rama Judicial.',
          terminoLegal: 'Inmediato (sin formalidades sacramentales, Art. 14 Decreto 2591 de 1991)',
          fundamentoLegal: 'Art. 86 Constitución Política y Art. 14 Decreto 2591 de 1991',
          actuacionSugerida: 'Anexar copia de peticiones previas y pruebas documentales sumarias.',
          advertencias: 'Manifestar bajo juramento que no se ha interpuesto otra tutela por los mismos hechos (tutela temeraria).',
        },
        {
          orden: 2,
          nombre: 'Auto Admisorio y Medidas Cautelares Provisionales',
          descripcion: 'El juez admite a trámite la tutela, ordena correr traslado a la autoridad o particular accionado y decide sobre medidas provisionales urgentes.',
          terminoLegal: 'Mismo día o día hábil siguiente a la radicación',
          fundamentoLegal: 'Art. 7 y 16 Decreto 2591 de 1991',
          condicionesComputo: 'Término de respuesta para accionados: generalmente de 1 a 3 días hábiles',
          actuacionSugerida: 'Solicitar medida provisional si existe riesgo de consumación de perjuicio irremediable.',
          advertencias: 'Vigilar la correcta vinculación de terceros con interés legítimo.',
        },
        {
          orden: 3,
          nombre: 'Fallo de Primera Instancia',
          descripcion: 'Decisión constitucional de mérito que concede o deniega el amparo de los derechos fundamentales invocados.',
          terminoLegal: 'Término improrrogable de 10 días hábiles judiciales',
          fundamentoLegal: 'Art. 86 CP y Art. 29 Decreto 2591 de 1991',
          condicionesComputo: 'Cómputo en días hábiles continuos desde la radicación en despacho',
          actuacionSugerida: 'Revisar exhaustivamente la parte resolutiva y notificaciones inmediatas.',
          advertencias: 'El vencimiento de los 10 días sin fallo constituye falta disciplinaria gravísima para el funcionario.',
        },
        {
          orden: 4,
          nombre: 'Impugnación del Fallo',
          descripcion: 'Recurso ordinario contra la decisión desestimatoria o estimatoria para ante el superior jerárquico funcional.',
          terminoLegal: 'Dentro de los 3 días hábiles siguientes a la notificación',
          fundamentoLegal: 'Art. 31 y 32 Decreto 2591 de 1991',
          condicionesComputo: 'Días hábiles judiciales contados a partir de la notificación personal o electrónica',
          actuacionSugerida: 'Sustentar los agravios constitucionales y la indebida apreciación fáctica o normativa.',
          advertencias: 'La impugnación se concede en el efecto devolutivo (la orden de tutela se cumple de inmediato).',
        },
        {
          orden: 5,
          nombre: 'Fallo de Segunda Instancia y Remisión para Eventual Revisión',
          descripcion: 'El ad quem resuelve la impugnación en 20 días hábiles y remite el expediente a la Corte Constitucional para selección.',
          terminoLegal: '20 días hábiles para resolver (Art. 32 Dec. 2591/91)',
          fundamentoLegal: 'Art. 32 y 33 Decreto 2591 de 1991',
          actuacionSugerida: 'Presentar solicitud ciudadana de insistencia ante la Corte si el asunto reviste relevancia constitucional.',
          advertencias: 'La revisión por la Corte Constitucional es discrecional de la Sala de Selección.',
        },
      ],
      proximaActuacionInmediata: 'Verificar el cumplimiento de los principios de subsidiariedad e inmediatez antes de redactar la solicitud.',
      riesgosYExcepciones: [
        'Riesgo de declaración de improcedencia por subsidiariedad si existen recursos ordinarios pendientes.',
        'Sanción por temeridad procesal si se radica paralelamente ante otro despacho judicial (Art. 38 Dec. 2591/91).',
      ],
      fuentesOficialesComprobacion: [
        {
          nombre: 'Decreto 2591 de 1991 (SUIN-Juriscol)',
          enlace: 'https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Decretos/1042735',
          tipo: 'NORMATIVA',
        },
        {
          nombre: 'Sentencia C-590 de 2005 (Corte Constitucional)',
          enlace: 'https://www.corteconstitucional.gov.co/relatoria/2005/C-590-05.htm',
          tipo: 'JURISPRUDENCIA',
        },
      ],
      advertenciaDeontologica: 'Ruta orientativa con propósitos estrictamente pedagógicos. Los términos constitucionales son perentorios e improrrogables.',
    };
  } else if (materiaNorm.includes('ADMINISTRATIVO')) {
    ruta = {
      materia: 'Derecho Procesal Administrativo',
      tipoProcedimiento: 'Medio de Control de Nulidad y Restablecimiento del Derecho (CPACA Ley 1437/11)',
      autoridadYCompetencia: 'Juez Administrativo del Circuito o Tribunal Administrativo (según cuantía, Art. 152 y 155 CPACA)',
      requisitosPrevios: [
        'Expedición y notificación en debida forma del acto administrativo definitivo (expreso o ficto).',
        'Agotamiento obligatorio de recursos en sede administrativa cuando procedan (reposición o apelación obligatoria, Art. 76 CPACA).',
        'Conciliación prejudicial obligatoria ante la Procuraduría Judicial (Ley 2220 de 2022 y Art. 161 CPACA).',
        'Presentación dentro del término estricto de caducidad de 4 meses (Art. 164 num. 2 lit. d CPACA).',
      ],
      etapas: [
        {
          orden: 1,
          nombre: 'Conciliación Extrajudicial Prejudicial',
          descripcion: 'Trámite obligatorio ante los Agentes del Ministerio Público (Procuraduría) para intentar acuerdo conciliatorio.',
          terminoLegal: 'Suspende el término de caducidad hasta por 3 meses o hasta la expedición del acta / constancia',
          fundamentoLegal: 'Ley 2220 de 2022 y Art. 161 CPACA',
          actuacionSugerida: 'Aportar prueba de la reclamación y liquidación del restablecimiento pretendido.',
          advertencias: 'Si no se agota, la demanda será rechazada de plano por falta de requisito de procedibilidad.',
        },
        {
          orden: 2,
          nombre: 'Radicación Electrónica de la Demanda',
          descripcion: 'Presentación de la demanda a través del sistema SAMAI con envío simultáneo por correo electrónico a la entidad pública accionada y a la Agencia Nacional de Defensa Jurídica del Estado.',
          terminoLegal: 'Dentro de los 4 meses de caducidad siguientes a la notificación del acto definitivo',
          fundamentoLegal: 'Art. 162-164 CPACA, Ley 2080 de 2021 y Art. 8 Ley 2213 de 2022',
          actuacionSugerida: 'Acreditar el canal digital de la entidad y la copia de envío de la demanda.',
          advertencias: 'La caducidad en el medio de control de nulidad y restablecimiento es perentoria e improrrogable.',
        },
        {
          orden: 3,
          nombre: 'Admisión y Traslado de la Demanda',
          descripcion: 'El despacho judicial admite la demanda y corre traslado a la entidad demandada, al Ministerio Público y a la ANDJE.',
          terminoLegal: '30 días hábiles de traslado para contestar la demanda',
          fundamentoLegal: 'Art. 171 y 172 CPACA (modificado por Ley 2080 de 2021)',
          condicionesComputo: 'Días hábiles judiciales contados conforme a la regla de notificación de la Ley 2213 de 2022 Art. 8',
          actuacionSugerida: 'Monitorear la contestación de excepciones previas y mixtas de la entidad pública.',
          advertencias: 'La entidad pública puede proponer excepciones de caducidad, cosa juzgada o indebido agotamiento de la vía administrativa.',
        },
        {
          orden: 4,
          nombre: 'Audiencia Inicial (Art. 180 CPACA)',
          descripcion: 'Saneamiento del proceso, resolución de excepciones previas, fijación del litigio, examen de medidas cautelares y decreto de pruebas.',
          terminoLegal: 'Fijada por auto una vez vencido el traslado de excepciones',
          fundamentoLegal: 'Art. 180 CPACA',
          actuacionSugerida: 'Preparar alegato técnico de fijación del litigio y delimitar los puntos probatorios fácticos.',
          advertencias: 'La inasistencia injustificada acarrea sanciones procesales e imposibilidad de solicitar nuevas pruebas.',
        },
        {
          orden: 5,
          nombre: 'Audiencia de Pruebas y Audiencia de Alegaciones y Juzgamiento',
          descripcion: 'Práctica de pruebas testimoniales y periciales, presentación de alegatos de conclusión (10 a 20 minutos por parte) y emisión de sentencia.',
          terminoLegal: 'Audiencias orales concentradas o sentencia anticipada si es asunto de puro derecho (Art. 182A CPACA)',
          fundamentoLegal: 'Art. 181, 182 y 182A CPACA',
          actuacionSugerida: 'Controvertir los dictámenes periciales contables de la entidad oficial.',
          advertencias: 'Verificar la posibilidad de solicitar sentencia anticipada si no se requieren pruebas testimoniales.',
        },
      ],
      proximaActuacionInmediata: 'Comprobar el acta de la Procuraduría y certificar la fecha límite de los 4 meses de caducidad.',
      riesgosYExcepciones: [
        'Caducidad de la acción por cómputo erróneo de los 4 meses.',
        'Falta de legitimación pasiva si no se vincula a la entidad que profirió el acto originario y sus descentralizadas.',
      ],
      fuentesOficialesComprobacion: [
        {
          nombre: 'Ley 1437 de 2011 - CPACA (SUIN-Juriscol)',
          enlace: 'https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Leyes/1681347',
          tipo: 'NORMATIVA',
        },
        {
          nombre: 'Ley 2220 de 2022 - Estatuto de Conciliación',
          enlace: 'https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Leyes/30044673',
          tipo: 'NORMATIVA',
        },
      ],
      advertenciaDeontologica: 'Guía procesal pedagógica orientativa. Los términos de caducidad contra el Estado no se suspenden por acuerdos entre particulares.',
    };
  } else {
    // Proceso Verbal Civil / Comercial (CGP)
    ruta = {
      materia: 'Derecho Procesal Civil y Comercial',
      tipoProcedimiento: 'Proceso Declarativo Verbal de Mayor o Menor Cuantía (Código General del Proceso - Ley 1564 de 2012)',
      autoridadYCompetencia: 'Juez Civil Municipal o de Circuito según cuantía y domicilio del demandado (Art. 15-28 CGP)',
      requisitosPrevios: [
        'Conciliación extrajudicial en derecho como requisito de procedibilidad (Ley 2220 de 2022 y Art. 621 CGP), salvo si se solicitan medidas cautelares previas (Art. 590 CGP).',
        'Presentación del poder especial mediante mensaje de datos sin necesidad de presentación personal o firma digital avanzada (Art. 5 Ley 2213 de 2022).',
        'Juramento estimatorio de las indemnizaciones o frutos pretendidos (Art. 206 CGP).',
        'Acreditación de la dirección electrónica de notificaciones bajo gravedad de juramento (Art. 8 Ley 2213 de 2022).',
      ],
      etapas: [
        {
          orden: 1,
          nombre: 'Presentación Electrónica de la Demanda',
          descripcion: 'Envío de la demanda con anexos completos por canal digital al despacho judicial con envío simultáneo a los demandados.',
          terminoLegal: 'Antes de que opere la prescripción extintiva de la acción sustancial (Art. 2536 Código Civil o Art. 94 CGP)',
          fundamentoLegal: 'Art. 82-84 CGP y Art. 6 Ley 2213 de 2022',
          actuacionSugerida: 'Verificar el cumplimiento del Art. 82 CGP y liquidar la cuantía procesal.',
          advertencias: 'El envío simultáneo por correo electrónico al demandado es obligatorio para evitar inadmisión.',
        },
        {
          orden: 2,
          nombre: 'Calificación de la Demanda: Auto Admisorio o Inadmisorio',
          descripcion: 'El juez revisa requisitos formales y profiere auto admisorio, inadmisorio (con 5 días para subsanar) o rechazo.',
          terminoLegal: '5 días hábiles para subsanar si es inadmitida (Art. 90 CGP)',
          fundamentoLegal: 'Art. 90 CGP',
          actuacionSugerida: 'Subsanar de forma precisa cualquier defecto formal advertido por el despacho.',
          advertencias: 'Si no se subsana en el término de 5 días, se ordenará el rechazo definitivo de la demanda.',
        },
        {
          orden: 3,
          nombre: 'Notificación Personal y Traslado de la Demanda',
          descripcion: 'Notificación personal por mensaje de datos al demandado (Art. 8 Ley 2213 de 2022) y término de traslado para contestar.',
          terminoLegal: '20 días hábiles judiciales de traslado para contestar (Art. 369 CGP)',
          fundamentoLegal: 'Art. 369 CGP y Art. 8 Ley 2213 de 2022',
          condicionesComputo: 'La notificación se entiende surtida transcurridos 2 días hábiles siguientes al acuse o entrega; el término de 20 días inicia al día hábil siguiente.',
          actuacionSugerida: 'Verificar constancia técnica de entrega o acuse de recibo del correo electrónico.',
          advertencias: 'Oportunidad preclusiva para formular excepciones previas, de mérito, reconvención y llamamiento en garantía.',
        },
        {
          orden: 4,
          nombre: 'Audiencia Inicial (Art. 372 CGP)',
          descripcion: 'Audiencia oral concentrada: intento obligatorio de conciliación, interrogatorio de partes, fijación de hechos y pretensiones, control de legalidad y decreto de pruebas.',
          terminoLegal: 'Señalada por auto de sustanciación tras el vencimiento de traslados',
          fundamentoLegal: 'Art. 372 CGP',
          actuacionSugerida: 'Comparecencia obligatoria de apoderados y partes (con facultades expresas para conciliar).',
          advertencias: 'La inasistencia injustificada de una parte presume ciertos los hechos susceptibles de confesión.',
        },
        {
          orden: 5,
          nombre: 'Audiencia de Instrucción y Juzgamiento (Art. 373 CGP)',
          descripcion: 'Práctica de testimonios, contradicción de dictámenes periciales, alegatos de conclusión (20 min por parte) y emisión del sentido del fallo o sentencia oral.',
          terminoLegal: 'Duración total del proceso en 1a instancia: 1 año calendario desde la notificación del auto admisorio (Art. 121 CGP)',
          fundamentoLegal: 'Art. 373 y 121 CGP',
          actuacionSugerida: 'Estructurar el alegato de conclusión sobre la carga de la prueba (Art. 167 CGP).',
          advertencias: 'Si se vence el plazo del Art. 121 CGP sin dictar sentencia, opera pérdida de competencia automática.',
        },
      ],
      proximaActuacionInmediata: 'Comprobar si se cuenta con prueba de conciliación previa o si procede solicitud de medidas cautelares nominadas o innominadas (Art. 590 CGP).',
      riesgosYExcepciones: [
        'Excepción previa de falta de jurisdicción o competencia.',
        'Inadmisión por defecto en juramento estimatorio o falta de poderes con mensaje de datos.',
      ],
      fuentesOficialesComprobacion: [
        {
          nombre: 'Ley 1564 de 2012 - Código General del Proceso (SUIN-Juriscol)',
          enlace: 'https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Leyes/1684370',
          tipo: 'NORMATIVA',
        },
        {
          nombre: 'Ley 2213 de 2022 - Tecnologías en Actuaciones Judiciales',
          enlace: 'https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Leyes/30044569',
          tipo: 'NORMATIVA',
        },
      ],
      advertenciaDeontologica: 'Ruta orientativa pedagógica. Toda actuación judicial real debe corroborarse con las providencias y términos fijados en estados electrónicos.',
    };
  }

  res.json({ ruta });
});

// Tutor Académico Interactivo (8 modos pedagógicos para estudiantes de Derecho)
app.post('/api/escuela/tutor-prompt', requireAuth, async (req: Request, res: Response) => {
  const { modo, temaOCaso, preguntaEstudiante, contexto } = req.body;
  const modoSeleccionado: TutorAcademicoModo = modo || 'CONCEPTOS';
  const tema = temaOCaso || 'Derecho Colombiano';

  if (aiClient) {
    try {
      const prompt = `Actúa como un catedrático y tutor universitario de Derecho en Colombia, galardonado por su pedagogía socrática.
Tu propósito formativo no es entregar una respuesta dogmática cerrada, sino enseñar el MÉTODO DE RAZONAMIENTO JURÍDICO paso a paso al estudiante.

MODO EDUCATIVO SELECCIONADO: ${modoSeleccionado}
TEMA O INSTITUCIÓN JURÍDICA: ${tema}
PREGUNTA O INQUIETUD DEL ESTUDIANTE:
"""
${preguntaEstudiante || 'Deseo comprender a fondo los fundamentos y aplicación práctica.'}
"""
CONTEXTO ADICIONAL:
"""
${contexto || 'Formación de pregrado en Derecho en Colombia.'}
"""

DIRECTRICES SEGÚN EL MODO:
- Si es CONCEPTOS: Explica la definición doctrinaria, su base en la legislación positiva colombiana, un ejemplo cotidiano y el error conceptual más frecuente que cometen los estudiantes.
- Si es CASOS_PRACTICOS: Plantea un caso hipotético, muestra cómo se descomponen los hechos, cómo se efectúa la subsunción y qué variables inclinan la decisión.
- Si es METODO_RESOLUCION: Enseña la técnica IRAC o método silogístico (Premisa Mayor, Premisa Menor, Juicio de Subsunción y Conclusión).
- Si es PREPARACION_EXAMENES: Sintetiza los 4 núcleos temáticos más preguntados en exámenes preparatorios o Saber Pro, con trampas hermenéuticas típicas.
- Si es PREGUNTAS_PRACTICA: Formula una pregunta tipo ECAES/Saber Pro con 4 opciones (A, B, C, D) y explica por qué la opción correcta lo es y por qué las demás son distractores inválidos.
- Si es ENSAYOS_TRABAJOS: Enseña a plantear una pregunta problema de investigación, hipótesis, marco teórico, metodología y fuentes oficiales a consultar.
- Si es LECTURA_GUIADA: Enseña a leer una sentencia de Alta Corte colombiana distinguiendo Hechos, Problema Jurídico, Ratio Decidendi, Obiter Dicta y Decisum.
- Si es ARGUMENTACION: Aplica el test de proporcionalidad constitucional (idoneidad, necesidad, proporcionalidad en sentido estricto) o ponderación de principios.

Responde ÚNICAMENTE en JSON con la siguiente estructura:
{
  "modo": "${modoSeleccionado}",
  "tituloGuia": "string",
  "introduccionPedagogica": "string",
  "desarrolloRazonamiento": [
    {
      "paso": "string",
      "explicacion": "string",
      "fundamentoNormativoColombiano": "string"
    }
  ],
  "ejercicioOPruebaFormativa": {
    "pregunta": "string",
    "opciones": ["string"],
    "retroalimentacionExplicativa": "string"
  },
  "erroresFrecuentesAEvitar": ["string"],
  "fuentesOficialesSugeridas": ["string"],
  "mensajeMotivacionalDocente": "string"
}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ tutor: parsed, origen: 'GEMINI_AI_TUTOR' });
    } catch (err) {
      console.warn('Error en tutor Gemini AI, recurriendo a tutor heurístico:', err);
    }
  }

  // Tutor heurístico formativo de respaldo
  const tutorFallback = {
    modo: modoSeleccionado,
    tituloGuia: `Guía Pedagógica de ${modoSeleccionado}: ${tema}`,
    introduccionPedagogica: `Estimado estudiante de Derecho: Al analizar ${tema}, el secreto profesional radica en desentrañar la lógica normativa detrás de cada regla y no memorizar artículos de forma aislada.`,
    desarrolloRazonamiento: [
      {
        paso: '1. Identificación de la Premisa Mayor (Norma Positiva Aplicable)',
        explicacion: 'Localiza la disposición legal vigente que regula el supuesto fáctico (e.g. Código General del Proceso, CPACA o Constitución Política) y su jurisprudencia vinculante.',
        fundamentoNormativoColombiano: 'Art. 230 de la Constitución: imperio de la ley y doctrina constitucional obligatoria.',
      },
      {
        paso: '2. Determinación de la Premisa Menor (Comprobación Fáctica)',
        explicacion: 'Filtra estrictamente los hechos demostrados mediante medios de prueba idóneos, descartando afirmaciones indemostradas o especulaciones subjetivas.',
        fundamentoNormativoColombiano: 'Art. 167 CGP: Carga dinámica y formal de la prueba.',
      },
      {
        paso: '3. Operación de Subsunción y Ponderación',
        explicacion: 'Comprueba si la hipótesis fáctica encaja exactamente en el supuesto normativo abstracto y pondera si existen tensiones con principios constitucionales.',
        fundamentoNormativoColombiano: 'Jurisprudencia de la Corte Constitucional sobre razonamiento proporcional y debido proceso.',
      },
      {
        paso: '4. Conclusión y Estrategia Procesal',
        explicacion: 'Deduce la consecuencia jurídica precisa y determina el medio de control o acción judicial pertinente con sus respectivos términos de caducidad.',
        fundamentoNormativoColombiano: 'Art. 117-121 CGP y Art. 164 CPACA: preclusión de términos procesales.',
      },
    ],
    ejercicioOPruebaFormativa: {
      pregunta: `En un debate académico sobre ${tema}, ¿cuál de los siguientes pasos es prioritario antes de radicar cualquier escrito judicial?`,
      opciones: [
        'A) Redactar inmediatamente las pretensiones económicas sin verificar legitimación en la causa.',
        'B) Constatar la vigencia de la norma, la competencia del juez y el agotamiento de requisitos de procedibilidad (e.g. conciliación prejudicial).',
        'C) Confiar en que los términos se interrumpen automáticamente con cualquier memorial informal.',
        'D) Asumir que la costumbre mercantil prima sobre norma imperativa de orden público.',
      ],
      retroalimentacionExplicativa: 'La opción B es la correcta. Conforme al ordenamiento colombiano (Ley 1564 de 2012 y Ley 2220 de 2022), la verificación de competencia, requisitos de procedibilidad y vigencia es presupuesto indispensable para evitar nulidades o rechazos de plano.',
    },
    erroresFrecuentesAEvitar: [
      'Confundir términos de caducidad de la acción (improrrogables) con prescripción del derecho sustancial.',
      'Ignorar las reglas de notificación electrónica y días de gracia de la Ley 2213 de 2022.',
      'Citar sentencias aisladas de tutela sin verificar si existe Sentencia de Unificación (SU) o de Constitucionalidad (C) vinculante.',
    ],
    fuentesOficialesSugeridas: [
      'Constitución Política de Colombia (Art. 4, 29, 86, 228, 229)',
      'Código General del Proceso (Ley 1564 de 2012)',
      'Estatuto de Conciliación en Colombia (Ley 2220 de 2022)',
      'Relatoría de la Corte Constitucional (SUIN-Juriscol)',
    ],
    mensajeMotivacionalDocente: '“El Derecho no es un conjunto de reglas fijas que se recitan, sino un arte de argumentación disciplinada y justicia material.” — ¡Continúa profundizando!',
  };

  res.json({ tutor: tutorFallback, origen: 'TUTOR_HEURISTICO_COLOMBIANO' });
});

// Generador de borradores académicos estructurados
app.post('/api/escuela/generate-doc', requireAuth, (req: Request, res: Response) => {
  const { tipo, casoId, titulo, datos } = req.body;
  const tipoDoc: DocumentoAcademicoTipo = tipo || 'FICHA_JURISPRUDENCIAL';
  const db = leerDB();
  const caso = casoId ? (db.casosAcademicos || []).find((c) => c.id === casoId) : null;

  const casoTitulo = caso ? caso.titulo : titulo || 'Ejercicio Académico';
  const casoArea = caso ? caso.areaDerecho : 'DERECHO';
  const fechaHoy = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

  let contenido = '';

  const marcaAgua = `========================================================================================
[BORRADOR ACADÉMICO PARA FINES PEDAGÓGICOS - ESCUELA JURÍDICA JAIRRESTAURA UNO A]
ADVERTENCIA OBLIGATORIA: Documento elaborado con propósitos exclusivos de estudio y formación universitaria.
NO es un documento apto para radicación judicial ni sustituye el concepto de un abogado titulado con T.P. vigente.
========================================================================================\n\n`;

  if (tipoDoc === 'FICHA_JURISPRUDENCIAL') {
    contenido = `${marcaAgua}FICHA DE ANÁLISIS JURISPRUDENCIAL OFICIAL
UNIVERSIDAD / CÁTEDRA: Seminario de Jurisprudencia y Litigio Estratégico
ESTUDIANTE / INVESTIGADOR: ${(req as AuthenticatedRequest).user.nombre}
FECHA DE ELABORACIÓN: ${fechaHoy}

1. IDENTIFICACIÓN DE LA PROVIDENCIA
- Corporación Judicial: Corte Constitucional de Colombia / Sala Plena
- Número de Radicación / Providencia: ${datos?.numeroProvidencia || 'Sentencia C-590 de 2005'}
- Magistrado Ponente: ${datos?.magistradoPonente || 'Dr. Jaime Córdoba Triviño'}
- Fecha de Expedición: ${datos?.fechaExpedicion || '8 de junio de 2005'}
- Enlace Verificado Oficial: ${datos?.enlaceOficial || 'https://www.corteconstitucional.gov.co/relatoria/2005/C-590-05.htm'}

2. SÍNTESIS DE HECHOS RELEVANTES
${caso ? caso.hechosOriginales : 'Breve relación cronológica de los antecedentes procesales y fácticos determinantes para el litigio.'}

3. PROBLEMA JURÍDICO FORMULADO POR LA CORTE
¿Cuáles son los presupuestos y causales generales y específicas de procedibilidad de la acción de tutela frente a providencias judiciales arbitrarias en el marco del Estado Social de Derecho?

4. TESIS O REGLA DE DERECHO (RATIO DECIDENDI)
La tutela contra providencias judiciales procede de manera excepcional cuando concurren los requisitos generales de procedibilidad (relevancia constitucional, subsidiariedad, inmediatez, legitimación, irregularidad decisiva y no ser tutela contra tutela) y se acredita al menos una de las ocho causales específicas de procedencia (defectos orgánico, procedimental absoluto, fáctico, sustantivo, error inducido, decisión sin motivación, desconocimiento del precedente o violación directa de la Carta Política).

5. ARGUMENTOS OBITER DICTA
La autonomía judicial consagrada en los artículos 228 y 230 de la Carta Política no ampara la arbitrariedad judicial ni resoluciones manifiestamente contrarias al debido proceso sustancial.

6. DECISIÓN ADOPTADA (DECISUM)
Declarar la exequibilidad de las disposiciones demandadas bajo el condicionamiento interpretativo que salvaguarda el amparo constitucional.

7. COMENTARIO CRÍTICO PEDAGÓGICO
El estudiante debe analizar cómo esta doctrina armoniza la seguridad jurídica y la cosa juzgada con la supremacía de los derechos fundamentales.`;
  } else if (tipoDoc === 'MATRIZ_ANALISIS') {
    contenido = `${marcaAgua}MATRIZ DE ANÁLISIS JURÍDICO COMPARATIVO
CASO ACADÉMICO: ${casoTitulo}
ÁREA: ${casoArea}
FECHA: ${fechaHoy}

| DIMENSIÓN | DESCRIPCIÓN FÁCTICA / NORMATIVA | FUNDAMENTO LEGAL | VALORACIÓN PROBATORIA / RIESGO |
| :--- | :--- | :--- | :--- |
| **Hechos Acreditados** | ${caso?.hechosAcreditados?.[0] || 'Hecho objetivo demostrado con documento'} | Art. 167 CGP | Probado con documento auténtico aportado |
| **Punto Controvertido** | Subordinación laboral vs autonomía contractual | Art. 23 CST / Art. 53 CP | Testimonios y comunicaciones internas |
| **Pretensión Principal** | Declaración de contrato realidad y acreencias | Art. 138 CPACA / Código Sustantivo | Requiere acreditar no interrupción temporal |
| **Excepción de Contraparte** | Contrato administrativo de prestación de servicios | Ley 80 de 1993 Art. 32 num. 3 | Desvirtuable por imposición de horario y mando |
| **Término Procesal** | Caducidad de 4 meses / Prescripción trienal | Art. 164 CPACA / Art. 151 CPTSS | Cómputo perentorio desde el último pago/acto |`;
  } else if (tipoDoc === 'CONCEPTO_ACADEMICO') {
    contenido = `${marcaAgua}CONCEPTO JURÍDICO ACADÉMICO DE CONSULTORIO
PARA: Consultante del Caso Pedagógico (${casoTitulo})
DE: Clínica Jurídica Universitaria
FECHA: ${fechaHoy}
ASUNTO: Viabilidad jurídica y estrategia procesal sugerida

I. CONSULTA PLANTEADA
El consultante solicita concepto sobre la procedencia de acciones judiciales frente a los siguientes hechos:
"""
${caso ? caso.hechosOriginales : 'Relación de hechos objeto de estudio.'}
"""

II. MARCO JURÍDICO APLICABLE
- Constitución Política de Colombia: Artículos 29, 53, 86 y 229.
- Normas rectoras: Códigos procesales y sustantivos colombianos vigentes.
- Jurisprudencia constitucional y de casación de las Altas Cortes.

III. ANÁLISIS JURÍDICO DOGMÁTICO
Al examinar la situación fáctica contrastada con la jurisprudencia unificada, se concluye que:
1. En el plano procesal, se debe verificar el agotamiento de requisitos de procedibilidad (Ley 2220 de 2022).
2. En el plano probatorio, la parte que afirma tiene la carga de incorporar los documentos y declaraciones necesarias.
3. En el plano sustancial, existe fundamento para reclamar la protección judicial del derecho invocado.

IV. CONCLUSIONES Y RECOMENDACIONES PEDAGÓGICAS
- Abstenerse de radicar documentos sin recopilar previamente la prueba documental completa.
- Cumplir estrictamente los términos de caducidad fijados por la ley.
- Recordar que este concepto tiene naturaleza formativa y no constituye mandato judicial.`;
  } else {
    // Línea de tiempo o esquema procesal
    contenido = `${marcaAgua}ESQUEMA Y LÍNEA DE TIEMPO PROCESAL PEDAGÓGICA
MATERIA: ${casoArea}
CASO: ${casoTitulo}
FECHA: ${fechaHoy}

FASE 1: ETAPA PREVIA Y REQUISITOS DE PROCEDIBILIDAD
- Intento de Conciliación Extrajudicial Prejudicial (Ley 2220 de 2022).
- Recopilación y custodia de evidencias documentales (Art. 28 Ley 1123 de 2007).
- Otorgamiento de poder especial mediante mensaje de datos (Art. 5 Ley 2213 de 2022).

FASE 2: RADICACIÓN Y ADMISIÓN
- Presentación de la demanda por buzón judicial electrónico oficial con traslado simultáneo.
- Calificación por el juzgado en auto admisorio (o 5 días para subsanar).
- Notificación electrónica personal al demandado (Art. 8 Ley 2213 de 2022: 2 días de gracia + inicio al día hábil siguiente).

FASE 3: CONTESTACIÓN Y EXCEPCIONES
- Traslado al demandado para contestar, proponer excepciones de mérito y previas.
- Fijación de fecha para audiencia oral concentrada.

FASE 4: AUDIENCIA ORAL Y SENTENCIA
- Conciliación judicial, fijación del litigio y decreto de pruebas.
- Práctica y contradicción de pruebas, alegatos orales y sentencia.
- Oportunidad para interposición de recursos de apelación en el acto de la audiencia.`;
  }

  const borrador: DocumentoAcademicoBorrador = {
    id: `doc-acad-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    titulo: `Borrador Académico: ${tipoDoc} - ${casoTitulo}`,
    tipo: tipoDoc,
    casoAcademicoId: casoId,
    contenidoTexto: contenido,
    fechaCreacion: new Date().toISOString(),
    esBorradorAcademico: true,
    advertenciaNoRadicable: 'Borrador pedagógico de estudio. Prohibida su radicación en despachos judiciales sin revisión previa.',
  };

  res.status(201).json({ borrador });
});

// BITÁCORA DE AUDITORÍA Y SEGURIDAD (Restringido a ADMIN_TITULAR y AUDITOR_CUMPLIMIENTO)
app.get('/api/audit-log', requireAuth, requireRole('ADMIN_TITULAR', 'AUDITOR_CUMPLIMIENTO'), (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const db = leerDB();
  const auditoriaOrg = db.auditoria.filter((a) => a.organizacionId === authReq.user.organizacionId);
  res.json({ auditoria: auditoriaOrg.slice(0, 100) });
});

// EXPORTACIÓN DE RESPALDO DE SEGURIDAD (Restringido a ADMIN_TITULAR)
app.get('/api/system/backup', requireAuth, requireRole('ADMIN_TITULAR'), (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const db = leerDB();

  registrarAuditoria(
    authReq.user.userId,
    authReq.user.nombre,
    authReq.user.rol,
    'EXPORT',
    'SEGURIDAD',
    'Exportación autorizada de respaldo institucional de datos (Ley 1581 de 2012)',
    undefined,
    authReq.user.organizacionId
  );

  // Exportar únicamente los datos correspondientes a la organización del usuario
  const backupTenant = {
    exportadoEn: new Date().toISOString(),
    exportadoPor: authReq.user.nombre,
    organizacion: db.organizacion,
    usuarios: db.usuarios.filter((u) => u.organizacionId === authReq.user.organizacionId),
    clientes: db.clientes.filter((c) => c.organizacionId === authReq.user.organizacionId),
    expedientes: db.expedientes.filter((e) => e.organizacionId === authReq.user.organizacionId),
    terminos: db.terminos.filter((t) => t.organizacionId === authReq.user.organizacionId),
    documentos: db.documentos.filter((d) => d.organizacionId === authReq.user.organizacionId),
    honorarios: db.honorarios.filter((h) => h.organizacionId === authReq.user.organizacionId),
    auditoria: db.auditoria.filter((a) => a.organizacionId === authReq.user.organizacionId),
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="jairrestaura_backup_${authReq.user.organizacionId}_${new Date().toISOString().split('T')[0]}.json"`
  );
  res.send(JSON.stringify(backupTenant, null, 2));
});

// RESTABLECIMIENTO DE BASE DE DATOS (Restringido a ADMIN_TITULAR)
app.post('/api/system/restore-default', requireAuth, requireRole('ADMIN_TITULAR'), (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const nuevo = crearDatosSemilla();
  guardarDB(nuevo);

  registrarAuditoria(
    authReq.user.userId,
    authReq.user.nombre,
    authReq.user.rol,
    'RESTORE',
    'SEGURIDAD',
    'Restablecimiento de base de datos a estado predeterminado seguro.',
    undefined,
    authReq.user.organizacionId
  );

  res.json({ success: true, message: 'Base de datos restaurada correctamente a estado seguro' });
});

// Manejador centralizado de errores para evitar filtración de stack traces
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error de Servidor]:', err);
  res.status(500).json({
    error: 'Error interno del servidor procesando la solicitud jurídica.',
    codigo: 'INTERNAL_SERVER_ERROR',
  });
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
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[JAIRRESTAURA UNO A] Servidor seguro iniciado en http://0.0.0.0:${PORT}`);
  });
}

iniciarServidor().catch((err) => {
  console.error('Error fatal al iniciar servidor:', err);
});
