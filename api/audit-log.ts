/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — VERCEL SERVERLESS FUNCTION
 * Ruta: GET /api/audit-log
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
  return { auditoria: [] };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-organizacion-id');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: `Método ${req.method} no permitido.` });
  }

  const organizacionId = req.headers['x-organizacion-id'] || 'org-jairrestaura-001';
  const db = loadDB();

  const auditoriaOrg = (db.auditoria || [])
    .filter((a: any) => a.organizacionId === organizacionId)
    .slice(0, 100);

  return res.status(200).json({ auditoria: auditoriaOrg });
}
