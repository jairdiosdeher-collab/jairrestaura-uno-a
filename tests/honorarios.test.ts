/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — SUITE DE PRUEBAS DE HONORARIOS Y PAGOS
 * Verificación contable, contractual y aritmética de saldos
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

async function runHonorariosTests() {
  console.log('\n======================================================');
  console.log('  INICIANDO SUITE DE PRUEBAS DE HONORARIOS Y RECAUDO');
  console.log('  JAIRRESTAURA UNO A — GESTIÓN FINANCIERA JURÍDICA');
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

  let idHonorarioCreado: string | null = null;
  const testMontoAcordado = 20000000; // 20 millones COP
  const testAbono1 = 5000000; // 5 millones COP

  // PRUEBA 1: Consulta de acuerdos de honorarios
  await ejecutarPrueba('1. GET /api/honorarios responde 200 con listado financiero de la firma', async () => {
    const res = await fetch(`${BASE_URL}/api/honorarios`, { headers: headersAdmin });
    if (res.status !== 200) {
      throw new Error(`Se esperaba status 200, pero se recibió ${res.status}`);
    }
    const data = await res.json();
    if (!Array.isArray(data.honorarios)) {
      throw new Error('La respuesta debe contener la propiedad "honorarios" como arreglo');
    }
  });

  // PRUEBA 2: Registro de nuevo acuerdo de honorarios
  await ejecutarPrueba('2. POST /api/honorarios crea acuerdo con saldo inicial igual al valor pactado', async () => {
    const payload = {
      clienteId: 'cli-andinas-01',
      clienteNombre: 'Inversiones Ficticias Andinas S.A.S.',
      expedienteId: 'exp-2026-001',
      expedienteCodigo: 'EXP-2026-001',
      concepto: 'Representación en recurso extraordinario de casación',
      modalidad: 'FIJO_POR_ETAPAS',
      valorAcordadoCOP: testMontoAcordado,
      fechaAcuerdo: new Date().toISOString().split('T')[0],
    };

    const res = await fetch(`${BASE_URL}/api/honorarios`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify(payload),
    });

    if (res.status !== 201) {
      const err = await res.text();
      throw new Error(`Se esperaba 201 Created, se recibió ${res.status}: ${err}`);
    }

    const data = await res.json();
    if (!data.honorario || !data.honorario.id) {
      throw new Error('La respuesta no incluye el honorario creado con su ID');
    }
    if (data.honorario.valorAcordadoCOP !== testMontoAcordado) {
      throw new Error('El valor acordado no coincide con el registrado');
    }
    if (data.honorario.saldoPendienteCOP !== testMontoAcordado) {
      throw new Error('El saldo inicial debe ser igual al valor pactado');
    }
    if (data.honorario.valorPagadoCOP !== 0) {
      throw new Error('El valor pagado inicial debe ser 0');
    }
    idHonorarioCreado = data.honorario.id;
  });

  // PRUEBA 3: Registro de abono y recálculo automático de saldo
  await ejecutarPrueba('3. POST /api/honorarios/:id/pagos registra abono y descuenta saldo pendiente', async () => {
    if (!idHonorarioCreado) throw new Error('No se dispone de honorario creado');

    const pagoPayload = {
      montoCOP: testAbono1,
      medioPago: 'TRANSFERENCIA_BANCARIA',
      numeroComprobante: 'TRANS-TEST-0099',
      verificadoPorContabilidad: true,
      fechaPago: new Date().toISOString().split('T')[0],
    };

    const res = await fetch(`${BASE_URL}/api/honorarios/${idHonorarioCreado}/pagos`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify(pagoPayload),
    });

    if (res.status !== 201) {
      const err = await res.text();
      throw new Error(`Se esperaba 201 Created, se recibió ${res.status}: ${err}`);
    }

    const data = await res.json();
    if (data.honorario.valorPagadoCOP !== testAbono1) {
      throw new Error(`Se esperaba valorPagadoCOP = ${testAbono1}, se recibió ${data.honorario.valorPagadoCOP}`);
    }
    const saldoEsperado = testMontoAcordado - testAbono1;
    if (data.honorario.saldoPendienteCOP !== saldoEsperado) {
      throw new Error(`Se esperaba saldoPendienteCOP = ${saldoEsperado}, se recibió ${data.honorario.saldoPendienteCOP}`);
    }
    if (data.honorario.estado !== 'PARCIAL') {
      throw new Error(`Se esperaba estado 'PARCIAL', se recibió '${data.honorario.estado}'`);
    }
  });

  // PRUEBA 4: Rechazo de pago con monto inválido (<= 0)
  await ejecutarPrueba('4. POST /api/honorarios/:id/pagos rechaza abonos de cero o negativos con 400', async () => {
    if (!idHonorarioCreado) throw new Error('No se dispone de honorario creado');

    const res = await fetch(`${BASE_URL}/api/honorarios/${idHonorarioCreado}/pagos`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ montoCOP: 0 }),
    });

    if (res.status !== 400) {
      throw new Error(`Se esperaba 400 Bad Request por monto <= 0, se recibió ${res.status}`);
    }
  });

  // PRUEBA 5: Acceso anónimo denegado (401)
  await ejecutarPrueba('5. Acceso anónimo a /api/honorarios retorna 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/api/honorarios`);
    if (res.status !== 401) {
      throw new Error(`Se esperaba 401 Unauthorized, se recibió ${res.status}`);
    }
  });

  // RESUMEN FINAL
  console.log('\n------------------------------------------------------');
  console.log('  RESUMEN DE PRUEBAS DE HONORARIOS Y RECAUDO');
  console.log('------------------------------------------------------');
  const aprobadas = resultados.filter((r) => r.paso).length;
  const fallidas = resultados.filter((r) => !r.paso).length;
  console.log(`Total pruebas: ${resultados.length}`);
  console.log(`\x1b[32mAprobadas: ${aprobadas}\x1b[0m`);
  if (fallidas > 0) {
    console.log(`\x1b[31mFallidas: ${fallidas}\x1b[0m`);
    process.exit(1);
  } else {
    console.log(`\x1b[32m✔ TODAS LAS PRUEBAS DE HONORARIOS PASARON CON ÉXITO\x1b[0m\n`);
  }
}

runHonorariosTests().catch((e) => {
  console.error('Error fatal en suite de honorarios:', e);
  process.exit(1);
});
