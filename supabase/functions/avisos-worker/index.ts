// WORKER DE AVISOS (fase 3). Envía notificaciones web push al celular de Emir desde la cola `avisos`.
// Reemplaza a Telegram (descartado por Emir el 26-nov-2026). Lo lanza pg_cron cada 2 min vía agente_lanzar().
// Idempotente: toma filas 'pendiente' con run_after <= now(), reintenta con backoff, borra suscripciones muertas (404/410).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import webpush from "npm:web-push@3.6.7";
import { autorizar, db, json } from "./agente.ts";

const MAX_ATTEMPTS = 5;
const BATCH = 20;

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST" }, 405);
  if (!(await autorizar(req, "sistema"))) return json({ error: "no autorizado" }, 401);

  const { data: priv, error: ePriv } = await db.rpc("vapid_private");
  const { data: cfg } = await db.from("crm_settings").select("value").eq("key", "vapid_public").maybeSingle();
  const pub = typeof cfg?.value === "string" ? cfg.value : cfg?.value?.toString?.();
  if (ePriv || !priv || !pub) return json({ error: "VAPID no configurado: " + (ePriv?.message ?? "sin llaves") }, 500);
  webpush.setVapidDetails("mailto:contacto@autopartschile.cl", pub, priv);

  const { data: subs, error: eSubs } = await db.from("push_suscripciones").select("id, endpoint, p256dh, auth");
  if (eSubs) return json({ error: eSubs.message }, 500);

  const { data: rows, error } = await db.from("avisos").select("id, titulo, texto, url, payload, attempts")
    .eq("status", "pendiente").lte("run_after", new Date().toISOString()).order("id").limit(BATCH);
  if (error) return json({ error: error.message }, 500);

  const r = { avisos: 0, enviados: 0, sin_destinatarios: 0, errores: 0, suscripciones_borradas: 0 };
  for (const a of rows ?? []) {
    const { data: claimed } = await db.from("avisos").update({ attempts: a.attempts + 1 }).eq("id", a.id).eq("attempts", a.attempts).eq("status", "pendiente").select("id");
    if (!claimed?.length) continue;
    r.avisos++;
    if (!subs?.length) {
      // Nadie activó notificaciones todavía: se guarda como tal y queda visible en el panel (no se pierde).
      await db.from("avisos").update({ status: "sin_destinatarios", processed_at: new Date().toISOString() }).eq("id", a.id);
      r.sin_destinatarios++; continue;
    }
    const body = JSON.stringify({ title: a.titulo, body: a.texto.slice(0, 500), url: a.url, tag: "aviso-" + a.id, payload: a.payload });
    let ok = 0, lastErr = "";
    for (const s of subs) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { TTL: 86400, urgency: "high" });
        ok++;
        await db.from("push_suscripciones").update({ ultimo_envio_at: new Date().toISOString(), fallos: 0 }).eq("id", s.id);
      } catch (e: any) {
        const code = e?.statusCode ?? 0;
        lastErr = `push ${code}: ${(e?.body ?? e?.message ?? "").toString().slice(0, 120)}`;
        if (code === 404 || code === 410) {
          await db.from("push_suscripciones").delete().eq("id", s.id); r.suscripciones_borradas++;
        } else {
          await db.from("push_suscripciones").update({ fallos: (s as any).fallos ? (s as any).fallos + 1 : 1 }).eq("id", s.id);
        }
      }
    }
    if (ok > 0) {
      await db.from("avisos").update({ status: "enviado", enviados: ok, processed_at: new Date().toISOString(), last_error: lastErr || null }).eq("id", a.id);
      r.enviados++;
    } else {
      const final = a.attempts + 1 >= MAX_ATTEMPTS;
      await db.from("avisos").update({
        status: final ? "error" : "pendiente", last_error: lastErr,
        run_after: new Date(Date.now() + 2 ** (a.attempts + 1) * 60_000).toISOString(),
        processed_at: final ? new Date().toISOString() : null,
      }).eq("id", a.id);
      r.errores++;
    }
  }
  return json(r);
});
