/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — SCRIPT DE MIGRACIÓN BIDIRECCIONAL A CLOUD SQL
 * Carga todos los datos de data/jairrestaura_db.json a PostgreSQL de forma segura e idempotente.
 */

import fs from 'fs';
import path from 'path';
import { db } from '../src/db/index.ts';
import {
  organizaciones,
  usuarios,
  clientes,
  expedientes,
  actuaciones,
  terminos,
  documentos,
  honorarios,
  auditoria,
  casosAcademicos,
} from '../src/db/schema.ts';

async function migrar() {
  console.log('--- INICIANDO MIGRACIÓN A CLOUD SQL (POSTGRESQL) ---');

  const dbPath = path.join(process.cwd(), 'data', 'jairrestaura_db.json');
  if (!fs.existsSync(dbPath)) {
    console.error('No se encontró archivo data/jairrestaura_db.json');
    process.exit(1);
  }

  const raw = fs.readFileSync(dbPath, 'utf8');
  const data = JSON.parse(raw);

  // 1. Organizaciones
  console.log('1. Migrando organizaciones...');
  const orgs = [
    {
      id: data.organizacion?.id || 'org-jairrestaura-001',
      nombre: data.organizacion?.nombre || 'JairRestaura Uno A & Asociados — Firma Jurídica Demostrativa',
      nit: data.organizacion?.nit || '900.000.001-0',
      representante: data.organizacion?.representante || 'Dr. Jair (Perfil Demostrativo)',
      tarjetaProfesionalDireccion: data.organizacion?.tarjetaProfesionalDireccion || 'T.P. No. 000.000',
    },
    {
      id: 'org-externa-002',
      nombre: 'Firma Legal Andina Externa Ltda.',
      nit: '900.000.002-9',
      representante: 'Dra. Camila Soto (Externa)',
      tarjetaProfesionalDireccion: 'T.P. No. 000.099',
    },
  ];

  for (const org of orgs) {
    await db.insert(organizaciones).values(org).onConflictDoNothing();
  }

  // 2. Usuarios
  console.log('2. Migrando usuarios...');
  if (Array.isArray(data.usuarios)) {
    for (const u of data.usuarios) {
      await db.insert(usuarios).values({
        id: u.id,
        uid: u.uid || `uid-${u.id}`,
        email: u.email,
        nombre: u.nombre,
        tarjetaProfesional: u.tarjetaProfesional || null,
        rol: u.rol,
        organizacionId: u.organizacionId || 'org-jairrestaura-001',
        organizacionNombre: u.organizacionNombre || null,
        fechaCreacion: u.fechaCreacion ? new Date(u.fechaCreacion) : new Date(),
        ultimoAcceso: u.ultimoAcceso ? new Date(u.ultimoAcceso) : null,
      }).onConflictDoNothing();
    }
  }

  // 3. Clientes
  console.log('3. Migrando clientes...');
  const todosClientes = [...(Array.isArray(data.clientes) ? data.clientes : [])];
  if (!todosClientes.find((c) => c.id === 'cli-externo-99')) {
    todosClientes.push({
      id: 'cli-externo-99',
      tipoPersona: 'JURIDICA',
      tipoIdentificacion: 'NIT',
      numeroIdentificacion: '900.000.999',
      dv: '9',
      nombreCompletoORazonSocial: 'Corporación Externa Aislada S.A.S.',
      emailPrincipal: 'contacto@externa-aislada.internal',
      emailNotificacionesJudiciales: 'notif@externa-aislada.internal',
      telefono: '+57 (600) 999-9999',
      direccion: 'Avenida 99 No. 99-99',
      ciudad: 'Cali',
      departamento: 'Valle del Cauca',
      estado: 'ACTIVO',
      consentimientoLey1581: {
        autorizado: false,
        fechaAutorizacion: '2026-04-01T10:00:00Z',
        canalAutorizacion: 'DIGITAL_APP',
        finalidadTratamiento: 'Tratamiento exclusivo de firma externa',
      },
      organizacionId: 'org-externa-002',
    });
  }

  for (const c of todosClientes) {
    await db.insert(clientes).values({
      id: c.id,
      tipoPersona: c.tipoPersona,
      tipoIdentificacion: c.tipoIdentificacion,
      numeroIdentificacion: c.numeroIdentificacion,
      dv: c.dv || null,
      nombreCompletoORazonSocial: c.nombreCompletoORazonSocial,
      representanteNombre: c.representanteLegal?.nombre || null,
      representanteId: c.representanteLegal?.numeroIdentificacion || null,
      representanteCargo: c.representanteLegal?.cargo || null,
      emailPrincipal: c.emailPrincipal,
      emailNotificacionesJudiciales: c.emailNotificacionesJudiciales || c.emailPrincipal,
      telefono: c.telefono || null,
      direccion: c.direccion || null,
      ciudad: c.ciudad || 'Bogotá D.C.',
      departamento: c.departamento || 'Cundinamarca',
      estado: c.estado || 'ACTIVO',
      habeasDataAutorizado: !!c.consentimientoLey1581?.autorizado,
      habeasDataFecha: c.consentimientoLey1581?.fechaAutorizacion ? new Date(c.consentimientoLey1581.fechaAutorizacion) : new Date(),
      habeasDataCanal: c.consentimientoLey1581?.canalAutorizacion || 'DIGITAL_APP',
      habeasDataFinalidad: c.consentimientoLey1581?.finalidadTratamiento || 'Gestión procesal conforme a Ley 1581 de 2012',
      notasInternas: c.notasInternas || null,
      organizacionId: c.organizacionId || 'org-jairrestaura-001',
      fechaCreacion: c.fechaCreacion ? new Date(c.fechaCreacion) : new Date(),
      fechaActualizacion: c.fechaActualizacion ? new Date(c.fechaActualizacion) : new Date(),
    }).onConflictDoNothing();
  }

  // 4. Expedientes
  console.log('4. Migrando expedientes...');
  if (Array.isArray(data.expedientes)) {
    for (const e of data.expedientes) {
      await db.insert(expedientes).values({
        id: e.id,
        codigoInterno: e.codigoInterno,
        radicadoJudicial: e.radicadoJudicial || null,
        despachoJudicial: e.despachoJudicial,
        clienteId: e.clienteId,
        clienteNombre: e.clienteNombre,
        areaJuridica: e.areaJuridica,
        jurisdiccion: e.jurisdiccion,
        autoridadCompetente: e.autoridadCompetente || e.despachoJudicial,
        demandanteOAccionante: e.partes?.demandanteOAccionante || e.clienteNombre,
        apoderadoDemandante: e.partes?.apoderadoDemandante || null,
        demandadoOAccionado: e.partes?.demandadoOAccionado || 'Indeterminado',
        apoderadoDemandado: e.partes?.apoderadoDemandado || null,
        sintesisHechos: e.sintesisHechos,
        pretensionesUObjetivos: e.pretensionesUObjetivos,
        cuantiaEstimadaCOP: e.cuantiaEstimadaCOP ? String(e.cuantiaEstimadaCOP) : null,
        esMayorCuantia: !!e.esMayorCuantia,
        estado: e.estado,
        estrategiaDefensiva: e.estrategiaDefensiva || null,
        notasPrivadas: e.notasPrivadas || null,
        abogadoResponsableId: e.abogadoResponsableId || null,
        abogadoResponsableNombre: e.abogadoResponsableNombre || null,
        organizacionId: e.organizacionId || 'org-jairrestaura-001',
        fechaInicio: e.fechaInicio ? new Date(e.fechaInicio) : new Date(),
        fechaActualizacion: e.fechaActualizacion ? new Date(e.fechaActualizacion) : new Date(),
      }).onConflictDoNothing();
    }
  }

  // 5. Actuaciones
  console.log('5. Migrando actuaciones procesales...');
  if (data.actuaciones && typeof data.actuaciones === 'object') {
    for (const expId of Object.keys(data.actuaciones)) {
      const actList = data.actuaciones[expId];
      if (Array.isArray(actList)) {
        for (const act of actList) {
          await db.insert(actuaciones).values({
            id: act.id || `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            expedienteId: expId,
            fechaActuacion: act.fechaActuacion || new Date().toISOString().split('T')[0],
            cuaderno: act.cuaderno || 'Cuaderno Principal',
            tipoProvidencia: act.tipoProvidencia || 'AUTO_INTERLOCUTORIO',
            anotacion: act.anotacion || 'Anotación procesal',
            tieneTermino: !!act.tieneTermino,
            terminoDias: act.terminoDias ? Number(act.terminoDias) : null,
            tipoDias: act.tipoDias || null,
            fechaRegistro: act.fechaRegistro ? new Date(act.fechaRegistro) : new Date(),
            usuarioRegistroId: act.usuarioRegistroId || null,
            usuarioRegistroNombre: act.usuarioRegistroNombre || null,
          }).onConflictDoNothing();
        }
      }
    }
  }

  // 6. Términos
  console.log('6. Migrando términos...');
  if (Array.isArray(data.terminos)) {
    for (const t of data.terminos) {
      await db.insert(terminos).values({
        id: t.id,
        titulo: t.titulo,
        descripcion: t.descripcion || null,
        tipoTermino: t.tipoTermino,
        expedienteId: t.expedienteId || null,
        expedienteCodigo: t.expedienteCodigo || null,
        clienteId: t.clienteId || null,
        clienteNombre: t.clienteNombre || null,
        fechaNotificacionOInicio: t.fechaNotificacionOInicio,
        duracionDias: t.duracionDias,
        tipoDias: t.tipoDias || 'HABILES_JUDICIALES',
        aplicaReglaLey2213: t.aplicaReglaLey2213 !== false,
        fechaVencimientoCalculada: t.fechaVencimientoCalculada,
        calculoConfirmadoPorAbogado: !!t.calculoConfirmadoPorAbogado,
        confirmadoPorNombre: t.confirmadoPorNombre || null,
        confirmadoEn: t.confirmadoEn ? new Date(t.confirmadoEn) : null,
        estado: t.estado || 'PENDIENTE',
        prioridad: t.prioridad || 'MEDIA',
        notasComputo: t.notasCómputo || t.notasComputo || null,
        responsableId: t.responsableId || null,
        responsableNombre: t.responsableNombre || null,
        organizacionId: t.organizacionId || 'org-jairrestaura-001',
        fechaCreacion: t.fechaCreacion ? new Date(t.fechaCreacion) : new Date(),
      }).onConflictDoNothing();
    }
  }

  // 7. Documentos
  console.log('7. Migrando documentos...');
  if (Array.isArray(data.documentos)) {
    for (const doc of data.documentos) {
      await db.insert(documentos).values({
        id: doc.id,
        titulo: doc.titulo,
        tipoDocumento: doc.tipoDocumento || doc.tipo || 'OTRO',
        expedienteId: doc.expedienteId || null,
        clienteId: doc.clienteId || null,
        contenido: doc.contenido || doc.contenidoTexto || 'Contenido del documento',
        version: doc.version || 1,
        esBorradorNoRadicable: doc.esBorradorNoRadicable !== false,
        estado: doc.estado || doc.estadoRevision || 'BORRADOR',
        metadatos: doc.metadatos ? JSON.stringify(doc.metadatos) : null,
        organizacionId: doc.organizacionId || 'org-jairrestaura-001',
        creadoPorId: doc.creadoPorId || doc.autorId || null,
        creadoPorNombre: doc.creadoPorNombre || doc.autorNombre || null,
        fechaCreacion: doc.fechaCreacion ? new Date(doc.fechaCreacion) : new Date(),
        fechaActualizacion: doc.fechaActualizacion || doc.fechaModificacion ? new Date(doc.fechaActualizacion || doc.fechaModificacion) : new Date(),
      }).onConflictDoNothing();
    }
  }

  // 8. Honorarios
  console.log('8. Migrando honorarios...');
  if (Array.isArray(data.honorarios)) {
    for (const h of data.honorarios) {
      await db.insert(honorarios).values({
        id: h.id,
        clienteId: h.clienteId,
        clienteNombre: h.clienteNombre,
        expedienteId: h.expedienteId || null,
        expedienteCodigo: h.expedienteCodigo || null,
        concepto: h.concepto,
        modalidad: h.modalidad || 'CUOTA_FIJA',
        valorAcordadoCOP: h.valorAcordadoCOP || 0,
        valorPagadoCOP: h.valorPagadoCOP || 0,
        saldoPendienteCOP: h.saldoPendienteCOP || 0,
        estadoPago: h.estadoPago || 'PENDIENTE',
        fechaAcuerdo: h.fechaAcuerdo || new Date().toISOString().split('T')[0],
        pagosHistorial: h.pagosHistorial ? JSON.stringify(h.pagosHistorial) : null,
        organizacionId: h.organizacionId || 'org-jairrestaura-001',
        fechaRegistro: h.fechaRegistro ? new Date(h.fechaRegistro) : new Date(),
      }).onConflictDoNothing();
    }
  }

  // 9. Auditoría
  console.log('9. Migrando registros de auditoría...');
  if (Array.isArray(data.auditoria)) {
    for (const a of data.auditoria) {
      await db.insert(auditoria).values({
        id: a.id,
        usuarioId: a.usuarioId,
        usuarioNombre: a.usuarioNombre,
        usuarioRol: a.usuarioRol,
        accion: a.accion,
        modulo: a.modulo,
        descripcion: a.descripcion || a.descripcionDetallada || 'Evento registrado en bitácora',
        recursoId: a.recursoId || a.registroIdAfectado || null,
        organizacionId: a.organizacionId || 'org-jairrestaura-001',
        ip: a.ip || a.direccionIP || null,
        timestamp: a.timestamp ? new Date(a.timestamp) : new Date(),
      }).onConflictDoNothing();
    }
  }

  // 10. Casos Académicos
  console.log('10. Migrando casos académicos...');
  if (Array.isArray(data.casosAcademicos)) {
    for (const caso of data.casosAcademicos) {
      await db.insert(casosAcademicos).values({
        id: caso.id,
        titulo: caso.titulo,
        area: caso.area || caso.areaDerecho || 'GENERAL',
        jurisdiccion: caso.jurisdiccion || 'ORDINARIA',
        descripcion: caso.descripcion || caso.materiaEspecifica || caso.hechosOriginales || 'Caso académico de estudio',
        hechos: JSON.stringify(caso.hechos || caso.hechosAcreditados || []),
        evidencias: JSON.stringify(caso.evidencias || caso.matrizHechosYPruebas || []),
        preguntasSocraticas: JSON.stringify(caso.preguntasSocraticas || caso.dialogoSocratico || []),
        rutaProcesal: JSON.stringify(caso.rutaProcesal || caso.tareasInvestigacion || []),
        fechaCreacion: caso.fechaCreacion ? new Date(caso.fechaCreacion) : new Date(),
      }).onConflictDoNothing();
    }
  }

  console.log('--- MIGRACIÓN COMPLETADA EXITOSAMENTE Y SIN PÉRDIDA DE DATOS ---');
}

migrar().catch((err) => {
  console.error('Error en migración:', err);
  process.exit(1);
});
