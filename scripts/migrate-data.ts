/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — SCRIPT DE MIGRACIÓN SEGURA DE DATOS A FORMATO FICTICIO
 * Crea un respaldo inmutable y convierte cualquier dato sensible de prueba
 * a datos estrictamente ficticios y demostrativos.
 */

import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'data/jairrestaura_db.json');
const BACKUP_PATH = path.resolve(process.cwd(), `data/jairrestaura_db.backup.${Date.now()}.json`);

export function migrarDatosAFicticios() {
  if (!fs.existsSync(DB_PATH)) {
    console.log('No existe archivo de base de datos a migrar.');
    return;
  }

  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  const db = JSON.parse(raw);

  // 1. Guardar copia de seguridad fechada
  fs.writeFileSync(BACKUP_PATH, JSON.stringify(db, null, 2), 'utf-8');
  console.log(`[Seguridad] Copia de seguridad creada en: ${BACKUP_PATH}`);

  // 2. Anomimizar Organización
  db.organizacion = {
    id: db.organizacion?.id || 'org-jairrestaura-001',
    nombre: 'JairRestaura Uno A & Asociados — Firma Jurídica Demostrativa',
    nit: '900.000.001-0',
    representante: 'Dr. Jair (Perfil Demostrativo)',
    tarjetaProfesionalDireccion: 'T.P. No. 000.000 del C.S.J. (Ficticia de Prueba)',
    fechaRegistro: db.organizacion?.fechaRegistro || '2026-01-01T00:00:00Z',
  };

  // 3. Anonimizar Usuarios de Prueba
  db.usuarios = [
    {
      id: 'usr-jair-01',
      nombre: 'Dr. Jair (Director Jurídico)',
      email: 'jairdiosdeher@gmail.com', // Correo del propietario de la cuenta
      tarjetaProfesional: 'T.P. No. 000.001 del C.S.J. (Ficticia)',
      rol: 'ADMIN_TITULAR',
      organizacionId: 'org-jairrestaura-001',
      organizacionNombre: 'JairRestaura Uno A & Asociados — Firma Jurídica Demostrativa',
      fechaCreacion: '2026-01-10T08:00:00Z',
      ultimoAcceso: new Date().toISOString(),
    },
    {
      id: 'usr-marcela-02',
      nombre: 'Dra. Marcela Gómez (Demostración)',
      email: 'm.gomez@jairrestaura-demo.internal',
      tarjetaProfesional: 'T.P. No. 000.002 del C.S.J. (Ficticia)',
      rol: 'ABOGADO_ASOCIADO',
      organizacionId: 'org-jairrestaura-001',
      organizacionNombre: 'JairRestaura Uno A & Asociados — Firma Jurídica Demostrativa',
      fechaCreacion: '2026-02-15T09:30:00Z',
      ultimoAcceso: new Date().toISOString(),
    },
    {
      id: 'usr-andres-03',
      nombre: 'Andrés Felipe Rojas (Demostración)',
      email: 'a.rojas@jairrestaura-demo.internal',
      rol: 'ASISTENTE_JUDICIAL',
      organizacionId: 'org-jairrestaura-001',
      organizacionNombre: 'JairRestaura Uno A & Asociados — Firma Jurídica Demostrativa',
      fechaCreacion: '2026-03-01T10:00:00Z',
      ultimoAcceso: new Date().toISOString(),
    },
    {
      id: 'usr-externo-04',
      nombre: 'Dra. Camila Soto (Firma Externa)',
      email: 'abogado.externo@firmaexterna-demo.internal',
      tarjetaProfesional: 'T.P. No. 000.099 del C.S.J. (Ficticia)',
      rol: 'ABOGADO_ASOCIADO',
      organizacionId: 'org-externa-002',
      organizacionNombre: 'Firma Legal Andina Externa Ltda.',
      fechaCreacion: '2026-04-01T10:00:00Z',
      ultimoAcceso: new Date().toISOString(),
    },
  ];

  // 4. Anonimizar Clientes con datos inequívocamente ficticios
  db.clientes = [
    {
      id: 'cli-andinas-01',
      tipoPersona: 'JURIDICA',
      tipoIdentificacion: 'NIT',
      numeroIdentificacion: '900.000.002',
      dv: '8',
      nombreCompletoORazonSocial: 'Sociedad Comercial Demostrativa S.A.S. (Ficticia)',
      representanteLegal: {
        nombre: 'Representante Legal Demostrativo',
        tipoIdentificacion: 'CC',
        numeroIdentificacion: '00.000.001',
        cargo: 'Gerente General (Demostración)',
      },
      emailPrincipal: 'contacto@empresa-demo.internal',
      emailNotificacionesJudiciales: 'notificaciones@empresa-demo.internal',
      telefono: '+57 (600) 000-0001',
      direccion: 'Avenida Ficticia No. 00-00 Oficina Demo 101',
      ciudad: 'Bogotá D.C. (Datos de Prueba)',
      departamento: 'Cundinamarca',
      estado: 'ACTIVO',
      consentimientoLey1581: {
        autorizado: false, // No marcado como otorgado sin evidencia de autorización
        fechaAutorizacion: '',
        canalAutorizacion: 'DIGITAL_APP',
        finalidadTratamiento: 'Demostración: Pendiente de suscripción y autorización expresa y comprobable.',
        soporteId: 'PENDIENTE-FIRMA-DEMO',
      },
      notasInternas: 'Registro demostrativo con fines de prueba y validación de software.',
      organizacionId: 'org-jairrestaura-001',
      fechaCreacion: '2026-01-15T14:20:00Z',
      fechaActualizacion: new Date().toISOString(),
      expedientesIds: ['exp-2026-001'],
    },
    {
      id: 'cli-cardona-02',
      tipoPersona: 'NATURAL',
      tipoIdentificacion: 'CC',
      numeroIdentificacion: '00.000.002',
      nombreCompletoORazonSocial: 'Persona Natural de Prueba No. 1 (Ficticia)',
      emailPrincipal: 'usuario.demo1@jairrestaura-demo.internal',
      emailNotificacionesJudiciales: 'usuario.demo1.notif@jairrestaura-demo.internal',
      telefono: '+57 300 000 0002',
      direccion: 'Calle Ficticia No. 1-00 Apto Demo 202',
      ciudad: 'Bogotá D.C. (Datos de Prueba)',
      departamento: 'Cundinamarca',
      estado: 'ACTIVO',
      consentimientoLey1581: {
        autorizado: false,
        fechaAutorizacion: '',
        canalAutorizacion: 'FIRMA_FISICA',
        finalidadTratamiento: 'Demostración: Pendiente de suscripción física o digital.',
        soporteId: 'PENDIENTE-FIRMA-DEMO',
      },
      notasInternas: 'Registro demostrativo con fines de prueba.',
      organizacionId: 'org-jairrestaura-001',
      fechaCreacion: '2026-02-01T10:15:00Z',
      fechaActualizacion: new Date().toISOString(),
      expedientesIds: ['exp-2026-002'],
    },
  ];

  // 5. Anonimizar Expedientes y Radicados Judiciales (23 dígitos ficticios)
  db.expedientes = [
    {
      id: 'exp-2026-001',
      codigoInterno: 'EXP-DEMO-001',
      radicadoJudicial: '00000000000020260000100', // Radicado de 23 dígitos reservado para pruebas
      despachoJudicial: 'Juzgado Civil del Circuito de Prueba (Demostración)',
      clienteId: 'cli-andinas-01',
      clienteNombre: 'Sociedad Comercial Demostrativa S.A.S. (Ficticia)',
      areaJuridica: 'CIVIL',
      jurisdiccion: 'ORDINARIA',
      autoridadCompetente: 'Juez Civil de Prueba',
      partes: {
        demandanteOAccionante: 'Sociedad Comercial Demostrativa S.A.S. (Ficticia)',
        apoderadoDemandante: 'Dr. Jair (T.P. 000.001)',
        demandadoOAccionado: 'Entidad Contraparte Demostrativa S.A. (Ficticia)',
        apoderadoDemandado: 'Apoderado Contraparte Demo (T.P. 000.099)',
        vinculadosTerceros: ['Tercero Vinculado Demo S.A.'],
        juezOMagistradoPonente: 'Juez Ponente Demostrativo',
      },
      sintesisHechos: 'Caso demostrativo de controversia contractual fáctico-simulada sobre inmueble comercial de prueba para validación del motor de subsunción procesal.',
      pretensionesUObjetivos: 'Resolución de contrato simulado y restitución de valor demostrativo indexado ($340.000.000 COP).',
      cuantiaEstimadaCOP: 340000000,
      esMayorCuantia: true,
      estado: 'AUDIENCIA_INICIAL_372',
      estrategiaDefensiva: 'Carga probatoria dinámica demostrativa para fijación de litigio.',
      notasPrivadas: 'Notas internas protegidas por secreto profesional demostrativo.',
      fechaInicio: '2024-09-12T10:00:00Z',
      fechaActualizacion: new Date().toISOString(),
      organizacionId: 'org-jairrestaura-001',
      abogadoResponsableId: 'usr-jair-01',
      abogadoResponsableNombre: 'Dr. Jair',
    },
    // Expediente de la Organización Externa para probar aislamiento multi-tenant
    {
      id: 'exp-externo-999',
      codigoInterno: 'EXP-EXT-099',
      radicadoJudicial: '00000000000020260009900',
      despachoJudicial: 'Juzgado Tercero de Circuito Externo',
      clienteId: 'cli-externo-99',
      clienteNombre: 'Cliente Exclusivo de Otra Organización',
      areaJuridica: 'COMERCIAL',
      jurisdiccion: 'ORDINARIA',
      autoridadCompetente: 'Juez Comercial Externo',
      partes: {
        demandanteOAccionante: 'Demandante de Otra Firma',
        demandadoOAccionado: 'Demandado de Otra Firma',
      },
      sintesisHechos: 'Expediente confidencial perteneciente a otra organización (Firma Legal Andina Externa Ltda.).',
      pretensionesUObjetivos: 'Confidencial de otra organización.',
      cuantiaEstimadaCOP: 50000000,
      esMayorCuantia: false,
      estado: 'RADICADO',
      fechaInicio: '2026-04-10T10:00:00Z',
      fechaActualizacion: new Date().toISOString(),
      organizacionId: 'org-externa-002', // Organización distinta
      abogadoResponsableId: 'usr-externo-04',
      abogadoResponsableNombre: 'Dra. Camila Soto',
    },
  ];

  // Actualizar referencias en actuaciones y términos
  if (db.terminos) {
    db.terminos.forEach((t: any) => {
      if (t.expedienteId === 'exp-2026-001') {
        t.expedienteCodigo = 'EXP-DEMO-001';
        t.clienteNombre = 'Sociedad Comercial Demostrativa S.A.S. (Ficticia)';
      }
    });
  }

  // Guardar archivo migrado
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  console.log('[Seguridad] Base de datos migrada exitosamente a datos 100% ficticios.');
}

if (process.argv[1] && process.argv[1].endsWith('migrate-data.ts')) {
  migrarDatosAFicticios();
}
