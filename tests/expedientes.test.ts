/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — SUITE DE PRUEBAS DE EXPEDIENTES Y GESTIÓN PROCESAL
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

async function runExpedientesTests() {
  console.log('\n======================================================');
  console.log('  INICIANDO SUITE DE PRUEBAS DE EXPEDIENTES PROCESALES');
  console.log('  JAIRRESTAURA UNO A — CGP / CPACA Y ACTUACIONES');
  console.log('======================================================\n');

  // Autenticación como Admin Titular (Dr. Jair)
  let headersAdmin: Record<string, string> = {};
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'jairdiosdeher@gmail.com',
      password: 'AbogadoJair2026*!',
    }),
  });

  let adminOrgId = 'org-jairrestaura-001';
  if (loginRes.ok) {
    const loginData = await loginRes.json();
    adminOrgId = loginData.usuario?.organizacionId || 'org-jairrestaura-001';
    headersAdmin = {
      'Authorization': `Bearer ${loginData.token}`,
      'Content-Type': 'application/json',
      'x-user-id': 'usr-jair-01',
      'x-organizacion-id': adminOrgId,
    };
  } else {
    headersAdmin = {
      'Authorization': 'Bearer jairrestaura-demo-session-token-2026',
      'Content-Type': 'application/json',
      'x-user-id': 'usr-jair-01',
      'x-organizacion-id': adminOrgId,
    };
  }

  const testTimestamp = Date.now();
  let expIdCreado: string | null = null;

  // PRUEBA 1: Consulta de expedientes autorizada
  await ejecutarPrueba('1. GET /api/expedientes retorna 200 con listado procesal', async () => {
    const res = await fetch(`${BASE_URL}/api/expedientes`, { headers: headersAdmin });
    if (res.status !== 200) {
      throw new Error(`Se esperaba 200, se recibió ${res.status}`);
    }
    const data = await res.json();
    if (!Array.isArray(data.expedientes)) {
      throw new Error('La respuesta debe contener la propiedad "expedientes" como arreglo');
    }
  });

  // PRUEBA 2: Creación de nuevo expediente judicial
  await ejecutarPrueba('2. POST /api/expedientes crea nuevo expediente procesal con radicación', async () => {
    const payload = {
      codigoInterno: `EXP-TEST-${String(testTimestamp).slice(-5)}`,
      radicadoJudicial23Digitos: '11001400300120260012300',
      clienteId: 'cli-andinas-01',
      autoridadODespacho: 'Juzgado 01 Civil del Circuito de Bogotá',
      ciudadDespacho: 'Bogotá D.C.',
      areaJuridica: 'CIVIL',
      tipoProceso: 'Verbal Ordinario de Responsabilidad Civil',
      pretensionPrincipal: 'Indemnización de perjuicios contractuales y daño emergente',
      sintesisHechos: 'Incumplimiento contractual en contrato de suministro comercial suscrito en 2025.',
      cuantiaEstimadaCOP: 150000000,
      partes: {
        demandantes: [{ nombre: 'Inversiones Ficticias Andinas S.A.S.', identificacion: '900.000.002-1' }],
        demandados: [{ nombre: 'Constructora Ejemplo S.A.', identificacion: '900.123.456-7' }],
      },
      estado: 'ACTIVO',
    };

    const res = await fetch(`${BASE_URL}/api/expedientes`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify(payload),
    });

    if (res.status !== 201) {
      const err = await res.text();
      throw new Error(`Se esperaba 201 Created, se recibió ${res.status}: ${err}`);
    }

    const data = await res.json();
    if (!data.expediente || !data.expediente.id) {
      throw new Error('La respuesta no incluye el expediente creado con ID');
    }
    expIdCreado = data.expediente.id;
  });

  // PRUEBA 3: Registro de actuación procesal en el cuaderno del expediente
  await ejecutarPrueba('3. POST /api/expedientes/:id/actuaciones anota providencia procesal', async () => {
    if (!expIdCreado) throw new Error('No se dispone de ID de expediente creado');

    const actuacionPayload = {
      fechaActuacion: new Date().toISOString().split('T')[0],
      tipoProvidencia: 'AUTO_ADMITE_DEMANDA',
      anotacion: 'Juzgado admite demanda y ordena correr traslado conforme al Art. 91 del CGP',
      cuaderno: 'Cuaderno Principal No. 1',
      anotacionPrivada: 'Verificar término de 20 días para contestación',
    };

    const res = await fetch(`${BASE_URL}/api/expedientes/${expIdCreado}/actuaciones`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify(actuacionPayload),
    });

    if (res.status !== 201) {
      const err = await res.text();
      throw new Error(`Se esperaba 201 Created, se recibió ${res.status}: ${err}`);
    }

    const data = await res.json();
    if (!data.actuacion || data.actuacion.tipoProvidencia !== 'AUTO_ADMITE_DEMANDA') {
      throw new Error('La actuación no se registró con el tipo de providencia indicado');
    }
  });

  // PRUEBA 4: Validación de campos obligatorios al crear expediente (400 Bad Request)
  await ejecutarPrueba('4. POST /api/expedientes rechaza creación sin clienteId o tipoProceso con 400', async () => {
    const payloadInvalido = {
      codigoInterno: 'EXP-INVALID',
      // clienteId omitido
      areaJuridica: 'CIVIL',
    };

    const res = await fetch(`${BASE_URL}/api/expedientes`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify(payloadInvalido),
    });

    if (res.status !== 400) {
      throw new Error(`Se esperaba 400 Bad Request, se recibió ${res.status}`);
    }
  });

  // PRUEBA 5: Aislamiento Tenant (No permite crear expediente en cliente ajeno o inexistente)
  await ejecutarPrueba('5. POST /api/expedientes rechaza asignación a cliente de otra organización', async () => {
    const payloadCrossTenant = {
      codigoInterno: 'EXP-CROSS-TENANT',
      clienteId: 'cli-externo-99', // Cliente de org-externa-002
      areaJuridica: 'COMERCIAL',
      tipoProceso: 'Arbitraje Comercial',
      sintesisHechos: 'Disputa entre accionistas extranjeros',
    };

    const res = await fetch(`${BASE_URL}/api/expedientes`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify(payloadCrossTenant),
    });

    if (res.status !== 400 && res.status !== 403) {
      throw new Error(`Se esperaba 400 o 403 para cliente ajeno, se recibió ${res.status}`);
    }
  });

  // PRUEBA 6: Acceso anónimo denegado (401 Unauthorized)
  await ejecutarPrueba('6. Acceso sin token Bearer a /api/expedientes retorna 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/api/expedientes`);
    if (res.status !== 401) {
      throw new Error(`Se esperaba 401 Unauthorized, se recibió ${res.status}`);
    }
  });

  // RESUMEN FINAL
  console.log('\n------------------------------------------------------');
  console.log('  RESUMEN DE PRUEBAS DE EXPEDIENTES PROCESALES');
  console.log('------------------------------------------------------');
  const aprobadas = resultados.filter((r) => r.paso).length;
  const fallidas = resultados.filter((r) => !r.paso).length;
  console.log(`Total pruebas: ${resultados.length}`);
  console.log(`\x1b[32mAprobadas: ${aprobadas}\x1b[0m`);
  if (fallidas > 0) {
    console.log(`\x1b[31mFallidas: ${fallidas}\x1b[0m`);
    process.exit(1);
  } else {
    console.log(`\x1b[32m✔ TODAS LAS PRUEBAS DE EXPEDIENTES PASARON CON ÉXITO\x1b[0m\n`);
  }
}

runExpedientesTests().catch((e) => {
  console.error('Error fatal en suite de expedientes:', e);
  process.exit(1);
});
