/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — VERCEL SERVERLESS FUNCTION
 * Ruta: GET /api/auth/me
 */

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-organizacion-id');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const defaultUser = {
    id: 'usr-jair-01',
    nombre: 'Dr. Jair (Director Jurídico)',
    email: 'jairdiosdeher@gmail.com',
    tarjetaProfesional: 'T.P. No. 000.001 del C.S.J.',
    rol: 'ADMIN_TITULAR',
    organizacionId: 'org-jairrestaura-001',
    organizacionNombre: 'JairRestaura Uno A & Asociados — Firma Jurídica',
  };

  const defaultOrg = {
    id: 'org-jairrestaura-001',
    nombre: 'JairRestaura Uno A & Asociados — Firma Jurídica',
    nit: '900.000.001-0',
    representante: 'Dr. Jair',
    tarjetaProfesionalDireccion: 'T.P. 000.001 del C.S.J.',
  };

  const usuariosDisponibles = [
    defaultUser,
    {
      id: 'usr-marcela-02',
      nombre: 'Dra. Marcela Gómez',
      email: 'm.gomez@jairrestaura-demo.internal',
      tarjetaProfesional: 'T.P. No. 000.002 del C.S.J.',
      rol: 'ABOGADO_ASOCIADO',
      organizacionId: 'org-jairrestaura-001',
      organizacionNombre: 'JairRestaura Uno A & Asociados — Firma Jurídica',
    },
    {
      id: 'usr-andres-03',
      nombre: 'Andrés Rojas',
      email: 'a.rojas@jairrestaura-demo.internal',
      rol: 'ASISTENTE_JUDICIAL',
      organizacionId: 'org-jairrestaura-001',
      organizacionNombre: 'JairRestaura Uno A & Asociados — Firma Jurídica',
    },
  ];

  return res.status(200).json({
    usuario: defaultUser,
    organizacion: defaultOrg,
    usuariosDisponibles,
  });
}
