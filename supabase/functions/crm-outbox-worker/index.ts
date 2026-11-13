// Procesa la cola crm_outbox del CRM: avisos por Telegram y pausas de publicaciones en Mercado Libre.
// La llama pg_cron cada 5 minutos. Es idempotente: solo toma filas 'pendiente' con run_after <= now().
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TG_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const TG_CHAT = Deno.env.get("TELEGRAM_CHAT_ID") ?? "";
const CLIENT_ID = Deno.env.get("MELI_CLIENT_ID") ?? "";
const CLIENT_SECRET = Deno.env.get("MELI_CLIENT_SECRET") ?? "";
const API = "https://api.mercadolibre.com";
const MAX_ATTEMPTS = 5;
const BATCH = 25;

const admin = createClient(SB_URL, SERVICE, { auth: { persistSession: false } });
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

let cachedToken: string | null = null;
async function meliToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  const { data: a } = await admin.from("meli_account").select("*").eq("id", 1).maybeSingle();
  if (!a?.refresh_token) throw new Error("Mercado Libre no está conectado");
  if (a.access_token && new Date(a.expires_at).getTime() - Date.now() > 5 * 60_000) return (cachedToken = a.access_token);
  const r = await fetch(`${API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ grant_type: "refresh_token", client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: a.refresh_token }),
  });
  const t = await r.json().catch(() => ({}));
  if (!r.ok || !t.access_token) throw new Error("No se pudo renovar el acceso a Mercado Libre: " + (t.message || r.status));
  await admin.from("meli_account").update({
    access_token: t.access_token, refresh_token: t.refresh_token ?? a.refresh_token,
    expires_at: new Date(Date.now() + (Number(t.expires_in) || 21600) * 1000).toISOString(), updated_at: new Date().toISOString(),
  }).eq("id", 1);
  return (cachedToken = t.access_token);
}

async function sendTelegram(text: string) {
  if (!TG_TOKEN || !TG_CHAT) throw new Error("Faltan TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID");
  const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TG_CHAT, text: text.slice(0, 4000), disable_web_page_preview: true }),
  });
  if (!r.ok) throw new Error(`Telegram ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

async function pauseMeli(p: { item_id: string; product_id?: number }) {
  const tk = await meliToken();
  const r = await fetch(`${API}/items/${encodeURIComponent(p.item_id)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${tk}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ status: "paused" }),
  });
  const body = await r.text();
  // Si ya estaba cerrada o pausada, no es error.
  if (!r.ok && !/closed|paused|not_modifiable/i.test(body)) throw new Error(`ML ${r.status}: ${body.slice(0, 200)}`);
  if (p.product_id) await admin.from("products").update({ meli_status: "paused" }).eq("id", p.product_id);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST" }, 405);
  const { data: rows, error } = await admin.from("crm_outbox")
    .select("id, kind, payload, attempts")
    .eq("status", "pendiente").lte("run_after", new Date().toISOString())
    .order("id").limit(BATCH);
  if (error) return json({ error: error.message }, 500);

  const result = { enviados: 0, errores: 0 };
  for (const row of rows ?? []) {
    // Reclamar la fila (evita doble envío si dos ejecuciones se cruzan)
    const { data: claimed } = await admin.from("crm_outbox")
      .update({ attempts: row.attempts + 1 }).eq("id", row.id).eq("attempts", row.attempts).eq("status", "pendiente")
      .select("id");
    if (!claimed?.length) continue;
    try {
      if (row.kind === "telegram") await sendTelegram(String(row.payload?.text ?? ""));
      else if (row.kind === "meli_pausar") await pauseMeli(row.payload);
      else throw new Error("Tipo desconocido: " + row.kind);
      await admin.from("crm_outbox").update({ status: "enviado", processed_at: new Date().toISOString(), last_error: null }).eq("id", row.id);
      result.enviados++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const final = row.attempts + 1 >= MAX_ATTEMPTS;
      await admin.from("crm_outbox").update({
        status: final ? "error" : "pendiente",
        last_error: msg,
        run_after: new Date(Date.now() + 2 ** (row.attempts + 1) * 60_000).toISOString(),
        processed_at: final ? new Date().toISOString() : null,
      }).eq("id", row.id);
      result.errores++;
    }
  }
  return json(result);
});
