/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — SUITE DE PRUEBAS DEL DIRECTORIO DE CLIENTES Y LEY 1581 HABEAS DATA
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

async function runClientesTests() {
  console.log('\n======================================================');
  console.log('  INICIANDO SUITE DE PRUEBAS DEL DIRECTORIO DE CLIENTES');
  console.log('  JAIRRESTAURA UNO A — LEY 1581 DE 2012 Y PERSISTENCIA');
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

  // Identificador de prueba único para no colisionar
  const testTimestamp = Date.now();
  const testCedulaNatural = `80${String(testTimestamp).slice(-6)}`;
  const testNitJuridica = `901${String(testTimestamp).slice(-6)}`;
  let idClienteCreadoNatural: string | null = null;
  let idClienteCreadoJuridica: string | null = null;

  // PRUEBA 1: Consulta de clientes para usuario autenticado
  await ejecutarPrueba('1. GET /api/clientes responde 200 con listado filtrado por organización', async () => {
    const res = await fetch(`${BASE_URL}/api/clientes`, {
      headers: headersAdmin,
    });
    if (res.status !== 200) {
      throw new Error(`Se esperaba status 200, pero se recibió ${res.status}`);
    }
    const data = await res.json();
    if (!Array.isArray(data.clientes)) {
      throw new Error('La respuesta debe contener la propiedad "clientes" como arreglo');
    }
    if (data.clientes.length === 0) {
      throw new Error('El listado debe contener al menos los clientes semilla de demostración');
    }
  });

  // PRUEBA 2: Registro exitoso de Persona Natural con Habeas Data autorizado
  await ejecutarPrueba('2. POST /api/clientes crea Persona Natural con Habeas Data autorizado', async () => {
    const payload = {
      tipoPersona: 'NATURAL',
      tipoIdentificacion: 'CC',
      numeroIdentificacion: testCedulaNatural,
      nombreCompletoORazonSocial: `Cliente Prueba Natural ${testTimestamp}`,
      emailPrincipal: `natural_${testTimestamp}@prueba-jairrestaura.com`,
      emailNotificacionesJudiciales: `notif_${testTimestamp}@prueba-jairrestaura.com`,
      telefono: '+57 310 999 8877',
      direccion: 'Carrera 15 No. 85-30, Oficina 401',
      ciudad: 'Bogotá D.C.',
      departamento: 'Cundinamarca',
      notasInternas: 'Cliente de prueba automatizada',
      consentimientoLey1581: {
        autorizado: true,
        fechaAutorizacion: new Date().toISOString(),
        canalAutorizacion: 'DIGITAL_APP',
        finalidadTratamiento: 'Gestión procesal conforme a Ley 1581 de 2012',
      },
    };

    const res = await fetch(`${BASE_URL}/api/clientes`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify(payload),
    });

    if (res.status !== 201) {
      const errText = await res.text();
      throw new Error(`Se esperaba 201 Created, pero se recibió ${res.status}: ${errText}`);
    }

    const data = await res.json();
    if (!data.cliente || !data.cliente.id) {
      throw new Error('La respuesta no incluye el cliente creado con su identificador único');
    }
    if (data.cliente.consentimientoLey1581?.autorizado !== true) {
      throw new Error('El consentimiento de Habeas Data debe estar registrado como autorizado: true');
    }
    idClienteCreadoNatural = data.cliente.id;
  });

  // PRUEBA 3: Registro exitoso de Persona Jurídica con Representante Legal
  await ejecutarPrueba('3. POST /api/clientes crea Persona Jurídica con datos de Representante Legal', async () => {
    const payload = {
      tipoPersona: 'JURIDICA',
      tipoIdentificacion: 'NIT',
      numeroIdentificacion: testNitJuridica,
      dv: '7',
      nombreCompletoORazonSocial: `Comercializadora Prueba S.A.S. ${testTimestamp}`,
      representanteLegal: {
        nombre: 'Dra. María Claudia Restrepo Gómez',
        tipoIdentificacion: 'CC',
        numeroIdentificacion: '52.123.456',
        cargo: 'Gerente General y Representante Legal',
      },
      emailPrincipal: `comercial_${testTimestamp}@prueba-jairrestaura.com`,
      emailNotificacionesJudiciales: `judicial_${testTimestamp}@prueba-jairrestaura.com`,
      telefono: '+57 601 222 3344',
      direccion: 'Calle 72 No. 10-07, Piso 8',
      ciudad: 'Bogotá D.C.',
      departamento: 'Cundinamarca',
      consentimientoLey1581: {
        autorizado: false,
        canalAutorizacion: 'PENDIENTE',
        finalidadTratamiento: 'Pendiente de suscripción física',
      },
    };

    const res = await fetch(`${BASE_URL}/api/clientes`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify(payload),
    });

    if (res.status !== 201) {
      const errText = await res.text();
      throw new Error(`Se esperaba 201 Created, pero se recibió ${res.status}: ${errText}`);
    }

    const data = await res.json();
    if (!data.cliente?.representanteLegal?.nombre) {
      throw new Error('El cliente persona jurídica debe contener el representante legal registrado');
    }
    if (data.cliente.consentimientoLey1581?.autorizado !== false) {
      throw new Error('El estado de Habeas Data debe ser false (pendiente) cuando no se autoriza');
    }
    idClienteCreadoJuridica = data.cliente.id;
  });

  // PRUEBA 4: Detección y rechazo de duplicados por número de identificación (409 Conflict)
  await ejecutarPrueba('4. POST /api/clientes rechaza duplicados con 409 Conflict y código CLIENT_ALREADY_EXISTS', async () => {
    const payloadDuplicado = {
      tipoPersona: 'NATURAL',
      tipoIdentificacion: 'CC',
      numeroIdentificacion: testCedulaNatural, // Misma cédula que la prueba 2
      nombreCompletoORazonSocial: 'Intento Duplicado Mismo Documento',
      emailPrincipal: 'duplicado@prueba.com',
    };

    const res = await fetch(`${BASE_URL}/api/clientes`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify(payloadDuplicado),
    });

    if (res.status !== 409) {
      throw new Error(`Se esperaba 409 Conflict para documento duplicado, pero se recibió ${res.status}`);
    }

    const data = await res.json();
    if (data.codigo !== 'CLIENT_ALREADY_EXISTS') {
      throw new Error(`Se esperaba código 'CLIENT_ALREADY_EXISTS', se recibió '${data.codigo}'`);
    }
  });

  // PRUEBA 5: Validación de campos obligatorios (400 Bad Request)
  await ejecutarPrueba('5. POST /api/clientes exige nombre e identificación con 400 Bad Request', async () => {
    const payloadIncompleto = {
      tipoPersona: 'NATURAL',
      tipoIdentificacion: 'CC',
      // numeroIdentificacion omitido intencionalmente
      nombreCompletoORazonSocial: '',
      emailPrincipal: 'incompleto@prueba.com',
    };

    const res = await fetch(`${BASE_URL}/api/clientes`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify(payloadIncompleto),
    });

    if (res.status !== 400) {
      throw new Error(`Se esperaba 400 Bad Request por campos faltantes, pero se recibió ${res.status}`);
    }
  });

  // PRUEBA 6: Validación de formato de correo electrónico
  await ejecutarPrueba('6. POST /api/clientes rechaza formato de correo electrónico inválido con 400 Bad Request', async () => {
    const payloadEmailInvalido = {
      tipoPersona: 'NATURAL',
      tipoIdentificacion: 'CC',
      numeroIdentificacion: `99${String(Date.now()).slice(-6)}`,
      nombreCompletoORazonSocial: 'Prueba Correo Inválido',
      emailPrincipal: 'correo-sin-arroba-ni-dominio',
    };

    const res = await fetch(`${BASE_URL}/api/clientes`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify(payloadEmailInvalido),
    });

    if (res.status !== 400) {
      throw new Error(`Se esperaba 400 Bad Request por sintaxis de correo, pero se recibió ${res.status}`);
    }
  });

  // PRUEBA 7: Exigencia de Representante Legal para Persona Jurídica
  await ejecutarPrueba('7. POST /api/clientes rechaza Persona Jurídica sin Representante Legal con 400 Bad Request', async () => {
    const payloadJuridicaSinRep = {
      tipoPersona: 'JURIDICA',
      tipoIdentificacion: 'NIT',
      numeroIdentificacion: `902${String(Date.now()).slice(-6)}`,
      dv: '1',
      nombreCompletoORazonSocial: 'Empresa Fantasma Sin Representante S.A.',
      emailPrincipal: 'contacto@empresafantasma.com',
      // representanteLegal omitido intencionalmente
    };

    const res = await fetch(`${BASE_URL}/api/clientes`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify(payloadJuridicaSinRep),
    });

    if (res.status !== 400) {
      throw new Error(`Se esperaba 400 Bad Request por falta de representante legal, pero se recibió ${res.status}`);
    }
  });

  // PRUEBA 8: Verificación de persistencia en la consulta general
  await ejecutarPrueba('8. GET /api/clientes comprueba que el nuevo cliente persiste y aparece en el listado', async () => {
    const res = await fetch(`${BASE_URL}/api/clientes?buscar=${testCedulaNatural}`, {
      headers: headersAdmin,
    });

    if (res.status !== 200) {
      throw new Error(`Se esperaba 200, se recibió ${res.status}`);
    }

    const data = await res.json();
    const clienteEncontrado = data.clientes.find((c: any) => c.numeroIdentificacion === testCedulaNatural);
    if (!clienteEncontrado) {
      throw new Error(`El cliente registrado con cédula ${testCedulaNatural} no fue encontrado en la base de datos`);
    }
    if (clienteEncontrado.nombreCompletoORazonSocial !== `Cliente Prueba Natural ${testTimestamp}`) {
      throw new Error('El nombre del cliente persistido no coincide con el enviado');
    }
  });

  // PRUEBA 9: Rechazo de acceso anónimo a /api/clientes (401 Unauthorized)
  await ejecutarPrueba('9. Acceso anónimo a /api/clientes retorna 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/api/clientes`);
    if (res.status !== 401) {
      throw new Error(`Se esperaba 401 Unauthorized, pero se recibió ${res.status}`);
    }
  });

  // PRUEBA 10: Aislamiento Tenant (No exponer clientes de otras organizaciones)
  await ejecutarPrueba('10. Aislamiento Multi-inquilino impide ver clientes de otras organizaciones', async () => {
    const res = await fetch(`${BASE_URL}/api/clientes`, {
      headers: headersAdmin,
    });
    const data = await res.json();
    // Ningún cliente en la respuesta debe tener organizacionId distinta a adminOrgId
    const clienteExtranjero = data.clientes.find((c: any) => c.organizacionId && c.organizacionId !== adminOrgId);
    if (clienteExtranjero) {
      throw new Error(`Fuga de datos de organización: se encontró el cliente ${clienteExtranjero.id} de organización ${clienteExtranjero.organizacionId}`);
    }
  });

  // RESUMEN FINAL
  console.log('\n------------------------------------------------------');
  console.log('  RESUMEN DE PRUEBAS DE CLIENTES (LEY 1581 HABEAS DATA)');
  console.log('------------------------------------------------------');
  const aprobadas = resultados.filter((r) => r.paso).length;
  const fallidas = resultados.filter((r) => !r.paso).length;
  console.log(`Total pruebas: ${resultados.length}`);
  console.log(`\x1b[32mAprobadas: ${aprobadas}\x1b[0m`);
  if (fallidas > 0) {
    console.log(`\x1b[31mFallidas: ${fallidas}\x1b[0m`);
    process.exit(1);
  } else {
    console.log(`\x1b[32m✔ TODAS LAS PRUEBAS DEL DIRECTORIO DE CLIENTES PASARON CON ÉXITO\x1b[0m\n`);
  }
}

runClientesTests().catch((e) => {
  console.error('Error fatal en suite de clientes:', e);
  process.exit(1);
});
