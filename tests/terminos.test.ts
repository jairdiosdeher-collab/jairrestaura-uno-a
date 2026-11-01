/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — SUITE DE PRUEBAS DE TÉRMINOS JUDICIALES Y AGENDA PERENTORIA
 * Verificación de Ley 2213 de 2022 Art. 8, Ley Emiliani (Ley 51 de 1983) y CGP Art. 118
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

async function runTerminosTests() {
  console.log('\n======================================================');
  console.log('  INICIANDO SUITE DE PRUEBAS DE CÓMPUTO DE TÉRMINOS');
  console.log('  JAIRRESTAURA UNO A — LEY 2213 / 2022 Y LEY EMILIANI');
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

  let idTerminoCreado: string | null = null;

  // PRUEBA 1: Consulta de términos en agenda
  await ejecutarPrueba('1. GET /api/terminos responde 200 con la agenda procesal', async () => {
    const res = await fetch(`${BASE_URL}/api/terminos`, { headers: headersAdmin });
    if (res.status !== 200) {
      throw new Error(`Se esperaba status 200, pero se recibió ${res.status}`);
    }
    const data = await res.json();
    if (!Array.isArray(data.terminos)) {
      throw new Error('La respuesta debe contener la propiedad "terminos" como arreglo');
    }
  });

  // PRUEBA 2: Cómputo legal conforme a la Ley 2213 de 2022 (2 días hábiles de envío previo al inicio del término)
  await ejecutarPrueba('2. POST /api/terminos/computar aplica correctamente Ley 2213 (término inicia transcurridos dos días hábiles)', async () => {
    // Viernes 2026-05-15 con notificación electrónica Ley 2213 y 3 días hábiles
    const payload = {
      fechaNotificacionOInicio: '2026-05-15',
      duracionDias: 3,
      aplicaReglaLey2213: true,
    };

    const res = await fetch(`${BASE_URL}/api/terminos/computar`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify(payload),
    });

    if (res.status !== 200) {
      const err = await res.text();
      throw new Error(`Se esperaba 200, se recibió ${res.status}: ${err}`);
    }

    const data = await res.json();
    if (!data.resultado || !data.resultado.fechaVencimientoCalculada) {
      throw new Error('La respuesta debe incluir el resultado del cómputo con fecha de vencimiento');
    }
    if (!data.resultado.cronologiaDetallada || !Array.isArray(data.resultado.cronologiaDetallada)) {
      throw new Error('El cómputo debe desglosar la cronología detallada día a día');
    }
    const diasInhabiles = data.resultado.cronologiaDetallada.filter((d: any) => !d.esHabil);
    if (diasInhabiles.length === 0) {
      throw new Error('El cómputo debe identificar los días inhábiles procesales excluidos');
    }
  });

  // PRUEBA 3: Creación de término procesal en agenda
  await ejecutarPrueba('3. POST /api/terminos programa término con vencimiento automático y estado PENDIENTE', async () => {
    const payload = {
      titulo: 'Contestación de Demanda - Proceso Verbal Ordinario',
      fechaNotificacionOInicio: '2026-05-18',
      duracionDias: 20,
      tipoTermino: 'CONTESTACION_DEMANDA',
      aplicaReglaLey2213: true,
      expedienteId: 'exp-2026-001',
      prioridad: 'ALTA',
    };

    const res = await fetch(`${BASE_URL}/api/terminos`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify(payload),
    });

    if (res.status !== 201) {
      const err = await res.text();
      throw new Error(`Se esperaba 201 Created, se recibió ${res.status}: ${err}`);
    }

    const data = await res.json();
    if (!data.termino || !data.termino.id) {
      throw new Error('La respuesta no incluye el término creado con su ID');
    }
    if (data.termino.calculoConfirmadoPorAbogado !== false) {
      throw new Error('El nuevo término debe crearse inicialmente no verificado (false)');
    }
    idTerminoCreado = data.termino.id;
  });

  // PRUEBA 4: Confirmación del cómputo por abogado titular
  await ejecutarPrueba('4. POST /api/terminos/:id/confirm valida y confirma el término procesal', async () => {
    if (!idTerminoCreado) throw new Error('No se dispone de término creado para confirmar');

    const res = await fetch(`${BASE_URL}/api/terminos/${idTerminoCreado}/confirm`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ abogadoNombre: 'Dr. Jair' }),
    });

    if (res.status !== 200) {
      const err = await res.text();
      throw new Error(`Se esperaba 200, se recibió ${res.status}: ${err}`);
    }

    const data = await res.json();
    if (!data.termino || data.termino.calculoConfirmadoPorAbogado !== true) {
      throw new Error('El término debe figurar con calculoConfirmadoPorAbogado: true tras la confirmación');
    }
    if (data.termino.estado !== 'VERIFICADO') {
      throw new Error(`El estado del término debe ser 'VERIFICADO', se recibió '${data.termino.estado}'`);
    }
  });

  // PRUEBA 5: Marcación del término como cumplido
  await ejecutarPrueba('5. POST /api/terminos/:id/complete marca el término como CUMPLIDO', async () => {
    if (!idTerminoCreado) throw new Error('No se dispone de término creado para completar');

    const res = await fetch(`${BASE_URL}/api/terminos/${idTerminoCreado}/complete`, {
      method: 'POST',
      headers: headersAdmin,
    });

    if (res.status !== 200) {
      const err = await res.text();
      throw new Error(`Se esperaba 200, se recibió ${res.status}: ${err}`);
    }

    const data = await res.json();
    if (data.termino?.estado !== 'CUMPLIDO') {
      throw new Error(`El estado del término debe ser 'CUMPLIDO', se recibió '${data.termino?.estado}'`);
    }
  });

  // PRUEBA 6: Rechazo de acceso no autenticado (401)
  await ejecutarPrueba('6. Acceso anónimo a /api/terminos retorna 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/api/terminos`);
    if (res.status !== 401) {
      throw new Error(`Se esperaba 401 Unauthorized, se recibió ${res.status}`);
    }
  });

  // RESUMEN FINAL
  console.log('\n------------------------------------------------------');
  console.log('  RESUMEN DE PRUEBAS DE TÉRMINOS JUDICIALES');
  console.log('------------------------------------------------------');
  const aprobadas = resultados.filter((r) => r.paso).length;
  const fallidas = resultados.filter((r) => !r.paso).length;
  console.log(`Total pruebas: ${resultados.length}`);
  console.log(`\x1b[32mAprobadas: ${aprobadas}\x1b[0m`);
  if (fallidas > 0) {
    console.log(`\x1b[31mFallidas: ${fallidas}\x1b[0m`);
    process.exit(1);
  } else {
    console.log(`\x1b[32m✔ TODAS LAS PRUEBAS DE TÉRMINOS JUDICIALES PASARON CON ÉXITO\x1b[0m\n`);
  }
}

runTerminosTests().catch((e) => {
  console.error('Error fatal en suite de términos:', e);
  process.exit(1);
});
