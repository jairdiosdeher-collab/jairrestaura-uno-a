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
  'Mi pareja me amenaza y necesito protección.'
];
async function main() {
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
    console.log('OK: ruta prioritaria de protección');
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
