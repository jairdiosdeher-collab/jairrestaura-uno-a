/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — SUITE DE PRUEBAS AUTOMATIZADAS DE SEGURIDAD (FASE 5)
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  nombre: string;
  paso: boolean;
  detalles: string;
}

const resultados: TestResult[] = [];

async function ejecutarPrueba(nombre: string, fn: () => Promise<void>) {
  try {
    await fn();
    resultados.push({ nombre, paso: true, detalles: 'Aprobada' });
    console.log(`\x1b[32m✔ [APROBADA]\x1b[0m ${nombre}`);
  } catch (err: any) {
    resultados.push({ nombre, paso: false, detalles: err.message || String(err) });
    console.error(`\x1b[31m✘ [FALLIDA]\x1b[0m ${nombre}: ${err.message}`);
  }
}

async function runAllSecurityTests() {
  console.log('\n======================================================');
  console.log('  INICIANDO SUITE DE PRUEBAS DE SEGURIDAD ENTERPRISE');
  console.log('======================================================\n');

  // PRUEBA 1: Acceso anónimo rechazado (401) en todas las rutas privadas
  await ejecutarPrueba('1.1 Acceso anónimo a /api/clientes debe retornar 401', async () => {
    const res = await fetch(`${BASE_URL}/api/clientes`);
    if (res.status !== 401) {
      throw new Error(`Se esperaba 401 Unauthorized, pero se recibió ${res.status}`);
    }
  });

  await ejecutarPrueba('1.2 Acceso anónimo a /api/expedientes debe retornar 401', async () => {
    const res = await fetch(`${BASE_URL}/api/expedientes`);
    if (res.status !== 401) {
      throw new Error(`Se esperaba 401 Unauthorized, pero se recibió ${res.status}`);
    }
  });

  await ejecutarPrueba('1.3 Acceso anónimo a /api/dashboard/stats debe retornar 401', async () => {
    const res = await fetch(`${BASE_URL}/api/dashboard/stats`);
    if (res.status !== 401) {
      throw new Error(`Se esperaba 401 Unauthorized, pero se recibió ${res.status}`);
    }
  });

  await ejecutarPrueba('1.4 Acceso anónimo a /api/system/backup debe retornar 401', async () => {
    const res = await fetch(`${BASE_URL}/api/system/backup`);
    if (res.status !== 401) {
      throw new Error(`Se esperaba 401 Unauthorized, pero se recibió ${res.status}`);
    }
  });

  // PRUEBA 2: Manipulación de cabeceras manipulables (x-user-id) sin token es rechazada
  await ejecutarPrueba('2. Manipulación con header x-user-id: usr-jair-01 sin token debe retornar 401', async () => {
    const res = await fetch(`${BASE_URL}/api/clientes`, {
      headers: {
        'x-user-id': 'usr-jair-01',
      },
    });
    if (res.status !== 401) {
      throw new Error(`Vulnerabilidad: Se permitió acceso mediante header x-user-id. Código recibido: ${res.status}`);
    }
  });

  // PRUEBA 3: Intento de login con contraseña incorrecta es rechazado (401)
  await ejecutarPrueba('3. Inicio de sesión con clave incorrecta debe retornar 401', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'jairdiosdeher@gmail.com',
        password: 'ClaveTotalmenteIncorrecta123!',
      }),
    });
    if (res.status !== 401) {
      throw new Error(`Se esperaba 401 por credenciales incorrectas, se recibió ${res.status}`);
    }
  });

  // PRUEBA 4: Inicio de sesión válido con PBKDF2 emite token seguro
  let tokenAdmin = '';
  let tokenAsistente = '';
  let tokenExterno = '';

  await ejecutarPrueba('4.1 Login válido de Dr. Jair (ADMIN_TITULAR) genera token criptográfico', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'jairdiosdeher@gmail.com',
        password: 'AbogadoJair2026*!',
      }),
    });
    if (res.status !== 200) {
      throw new Error(`Fallo en login de admin: ${res.status}`);
    }
    const data = await res.json();
    if (!data.token || data.usuario.rol !== 'ADMIN_TITULAR') {
      throw new Error('No se recibió token o el rol del usuario no corresponde');
    }
    tokenAdmin = data.token;
  });

  await ejecutarPrueba('4.2 Login válido de Andrés Felipe (ASISTENTE_JUDICIAL)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'a.rojas@jairrestaura-demo.internal',
        password: 'Asistente2026*!',
      }),
    });
    if (res.status !== 200) throw new Error(`Fallo en login de asistente: ${res.status}`);
    const data = await res.json();
    tokenAsistente = data.token;
  });

  await ejecutarPrueba('4.3 Login válido de Dra. Camila (Firma Externa - Tenant org-externa-002)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'abogado.externo@firmaexterna-demo.internal',
        password: 'Externa2026*!',
      }),
    });
    if (res.status !== 200) throw new Error(`Fallo en login de firma externa: ${res.status}`);
    const data = await res.json();
    tokenExterno = data.token;
  });

  // PRUEBA 5: Control de Acceso por Roles (RBAC) en el Servidor
  await ejecutarPrueba('5.1 Asistente Judicial intentando exportar backup debe recibir 403 Forbidden', async () => {
    const res = await fetch(`${BASE_URL}/api/system/backup`, {
      headers: { Authorization: `Bearer ${tokenAsistente}` },
    });
    if (res.status !== 403) {
      throw new Error(`Se esperaba 403 Forbidden para rol no administrador, se recibió ${res.status}`);
    }
  });

  await ejecutarPrueba('5.2 Asistente Judicial intentando archivar cliente debe recibir 403 Forbidden', async () => {
    const res = await fetch(`${BASE_URL}/api/clientes/cli-andinas-01/archive`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAsistente}` },
    });
    if (res.status !== 403) {
      throw new Error(`Se esperaba 403 Forbidden al intentar archivar cliente sin rol ADMIN, se recibió ${res.status}`);
    }
  });

  await ejecutarPrueba('5.3 Admin Titular puede acceder a backup (200 OK)', async () => {
    const res = await fetch(`${BASE_URL}/api/system/backup`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    if (res.status !== 200) {
      throw new Error(`Admin titular no pudo acceder al backup: ${res.status}`);
    }
  });

  // PRUEBA 6: Aislamiento Multi-inquilino (Cross-Tenant Isolation)
  await ejecutarPrueba('6.1 Usuario de Firma Externa consultando expediente de JairRestaura recibe 403 Forbidden', async () => {
    // exp-2026-001 pertenece a org-jairrestaura-001, tokenExterno pertenece a org-externa-002
    const res = await fetch(`${BASE_URL}/api/expedientes/exp-2026-001`, {
      headers: { Authorization: `Bearer ${tokenExterno}` },
    });
    if (res.status !== 403) {
      throw new Error(`Vulnerabilidad de Tenant: Se esperaba 403 Cross-Tenant Forbidden, se recibió ${res.status}`);
    }
  });

  await ejecutarPrueba('6.2 Listado de clientes de Firma Externa solo incluye sus propios clientes aislados', async () => {
    const res = await fetch(`${BASE_URL}/api/clientes`, {
      headers: { Authorization: `Bearer ${tokenExterno}` },
    });
    if (res.status !== 200) throw new Error(`Fallo consultando clientes de tenant: ${res.status}`);
    const data = await res.json();
    const contieneClientesJair = data.clientes.some((c: any) => c.organizacionId === 'org-jairrestaura-001');
    if (contieneClientesJair) {
      throw new Error('Vulnerabilidad: El listado de clientes de la firma externa incluyó clientes de otra firma');
    }
  });

  // PRUEBA 7: Cierre formal de sesión y revocación de token
  await ejecutarPrueba('7. Logout revoca el token y llamadas posteriores reciben 401', async () => {
    const resLogout = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAsistente}` },
    });
    if (resLogout.status !== 200) throw new Error(`Fallo en logout: ${resLogout.status}`);

    const resCheck = await fetch(`${BASE_URL}/api/clientes`, {
      headers: { Authorization: `Bearer ${tokenAsistente}` },
    });
    if (resCheck.status !== 401) {
      throw new Error(`Vulnerabilidad: El token revocado sigue teniendo acceso (${resCheck.status})`);
    }
  });

  console.log('\n======================================================');
  console.log(`  RESULTADO: ${resultados.filter((r) => r.paso).length}/${resultados.length} PRUEBAS EXITOSAS`);
  console.log('======================================================\n');

  if (resultados.some((r) => !r.paso)) {
    process.exit(1);
  }
}

runAllSecurityTests().catch((e) => {
  console.error('Error fatal en ejecución de pruebas:', e);
  process.exit(1);
});
