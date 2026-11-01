/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — VERCEL SERVERLESS FUNCTION
 * Ruta: /api/documentos (GET, POST, OPTIONS)
 */

import fs from 'fs';
import path from 'path';

function getDBPath(): string {
  return path.join(process.cwd(), 'data', 'jairrestaura_db.json');
}

function loadDB(): any {
  try {
    const p = getDBPath();
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) {
    // Read-only filesystem
  }
  return { documentos: [], expedientes: [] };
}

function saveDB(data: any): void {
  try {
    const p = getDBPath();
    if (fs.existsSync(p)) {
      fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
    }
  } catch (e) {
    // Read-only serverless filesystem
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-organizacion-id');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const organizacionId = req.headers['x-organizacion-id'] || 'org-jairrestaura-001';
  const db = loadDB();

  // GET /api/documentos
  if (req.method === 'GET') {
    let filtrados = (db.documentos || []).filter((d: any) => d.organizacionId === organizacionId);
    const { expedienteId } = req.query || {};
    if (expedienteId) {
      filtrados = filtrados.filter((d: any) => d.expedienteId === expedienteId);
    }
    return res.status(200).json({ documentos: filtrados });
  }

  // POST /api/documentos
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    if (!body.titulo || !body.contenidoTexto) {
      return res.status(400).json({
        error: 'El título y el contenido del documento son obligatorios.',
        codigo: 'MISSING_REQUIRED_FIELDS',
      });
    }

    const nuevoDoc = {
      ...body,
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      organizacionId,
      version: body.version || 1,
      estado: body.estado || 'BORRADOR',
      creadoPor: body.creadoPor || 'Dr. Jair',
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
    };

    if (!db.documentos) db.documentos = [];
    db.documentos.unshift(nuevoDoc);
    saveDB(db);

    return res.status(201).json({ documento: nuevoDoc });
  }

  return res.status(405).json({ error: `Método ${req.method} no permitido.` });
}
