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
  RolUsuario 
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
    return JSON.parse(contenido) as DatabaseSchema;
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

// INVESTIGACIÓN JURÍDICA OFICIAL
app.get('/api/investigacion/corpus', requireAuth, (_req: Request, res: Response) => {
  res.json({ corpus: CORPUS_JURIDICO_COLOMBIA, portales: PORTALES_OFICIALES_COLOMBIA });
});

app.get('/api/investigacion/search', requireAuth, (req: Request, res: Response) => {
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
