import React from 'react';
import { HeartHandshake, ShieldCheck, Scale, BookOpen, Info } from 'lucide-react';
import { OrientadorCiudadano } from '../components/OrientadorCiudadano';

/**
 * Portal público del servicio social gratuito.
 * No depende de sesión, cuenta, pago ni permisos del área administrativa.
 * No incorpora ni expone expedientes internos.
 */
export const ServicioSocialView: React.FC = () => (
  <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <header className="border-b border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
        <a href="/servicio-social" className="flex items-center gap-3" aria-label="JAIRRESTAURA servicio social gratuito">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 text-slate-950"><Scale className="h-6 w-6" /></span>
          <span><strong className="block text-sm tracking-wide">JAIRRESTAURA UNO A</strong><span className="text-xs text-amber-600 dark:text-amber-400">Servicio Social Jurídico Gratuito</span></span>
        </a>
        <a href="/" className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900">Portal institucional</a>
      </div>
    </header>
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <section className="mb-8 rounded-3xl border border-amber-200 bg-gradient-to-br from-white to-amber-50 p-6 dark:border-amber-900/50 dark:from-slate-900 dark:to-slate-900 sm:p-9">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400"><HeartHandshake className="h-4 w-4" /> Orientación abierta a la comunidad</div>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">Escucha, orientación y claridad para conocer tus opciones jurídicas.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">Este espacio de servicio social permite realizar consultas iniciales de orientación jurídica sobre situaciones en Colombia. Es gratuito y está disponible sin crear una cuenta, iniciar sesión ni efectuar pagos.</p>
        <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-emerald-700 shadow-sm dark:bg-slate-800 dark:text-emerald-300"><ShieldCheck className="h-4 w-4" /> Sin registro ni pago</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200"><BookOpen className="h-4 w-4" /> Información inicial</span>
        </div>
      </section>
      <section aria-label="Orientador jurídico ciudadano">
        <OrientadorCiudadano />
      </section>
      <aside className="mt-8 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100">
        <div className="flex items-start gap-3"><Info className="mt-0.5 h-5 w-5 shrink-0" /><div><strong>Alcance y privacidad.</strong> La orientación es automatizada, inicial e informativa; no sustituye la atención de autoridades ni la asesoría de un profesional que conozca el caso. No ingreses contraseñas, números completos de tarjetas, datos bancarios ni información íntima innecesaria. Si existe peligro inmediato, busca un lugar seguro y llama al 123.</div></div>
      </aside>
    </main>
    <footer className="mt-10 border-t border-slate-200 px-5 py-6 text-center text-xs text-slate-500 dark:border-slate-800">JAIRRESTAURA UNO A · Servicio Social Jurídico Gratuito · Colombia</footer>
  </div>
);
