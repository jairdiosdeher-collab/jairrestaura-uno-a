# Auditoría técnica inicial — JAIRRESTAURA UNO A

Fecha: 2026-11-01
Rama de trabajo: `fix/validacion-segura-terminos-2026-11-01`
Rama base: `main`

## Alcance y límites

Esta revisión se realizó sobre los archivos visibles en la rama `main`. No se ejecutó el proyecto, no se instaló dependencias, no se accedió a variables de entorno ni a bases de datos, y no se desplegó la aplicación. Por tanto, los hallazgos son de inspección estática y requieren pruebas en un entorno controlado.

## Hallazgos verificados en el código inspeccionado

1. **Autenticación de demostración:** `api/auth/login.ts` responde con un token constante de demostración y construye un usuario a partir del correo enviado. No verifica contraseña ni identidad.
2. **Perfil no autenticado:** `api/auth/me.ts` devuelve un perfil y una lista de usuarios de demostración sin comprobar una sesión válida.
3. **Confianza en encabezados del cliente:** varios endpoints toman `x-organizacion-id` directamente de la petición y usan una organización predeterminada. Ese valor no constituye autenticación ni autorización.
4. **Persistencia no garantizada:** `api/clientes.ts`, `api/expedientes.ts`, `api/terminos.ts`, `api/honorarios.ts` y `api/audit-log.ts` intentan leer/escribir un JSON local y recurren a memoria o valores vacíos cuando no pueden hacerlo. En funciones serverless esto no garantiza persistencia duradera ni compartida entre instancias.
5. **Datos de demostración:** se observaron registros de muestra y datos de identidad ficticios dentro de los endpoints. Deben permanecer claramente separados de información real.
6. **Cómputo de términos:** el cálculo automatizado incorpora reglas generales, pero el propio módulo advierte que el abogado debe verificar el régimen aplicable, suspensiones y particularidades del despacho. No debe tratarse como concepto jurídico ni vencimiento definitivo sin revisión profesional.

## Cambio aplicado en esta rama

- `src/utils/colombianHolidays.ts`: se añadieron validaciones de formato y existencia de fecha, rango de año, tipo de días y duración (entero entre 1 y 3660). El objetivo es rechazar entradas inválidas y evitar cálculos sin límite.
- No se alteraron expedientes, clientes, registros, datos de producción ni la rama `main`.

## Pendientes prioritarios antes de uso con datos reales

- Implementar autenticación real (por ejemplo, Firebase Authentication verificado en servidor) y validar tokens en cada endpoint.
- Derivar el usuario y la organización desde la sesión verificada; nunca confiar en identificadores de organización enviados por el navegador.
- Definir autorización por rol y por recurso, incluida la comprobación de pertenencia del expediente y cliente.
- Conectar persistencia PostgreSQL real con migraciones, transacciones y copias de seguridad verificadas. La presencia de dependencias de PostgreSQL/Drizzle no demuestra que los endpoints las utilicen.
- Retirar datos de demostración de rutas operativas y evitar exponer datos personales o credenciales en el repositorio.
- Añadir pruebas automatizadas para autenticación, aislamiento entre organizaciones, validación de entradas, persistencia y cómputo de términos.
- Ejecutar instalación reproducible, compilación, chequeo TypeScript y pruebas en CI antes de integrar o desplegar.

## Estado

**Cambio limitado aplicado en rama independiente; no es una corrección integral ni una certificación de seguridad.** No integrar en producción hasta completar autenticación, autorización, persistencia y pruebas.
