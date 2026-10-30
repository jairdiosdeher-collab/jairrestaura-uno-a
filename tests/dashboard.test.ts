/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — SUITE DE PRUEBAS DEL PANEL PRINCIPAL Y COHERENCIA DE DATOS
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

async function runDashboardTests() {
  console.log('\n======================================================');
  console.log('  INICIANDO SUITE DE PRUEBAS DE COHERENCIA DEL DASHBOARD');
  console.log('======================================================\n');

  // Obtener token institucional mediante login criptográfico
  let headersAdmin: Record<string, string> = {};
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'jairdiosdeher@gmail.com',
      password: 'AbogadoJair2026*!',
    }),
  });
  if (loginRes.ok) {
    const loginData = await loginRes.json();
    headersAdmin = {
      'Authorization': `Bearer ${loginData.token}`,
      'x-user-id': 'usr-jair-01',
    };
  } else {
    headersAdmin = { 'x-user-id': 'usr-jair-01' };
  }

  let statsData: any = null;
  let expedientesData: any = null;
  let terminosData: any = null;
  let honorariosData: any = null;
  let clientesData: any = null;

  // PRUEBA 1: Carga de indicadores del Dashboard
  await ejecutarPrueba('1. GET /api/dashboard/stats responde 200 con estructura completa', async () => {
    const res = await fetch(`${BASE_URL}/api/dashboard/stats`, { headers: headersAdmin });
    if (res.status !== 200) {
      throw new Error(`Se esperaba 200 OK, pero se recibió ${res.status}`);
    }
    statsData = await res.json();
    if (typeof statsData.expedientesActivos !== 'number') {
      throw new Error('stats.expedientesActivos no es un número');
    }
    if (typeof statsData.terminosPendientesTotal !== 'number') {
      throw new Error('stats.terminosPendientesTotal no es un número');
    }
    if (typeof statsData.totalHonorariosPactados !== 'number') {
      throw new Error('stats.totalHonorariosPactados no es un número');
    }
    if (typeof statsData.saldoPorCobrar !== 'number') {
      throw new Error('stats.saldoPorCobrar no es un número');
    }
  });

  // PRUEBA 2: Carga de expedientes
  await ejecutarPrueba('2. GET /api/expedientes responde 200 y coincide con stats.expedientesActivos', async () => {
    const res = await fetch(`${BASE_URL}/api/expedientes`, { headers: headersAdmin });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    expedientesData = await res.json();
    const exps = expedientesData.expedientes || [];
    const activos = exps.filter((e: any) => e.estado !== 'ARCHIVADO' && e.estado !== 'TERMINADO_CONCILIACION').length;
    
    if (activos !== statsData.expedientesActivos) {
      throw new Error(`Discrepancia en expedientes activos: stats reporta ${statsData.expedientesActivos}, pero lista tiene ${activos}`);
    }
  });

  // PRUEBA 3: Carga de términos y coincidencia estricta
  await ejecutarPrueba('3. GET /api/terminos responde 200 y coincide con stats.terminosPendientesTotal', async () => {
    const res = await fetch(`${BASE_URL}/api/terminos`, { headers: headersAdmin });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    terminosData = await res.json();
    const terms = terminosData.terminos || [];
    const pendientes = terms.filter((t: any) => t.estado === 'PENDIENTE' || t.estado === 'VERIFICADO').length;

    if (pendientes !== statsData.terminosPendientesTotal) {
      throw new Error(`Discrepancia en términos pendientes: stats reporta ${statsData.terminosPendientesTotal}, pero lista tiene ${pendientes}`);
    }
  });

  // PRUEBA 4: Términos prioritarios y críticos
  await ejecutarPrueba('4. Cómputo de términos críticos es matemáticamente exacto', async () => {
    const terms = terminosData.terminos || [];
    const hoyStr = new Date().toISOString().split('T')[0];
    const criticos = terms.filter(
      (t: any) => (t.estado === 'PENDIENTE' || t.estado === 'VERIFICADO') &&
                  (t.fechaVencimientoCalculada <= hoyStr || t.prioridad === 'ALTA')
    ).length;

    if (criticos !== statsData.terminosCriticosTotal) {
      throw new Error(`Discrepancia en términos críticos: stats reporta ${statsData.terminosCriticosTotal}, pero conteo exacto da ${criticos}`);
    }
  });

  // PRUEBA 5: Honorarios sin duplicación y saldo coherente
  await ejecutarPrueba('5. Fórmulas de honorarios (Pactado, Recaudado y Saldo) son exactas', async () => {
    const res = await fetch(`${BASE_URL}/api/honorarios`, { headers: headersAdmin });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    honorariosData = await res.json();
    const hons = honorariosData.honorarios || [];

    const sumaPactados = hons.reduce((acc: number, h: any) => acc + (h.valorAcordadoCOP || 0), 0);
    const sumaRecaudados = hons.reduce((acc: number, h: any) => acc + (h.valorPagadoCOP || 0), 0);
    const saldoEsperado = sumaPactados - sumaRecaudados;

    if (sumaPactados !== statsData.totalHonorariosPactados) {
      throw new Error(`Honorarios pactados divergen: stats reporta ${statsData.totalHonorariosPactados}, suma real es ${sumaPactados}`);
    }
    if (sumaRecaudados !== statsData.totalHonorariosRecaudados) {
      throw new Error(`Honorarios recaudados divergen: stats reporta ${statsData.totalHonorariosRecaudados}, suma real es ${sumaRecaudados}`);
    }
    if (saldoEsperado !== statsData.saldoPorCobrar) {
      throw new Error(`Saldo por cobrar divergen: stats reporta ${statsData.saldoPorCobrar}, fórmula da ${saldoEsperado}`);
    }
  });

  // PRUEBA 6: Clientes y Habeas Data
  await ejecutarPrueba('6. Clientes registrados coinciden con stats.totalClientes', async () => {
    const res = await fetch(`${BASE_URL}/api/clientes`, { headers: headersAdmin });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    clientesData = await res.json();
    const clis = clientesData.clientes || [];
    const activos = clis.filter((c: any) => c.estado === 'ACTIVO').length;

    if (activos !== statsData.totalClientes) {
      throw new Error(`Clientes activos divergen: stats reporta ${statsData.totalClientes}, suma real es ${activos}`);
    }
  });

  // PRUEBA 7: Confirmación de término mediante endpoint compatible
  await ejecutarPrueba('7. POST /api/terminos/:id/confirm confirma término correctamente', async () => {
    const terms = terminosData.terminos || [];
    const termSinConfirmar = terms.find((t: any) => !t.calculoConfirmadoPorAbogado);
    if (termSinConfirmar) {
      const res = await fetch(`${BASE_URL}/api/terminos/${termSinConfirmar.id}/confirm`, {
        method: 'POST',
        headers: {
          ...headersAdmin,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ abogadoNombre: 'Dr. Jair' }),
      });
      if (res.status !== 200) {
        throw new Error(`Confirmación falló con status ${res.status}`);
      }
      const data = await res.json();
      if (!data.termino.calculoConfirmadoPorAbogado || data.termino.estado !== 'VERIFICADO') {
        throw new Error('El término no quedó con estado VERIFICADO ni confirmación afirmativa');
      }
    }
  });

  // PRUEBA 8: Próximos términos en el dashboard vienen ordenados cronológicamente
  await ejecutarPrueba('8. stats.proximosTerminos están ordenados por vencimiento ascendente', async () => {
    const res = await fetch(`${BASE_URL}/api/dashboard/stats`, { headers: headersAdmin });
    const data = await res.json();
    const prox = data.proximosTerminos || [];
    for (let i = 0; i < prox.length - 1; i++) {
      if (prox[i].fechaVencimientoCalculada > prox[i + 1].fechaVencimientoCalculada) {
        throw new Error(`Ordenamiento cronológico incorrecto: ${prox[i].fechaVencimientoCalculada} posterior a ${prox[i + 1].fechaVencimientoCalculada}`);
      }
    }
  });

  // Resumen final
  const total = resultados.length;
  const aprobadas = resultados.filter((r) => r.paso).length;
  const fallidas = total - aprobadas;

  console.log('\n======================================================');
  console.log(`  RESUMEN DE PRUEBAS: ${aprobadas}/${total} APROBADAS (${fallidas} fallidas)`);
  console.log('======================================================\n');

  if (fallidas > 0) {
    process.exit(1);
  }
}

runDashboardTests().catch((e) => {
  console.error('Error fatal ejecutando pruebas:', e);
  process.exit(1);
});
