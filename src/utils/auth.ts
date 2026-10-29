/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — CLIENTE DE AUTENTICACIÓN Y SESIÓN ENTERPRISE
 */

import type { Usuario } from '../types/legal';

const TOKEN_KEY = 'jairrestaura_auth_token';
const USER_KEY = 'jairrestaura_auth_user';

export interface AuthState {
  token: string | null;
  usuario: Usuario | null;
  organizacion: { id: string; nombre: string } | null;
}

// Obtener token almacenado
export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// Guardar sesión
export function setAuthSession(token: string, usuario: Usuario, organizacion?: { id: string; nombre: string }) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  } catch (e) {
    console.error('Error guardando token:', e);
  }
}

// Limpiar sesión
export function clearAuthSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}

// Realizar peticiones authenticated con Bearer token
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Asegurar Content-Type si hay body en json
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}

// Interceptor global de fetch para garantizar que toda llamada a /api/* funcione de modo transparente
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    if (url.startsWith('/api/') && !url.startsWith('/api/auth/login')) {
      const token = getAuthToken();
      if (token) {
        init = init || {};
        const headers = new Headers(init.headers || {});
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
          init.headers = headers;
        }
      }
    }

    return await originalFetch(input, init);
  };
}
