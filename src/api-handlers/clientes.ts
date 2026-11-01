/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — VERCEL SERVERLESS FUNCTION
 * Ruta: /api/clientes (GET, POST, OPTIONS)
 * Soporta persistencia en runtime Node/Vercel con fallback en memoria resiliente.
 */

import fs from 'fs';
import path from 'path';

// Clientes iniciales de respaldo para entornos serverless de solo lectura
const SEED_CLIENTES = [
  {
    id: 'cli-andinas-01',
    tipoPersona: 'JURIDICA',
    tipoIdentificacion: 'NIT',
    numeroIdentificacion: '901.458.912',
    dv: '3',
    nombreCompletoORazonSocial: 'Inversiones Ficticias Andinas S.A.S. (Demostración)',
    representanteLegal: {
      nombre: 'Carlos Mario Restrepo Botero (Ficticio)',
      tipoIdentificacion: 'CC',
      numeroIdentificacion: '71.234.567',
      cargo: 'Gerente General y Representante Legal',
    },
    emailPrincipal: 'gerencia@inversionesandinas-ejemplo.com',
    emailNotificacionesJudiciales: 'notificaciones@inversionesandinas-ejemplo.com',
    telefono: '+57 (601) 789-0123',
    direccion: 'Carrera 7 No. 71-21, Torre B, Piso 14',
    ciudad: 'Bogotá D.C.',
    departamento: 'Cundinamarca',
    estado: 'ACTIVO',
    consentimientoLey1581: {
      autorizado: true,
      fechaAutorizacion: '2025-01-15T09:30:00Z',
      canalAutorizacion: 'DIGITAL_APP',
      finalidadTratamiento: 'Gestión procesal, representación judicial y custodia de expedientes conforme a la Ley 1581 de 2012.',
    },
    organizacionId: 'org-jairrestaura-001',
    expedientesIds: ['exp-2026-001'],
    fechaCreacion: '2025-01-15T09:30:00Z',
    fechaActualizacion: '2026-10-25T15:30:00Z',
  },
  {
    id: 'cli-cardona-02',
    tipoPersona: 'NATURAL',
    tipoIdentificacion: 'CC',
    numeroIdentificacion: '43.567.890',
    nombreCompletoORazonSocial: 'Ciudadana Demostrativa Cardona (Ficticia)',
    emailPrincipal: 'contacto@cardona-ejemplo.com',
    emailNotificacionesJudiciales: 'notif.cardona@cardona-ejemplo.com',
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
    organizacionId: 'org-jairrestaura-001',
    expedientesIds: ['exp-2026-002'],
    fechaCreacion: '2026-02-01T14:00:00Z',
    fechaActualizacion: '2026-02-01T14:00:00Z',
  },
];

// Almacén en memoria por instancia serverless
let inMemoryClientes = [...SEED_CLIENTES];

function getDBPath(): string {
  return path.join(process.cwd(), 'data', 'jairrestaura_db.json');
}

function loadClientes(): any[] {
  try {
    const dbPath = getDBPath();
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed.clientes)) {
        return parsed.clientes;
      }
    }
  } catch (err) {
    // Si falla el filesystem (ej. Vercel read-only o path missing), usa la memoria
  }
  return inMemoryClientes;
}

function saveClienteToDB(nuevoCliente: any): void {
  inMemoryClientes.unshift(nuevoCliente);
  try {
    const dbPath = getDBPath();
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed.clientes)) {
        parsed.clientes.unshift(nuevoCliente);
        fs.writeFileSync(dbPath, JSON.stringify(parsed, null, 2), 'utf-8');
      }
    }
  } catch (err) {
    // Modo serverless read-only: inMemoryClientes mantiene el estado en caliente
  }
}

export default async function handler(req: any, res: any) {
  // Encabezados CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-organizacion-id');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const organizacionId = req.headers['x-organizacion-id'] || 'org-jairrestaura-001';

  // GET /api/clientes
  if (req.method === 'GET') {
    const clientes = loadClientes();
    let filtrados = clientes.filter((c: any) => c.organizacionId === organizacionId);

    const { buscar, estado, tipo } = req.query || {};

    if (estado && typeof estado === 'string' && estado !== 'TODOS') {
      filtrados = filtrados.filter((c: any) => c.estado === estado);
    }
    if (tipo && typeof tipo === 'string' && tipo !== 'TODOS') {
      filtrados = filtrados.filter((c: any) => c.tipoPersona === tipo);
    }
    if (buscar && typeof buscar === 'string' && buscar.trim() !== '') {
      const q = buscar.toLowerCase().trim();
      filtrados = filtrados.filter(
        (c: any) =>
          (c.nombreCompletoORazonSocial && c.nombreCompletoORazonSocial.toLowerCase().includes(q)) ||
          (c.numeroIdentificacion && c.numeroIdentificacion.includes(q)) ||
          (c.emailPrincipal && c.emailPrincipal.toLowerCase().includes(q)) ||
          (c.ciudad && c.ciudad.toLowerCase().includes(q))
      );
    }

    return res.status(200).json({ clientes: filtrados });
  }

  // POST /api/clientes
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    // 1. Campos obligatorios
    if (!body.nombreCompletoORazonSocial || !body.nombreCompletoORazonSocial.trim() || !body.numeroIdentificacion || !body.numeroIdentificacion.trim()) {
      return res.status(400).json({
        error: 'El nombre o razón social y el número de identificación son obligatorios.',
        codigo: 'MISSING_REQUIRED_FIELDS',
      });
    }

    const todosClientes = loadClientes();

    // 2. Control de duplicados por número de identificación y organización
    const numIdLimpio = String(body.numeroIdentificacion || '').replace(/\D/g, '');
    const duplicado = todosClientes.find(
      (c: any) =>
        c.organizacionId === organizacionId &&
        String(c.numeroIdentificacion || '').replace(/\D/g, '') === numIdLimpio
    );

    if (duplicado) {
      return res.status(409).json({
        error: `Ya existe un cliente registrado con la identificación ${body.tipoIdentificacion || 'CC'} ${body.numeroIdentificacion} en su organización (${duplicado.nombreCompletoORazonSocial}).`,
        codigo: 'CLIENT_ALREADY_EXISTS',
      });
    }

    // 3. Validación sintáctica de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (body.emailPrincipal && !emailRegex.test(String(body.emailPrincipal).trim())) {
      return res.status(400).json({
        error: 'El correo electrónico principal no tiene un formato válido (ej. usuario@dominio.com).',
        codigo: 'INVALID_EMAIL_FORMAT',
      });
    }

    if (body.emailNotificacionesJudiciales && !emailRegex.test(String(body.emailNotificacionesJudiciales).trim())) {
      return res.status(400).json({
        error: 'El buzón de notificaciones judiciales no tiene un formato de correo válido.',
        codigo: 'INVALID_JUDICIAL_EMAIL_FORMAT',
      });
    }

    // 4. Validación de Persona Jurídica (exige Representante Legal)
    if (body.tipoPersona === 'JURIDICA') {
      if (!body.representanteLegal || !body.representanteLegal.nombre || !body.representanteLegal.nombre.trim()) {
        return res.status(400).json({
          error: 'Para personas jurídicas es obligatorio registrar el nombre del representante legal.',
          codigo: 'MISSING_LEGAL_REPRESENTATIVE',
        });
      }
    }

    // 5. Construcción del nuevo cliente respetando Habeas Data Ley 1581
    const nuevoCliente = {
      ...body,
      id: `cli-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      organizacionId,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      expedientesIds: [],
      estado: body.estado || 'ACTIVO',
      consentimientoLey1581: body.consentimientoLey1581 && typeof body.consentimientoLey1581.autorizado === 'boolean'
        ? {
            autorizado: body.consentimientoLey1581.autorizado,
            fechaAutorizacion: body.consentimientoLey1581.fechaAutorizacion || new Date().toISOString(),
            canalAutorizacion: body.consentimientoLey1581.canalAutorizacion || 'DIGITAL_APP',
            finalidadTratamiento: body.consentimientoLey1581.finalidadTratamiento || 'Gestión procesal, representación judicial y custodia de expedientes conforme a la Ley 1581 de 2012.',
          }
        : {
            autorizado: false,
            fechaAutorizacion: new Date().toISOString(),
            canalAutorizacion: 'PENDIENTE',
            finalidadTratamiento: 'Pendiente de suscripción y acuse formal de autorización según Ley 1581 de 2012',
          },
    };

    saveClienteToDB(nuevoCliente);

    return res.status(201).json({ cliente: nuevoCliente });
  }

  return res.status(405).json({ error: `Método ${req.method} no permitido.` });
}
