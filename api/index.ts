/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — VERCEL SERVERLESS CATCH-ALL HANDLER
 * Enruta todas las solicitudes /api/* de Vercel al motor unificado Express.
 */

import { app } from '../server.ts';

export default function handler(req: any, res: any) {
  // Asegurar que req.url mantenga el prefijo /api si el enrutador de Vercel lo recortó
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
}
