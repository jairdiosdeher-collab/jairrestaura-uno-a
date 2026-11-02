/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — VERCEL API CATCH-ALL
 *
 * Publica las rutas Express existentes bajo /api/* como una única función
 * serverless. No duplica la lógica de negocio ni altera server.ts.
 */
import { app } from '../server.ts';

export default function handler(req: any, res: any) {
  // Algunas configuraciones de Vercel entregan la ruta sin el prefijo /api.
  // Express registra sus endpoints con ese prefijo, por lo que lo restauramos.
  if (typeof req.url === 'string' && !req.url.startsWith('/api/')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }

  return app(req, res);
}
