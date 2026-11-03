/**
 * Regresión del Orientador Ciudadano: prioridad de protección.
 * Ejecutar con la API local levantada:
 *   ORIENTADOR_BASE_URL=http://localhost:3000 npx tsx tests/orientador-violencia.test.ts
 * Solo utiliza relatos hipotéticos; no registra datos personales.
 */
const BASE_URL = process.env.ORIENTADOR_BASE_URL || 'http://localhost:3000';
const casos = [
  'Ella dice que el marido le pega, ¿qué debe hacer?',
  'Mi esposo me golpea y tengo miedo.',
  'Mi pareja me amenaza y necesito protección.',
  'El marido la golpea duro y se quiere divorciar. ¿Qué debe hacer?'
];
const casosNoViolencia = [
  'La empresa amenaza con iniciar una demanda por incumplimiento contractual.',
  'El banco amenaza con reportarme y embargar mi cuenta por una deuda.',
  'Recibí una amenaza de sanción administrativa por no entregar documentos.'
];
async function main() {
  for (const descripcionProblema of casosNoViolencia) {
    const response = await fetch(`${BASE_URL}/api/orientador/orientar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descripcionProblema })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const orientacion = data?.orientacion;
    if (!orientacion) throw new Error('Respuesta sin objeto orientacion');
    const categorias = (orientacion.categoriasIdentificadas || []).join(' ').toLowerCase();
    if (/violencia intrafamiliar|posible violencia/.test(categorias)) {
      throw new Error('Falso positivo: una amenaza jurídica fue clasificada como violencia');
    }
    console.log('OK: amenaza jurídica no activa ruta de violencia');
  }
  for (const descripcionProblema of casos) {
    const response = await fetch(`${BASE_URL}/api/orientador/orientar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descripcionProblema })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const orientacion = data?.orientacion;
    if (!orientacion) throw new Error('Respuesta sin objeto orientacion');
    const text = JSON.stringify(orientacion).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (!/violencia|proteccion|comisaria|linea 155|linea 123/.test(text)) {
      throw new Error('No se devolvió una ruta prioritaria de protección');
    }
    if (/derecho civil y obligaciones generales/.test((orientacion.categoriasIdentificadas || []).join(' ').toLowerCase())) {
      throw new Error('La consulta fue clasificada como asunto civil genérico');
    }
    if (descripcionProblema.toLowerCase().includes('divorciar')) {
      if (!/divorcio/i.test(text)) throw new Error('No se incluyó orientación específica sobre divorcio');
      if (!/Ley 2442 de 2024/.test(text)) throw new Error('No se identificó la Ley 2442 de 2024');
      if (!/registro civil de matrimonio/i.test(text)) throw new Error('Falta documento familiar pertinente');
      if (/ALERTA DE TÉRMINO EN CURSO/.test(text)) throw new Error('Se confundió protección con término procesal');
    }
    console.log('OK: ruta prioritaria de protección');
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
