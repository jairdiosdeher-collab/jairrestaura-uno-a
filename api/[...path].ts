/**
 * JAIRRESTAURA UNO A — API router
 * Conserva las rutas públicas existentes bajo un único despliegue Serverless.
 * Los controladores originales se mantienen en src/api-handlers.
 */
type Handler = (req: any, res: any) => any;

const routes: Record<string, () => Promise<{ default: Handler }>> = {
  "audit-log": () => import("../src/api-handlers/audit-log"),
  "auth/login": () => import("../src/api-handlers/auth/login"),
  "auth/me": () => import("../src/api-handlers/auth/me"),
  "clientes": () => import("../src/api-handlers/clientes"),
  "dashboard/stats": () => import("../src/api-handlers/dashboard/stats"),
  "documentos": () => import("../src/api-handlers/documentos"),
  "expedientes": () => import("../src/api-handlers/expedientes"),
  "health": () => import("../src/api-handlers/health"),
  "honorarios": () => import("../src/api-handlers/honorarios"),
  "orientador/generar-borrador": () => import("../src/api-handlers/orientador/generar-borrador"),
  "orientador/glosario": () => import("../src/api-handlers/orientador/glosario"),
  "orientador/orientar": () => import("../src/api-handlers/orientador/orientar"),
  "terminos": () => import("../src/api-handlers/terminos"),
};

export default async function handler(req: any, res: any) {
  const pathname = String(req.url || "").split("?")[0];
  const route = (pathname.startsWith("/api/") ? pathname.slice(5) : pathname.replace(/^\/api$/, "")).replace(/\/$/, "");
  const load = routes[route];

  if (!load) {
    return res.status(404).json({
      error: "Ruta API no encontrada.",
      codigo: "API_ROUTE_NOT_FOUND",
    });
  }

  try {
    const module = await load();
    return await module.default(req, res);
  } catch (error) {
    console.error("Error en API router:", route, error);
    return res.status(500).json({
      error: "No fue posible procesar la solicitud.",
      codigo: "API_INTERNAL_ERROR",
    });
  }
}
