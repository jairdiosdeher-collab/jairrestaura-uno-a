/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — VERCEL SERVERLESS FUNCTION
 * Ruta: POST /api/auth/login
 */

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-organizacion-id');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Método ${req.method} no permitido.` });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const { email } = body;

  const defaultUser = {
    id: 'usr-jair-01',
    nombre: 'Dr. Jair (Director Jurídico)',
    email: email || 'jairdiosdeher@gmail.com',
    tarjetaProfesional: 'T.P. No. 000.001 del C.S.J.',
    rol: 'ADMIN_TITULAR',
    organizacionId: 'org-jairrestaura-001',
    organizacionNombre: 'JairRestaura Uno A & Asociados — Firma Jurídica',
  };

  return res.status(200).json({
    token: 'jairrestaura-demo-session-token-2026',
    usuario: defaultUser,
    organizacion: {
      id: 'org-jairrestaura-001',
      nombre: 'JairRestaura Uno A & Asociados — Firma Jurídica',
    },
    expiresIn: 86400,
  });
}
