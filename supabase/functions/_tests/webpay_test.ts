import { db } from "./sb_mock.ts";

// ---------- environment ----------
Deno.env.set("SUPABASE_URL", "https://proj.supabase.co");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "svc");
Deno.env.set("TELEGRAM_BOT_TOKEN", "t");
Deno.env.set("TELEGRAM_CHAT_ID", "c");

// ---------- capture Deno.serve handlers ----------
const handlers: Record<string, (r: Request) => Promise<Response>> = {};
let currentName = "";
(Deno as any).serve = (h: any) => { handlers[currentName] = h; return {} as any; };
currentName = "confirm"; await import("./webpay-confirm.ts");
currentName = "reconcile"; await import("./webpay-reconcile.ts");
currentName = "create"; await import("./webpay-create-transaction.ts");

// ---------- fake network ----------
type Script = Array<{ match: RegExp; method?: string; respond: () => Response | "timeout" }>;
let script: Script = [];
const telegram: string[] = [];
const tbkCalls: string[] = [];
(globalThis as any).fetch = async (url: string, init: RequestInit = {}) => {
  const method = init.method ?? "GET";
  if (url.includes("api.telegram.org")) { telegram.push(JSON.parse(String(init.body)).text); return new Response("{}"); }
  tbkCalls.push(`${method} ${url.replace(/^https:\/\/[^/]+/, "")}`);
  const idx = script.findIndex((s) => s.match.test(url) && (!s.method || s.method === method));
  if (idx < 0) throw new Error(`unexpected fetch ${method} ${url}`);
  const step = script.splice(idx, 1)[0];
  const r = step.respond();
  if (r === "timeout") { const e = new Error("aborted"); e.name = "AbortError"; throw e; }
  return r;
};
const J = (status: number, body: unknown) => () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

// ---------- fixtures ----------
const KEY = "11111111-2222-3333-4444-555555555555";
function reset(order: Partial<Record<string, any>> = {}, stock: number | null = 1) {
  db.tables = { orders: [], order_items: [], products: [], customers: [] };
  db.failNextUpdates = 0;
  db.failWhen = null;
  db.rpcCalls = [];
  script = [];
  telegram.length = 0;
  tbkCalls.length = 0;
  db.tables.products.push({ id: 7, sku: "AIR-1", name: "Airbag", price_sale: 1000, stock, is_active: true });
  db.tables.orders.push({
    id: 50, status: "pending", total: 1000, payment_method: "webpay", webpay_token: "tok50", webpay_buy_order: "APC50",
    webpay_session_id: "sessABC", webpay_status: "created", webpay_env: "integration", receipt_key: KEY, review_reason: null,
    created_at: new Date().toISOString(), commit_claimed_at: null, ...order,
  });
  db.tables.order_items.push({ order_id: 50, product_id: 7, sku: "AIR-1", name: "Airbag", quantity: 1, total_price: 1000 });
}
const AUTH = { status: "AUTHORIZED", response_code: 0, amount: 1000, buy_order: "APC50", authorization_code: "1213", card_detail: { card_number: "7763" }, payment_type_code: "VD", transaction_date: "2026-10-18T23:00:00Z" };
const o = () => db.tables.orders[0];
async function confirmGet(qs: string) {
  const res = await handlers.confirm(new Request(`https://proj.supabase.co/functions/v1/webpay-confirm?${qs}`));
  return res.headers.get("location") ?? "";
}
function assert(cond: unknown, msg: string) { if (!cond) throw new Error("ASSERT: " + msg); }
const results: string[] = [];
async function t(name: string, fn: () => Promise<void>) {
  try { await fn(); results.push("PASS " + name); } catch (e) { results.push("FAIL " + name + " :: " + (e as Error).message); }
}

// ---------- tests ----------
await t("aprobado: completa, descuenta stock, avisa, comprobante con clave", async () => {
  reset(); script = [{ match: /tok50$/, method: "PUT", respond: J(200, AUTH) }];
  const loc = await confirmGet("token_ws=tok50");
  assert(loc === `https://autopartschile.cl/pago-exitoso.html?order=50&k=${KEY}`, "redirect " + loc);
  assert(o().status === "completed" && o().webpay_status === "AUTHORIZED", "status " + o().status);
  assert(o().review_reason === null && o().commit_claimed_at === null, "limpio");
  assert(db.tables.products[0].stock === 0, "stock");
  assert(telegram.length === 1 && telegram[0].startsWith("✅"), "telegram " + telegram);
});

await t("retorno repetido tras aprobar: no hace segundo commit", async () => {
  reset(); script = [{ match: /tok50$/, method: "PUT", respond: J(200, AUTH) }];
  await confirmGet("token_ws=tok50");
  const calls = tbkCalls.length;
  const loc = await confirmGet("token_ws=tok50");
  assert(loc.includes("pago-exitoso"), "redirect " + loc);
  assert(tbkCalls.length === calls, "sin llamadas nuevas a Transbank");
  assert(db.tables.products[0].stock === 0, "stock no descontado dos veces");
});

await t("rechazado: cancela, sin stock tocado", async () => {
  reset(); script = [{ match: /tok50$/, method: "PUT", respond: J(200, { status: "FAILED", response_code: -1, amount: 1000, buy_order: "APC50" }) }];
  const loc = await confirmGet("token_ws=tok50");
  assert(loc.includes("pago-fallido") && loc.includes(KEY), "redirect " + loc);
  assert(o().status === "cancelled", "status");
  assert(db.tables.products[0].stock === 1, "stock intacto");
});

await t("timeout x2 y GET sin autorizar: NO cancela, queda en revisión y avisa", async () => {
  reset();
  script = [
    { match: /tok50$/, method: "PUT", respond: () => "timeout" },
    { match: /tok50$/, method: "PUT", respond: () => "timeout" },
    { match: /tok50$/, method: "GET", respond: J(200, { status: "INITIALIZED", amount: 1000, buy_order: "APC50" }) },
  ];
  const loc = await confirmGet("token_ws=tok50");
  assert(loc.includes("pago-pendiente"), "redirect " + loc);
  assert(o().status === "pending" && o().webpay_status === "NEEDS_STATUS_CHECK", "estado " + o().status + "/" + o().webpay_status);
  assert(telegram.length === 1 && telegram[0].startsWith("⚠️"), "aviso");
});

await t("timeout y reintento 4xx (ya confirmado), GET AUTHORIZED: completa", async () => {
  reset();
  script = [
    { match: /tok50$/, method: "PUT", respond: () => "timeout" },
    { match: /tok50$/, method: "PUT", respond: J(422, { error_message: "Invalid status 'AUTHORIZED' for transaction while authorizing" }) },
    { match: /tok50$/, method: "GET", respond: J(200, AUTH) },
  ];
  const loc = await confirmGet("token_ws=tok50");
  assert(loc.includes("pago-exitoso"), "redirect " + loc);
  assert(o().status === "completed", "status");
});

await t("PUT 4xx y GET no autorizado: cancela (respuesta definitiva)", async () => {
  reset();
  script = [
    { match: /tok50$/, method: "PUT", respond: J(422, { error_message: "transaction expired" }) },
    { match: /tok50$/, method: "GET", respond: J(200, { status: "FAILED", response_code: -1, amount: 1000, buy_order: "APC50" }) },
  ];
  const loc = await confirmGet("token_ws=tok50");
  assert(loc.includes("pago-fallido"), "redirect " + loc);
  assert(o().status === "cancelled", "status");
});

await t("monto distinto: processing + alerta, no completa", async () => {
  reset(); script = [{ match: /tok50$/, method: "PUT", respond: J(200, { ...AUTH, amount: 999 }) }];
  const loc = await confirmGet("token_ws=tok50");
  assert(loc.includes("pago-pendiente"), "redirect " + loc);
  assert(o().status === "processing" && o().webpay_status === "AUTHORIZED_MISMATCH", "estado");
  assert(telegram[0].startsWith("🚨"), "alerta");
});

await t("sin stock al pagar: completa pero marca revisión y alerta", async () => {
  reset({}, 0); script = [{ match: /tok50$/, method: "PUT", respond: J(200, AUTH) }];
  await confirmGet("token_ws=tok50");
  assert(o().status === "completed", "status");
  assert(String(o().review_reason).includes("sin stock"), "review " + o().review_reason);
  assert(telegram[0].startsWith("🚨") && telegram[0].includes("SIN STOCK"), "alerta");
});

await t("stock NULL: no se marca como sin stock", async () => {
  reset({}, null); script = [{ match: /tok50$/, method: "PUT", respond: J(200, AUTH) }];
  await confirmGet("token_ws=tok50");
  assert(o().status === "completed" && o().review_reason === null, "ok");
});

await t("error de base de datos tras cobrar: no se pierde, alerta, reconciliador lo completa", async () => {
  reset(); script = [{ match: /tok50$/, method: "PUT", respond: J(200, AUTH) }];
  db.failWhen = (p) => p.status === "completed";
  db.failNextUpdates = 2;
  const res = await handlers.confirm(new Request("https://proj.supabase.co/functions/v1/webpay-confirm?token_ws=tok50"));
  db.failWhen = null;
  const loc = res.headers.get("location") ?? "";
  assert(loc.includes("pago-pendiente"), "redirect " + loc);
  assert(o().status === "pending" && o().webpay_status === "COMMITTING", "sigue reclamada " + o().status + "/" + o().webpay_status);
  assert(telegram.some((m) => m.startsWith("🚨") && m.includes("PAGADO")), "alerta pagado " + telegram);
  // Reconciliador 3 minutos después: PUT 4xx (ya confirmado) → GET AUTHORIZED → completa.
  o().commit_claimed_at = new Date(Date.now() - 3 * 60 * 1000).toISOString();
  script = [
    { match: /tok50$/, method: "PUT", respond: J(422, { error_message: "already committed" }) },
    { match: /tok50$/, method: "GET", respond: J(200, AUTH) },
  ];
  const r = await (await handlers.reconcile(new Request("https://x/"))).json();
  assert(r.completed === 1, "reconcile " + JSON.stringify(r));
  assert(o().status === "completed" && db.tables.products[0].stock === 0, "completada por reconciliador");
});

await t("dos retornos simultáneos: un solo commit, ninguno sobrescribe", async () => {
  reset();
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  script = [{ match: /tok50$/, method: "PUT", respond: J(200, AUTH) }];
  const realFetch = (globalThis as any).fetch;
  (globalThis as any).fetch = async (u: string, i: RequestInit = {}) => { if (!u.includes("telegram") && i.method === "PUT") await gate; return realFetch(u, i); };
  const a = confirmGet("token_ws=tok50");
  await new Promise((r) => setTimeout(r, 20));
  const b = confirmGet("token_ws=tok50");
  await new Promise((r) => setTimeout(r, 1200));
  release();
  const [la, lb] = await Promise.all([a, b]);
  (globalThis as any).fetch = realFetch;
  assert(tbkCalls.filter((c) => c.startsWith("PUT")).length === 1, "un solo PUT: " + tbkCalls);
  assert(la.includes("pago-exitoso") && lb.includes("pago-exitoso"), `ambos exitoso: ${la} | ${lb}`);
  assert(o().status === "completed", "completed");
});

await t("anulación válida (TBK_TOKEN + orden): cancela con comprobante", async () => {
  reset();
  const loc = await confirmGet("TBK_TOKEN=tok50&TBK_ORDEN_COMPRA=APC50&TBK_ID_SESION=sessABC");
  assert(loc.includes("pago-fallido") && loc.includes(KEY), "redirect " + loc);
  assert(o().status === "cancelled" && o().webpay_status === "ABORTED_BY_USER", "estado " + o().webpay_status);
  assert(tbkCalls.length === 0, "sin commit");
});

await t("ataque: solo TBK_ORDEN_COMPRA adivinada NO cancela", async () => {
  reset();
  await confirmGet("TBK_ORDEN_COMPRA=APC50");
  assert(o().status === "pending" && o().webpay_status === "created", "intacta");
});

await t("ataque: orden + sesión falsa NO cancela", async () => {
  reset();
  await confirmGet("TBK_ORDEN_COMPRA=APC50&TBK_ID_SESION=guess");
  assert(o().status === "pending", "intacta");
});

await t("timeout de formulario con sesión correcta: cancela", async () => {
  reset();
  await confirmGet("TBK_ORDEN_COMPRA=APC50&TBK_ID_SESION=sessABC");
  assert(o().status === "cancelled" && o().webpay_status === "TIMEOUT_FORM", "estado");
});

await t("anulación no toca una orden en confirmación (COMMITTING)", async () => {
  reset({ webpay_status: "COMMITTING", commit_claimed_at: new Date().toISOString() });
  await confirmGet("TBK_TOKEN=tok50&TBK_ORDEN_COMPRA=APC50&TBK_ID_SESION=sessABC");
  assert(o().status === "pending" && o().webpay_status === "COMMITTING", "intacta");
});

await t("error en formulario (token_ws + TBK_TOKEN): cancela sin commit", async () => {
  reset();
  await confirmGet("token_ws=tok50&TBK_TOKEN=tok50&TBK_ORDEN_COMPRA=APC50&TBK_ID_SESION=sessABC");
  assert(o().status === "cancelled" && o().webpay_status === "FORM_ERROR", "estado");
  assert(tbkCalls.length === 0, "sin commit");
});

await t("retorno por POST (form-urlencoded) funciona", async () => {
  reset(); script = [{ match: /tok50$/, method: "PUT", respond: J(200, AUTH) }];
  const res = await handlers.confirm(new Request("https://proj.supabase.co/functions/v1/webpay-confirm", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "token_ws=tok50" }));
  assert((res.headers.get("location") ?? "").includes("pago-exitoso"), "redirect");
});

await t("token desconocido: fallido sin datos", async () => {
  reset();
  const loc = await confirmGet("token_ws=nope");
  assert(loc === "https://autopartschile.cl/pago-fallido.html", "redirect " + loc);
});

await t("reconciliador: cancela órdenes abandonadas >30 min y respeta las recientes", async () => {
  reset({ created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString() });
  db.tables.orders.push({ ...o(), id: 51, webpay_token: "tok51", created_at: new Date().toISOString(), status: "pending", webpay_status: "created" });
  const r = await (await handlers.reconcile(new Request("https://x/"))).json();
  assert(r.expired === 1, "expired " + JSON.stringify(r));
  assert(o().status === "cancelled" && db.tables.orders[1].status === "pending", "solo la vieja");
});

await t("ambiente inválido: create responde 500 sin tocar la base", async () => {
  reset();
  Deno.env.set("WEBPAY_ENV", "Production");
  const res = await handlers.create(new Request("https://x/", { method: "POST", body: JSON.stringify({ items: [{ sku: "AIR-1" }], customer: { email: "a@b.cl" } }) }));
  Deno.env.delete("WEBPAY_ENV");
  assert(res.status === 500 && db.tables.orders.length === 1, "500 y sin orden nueva");
});

await t("create: suma líneas repetidas contra stock", async () => {
  reset();
  const res = await handlers.create(new Request("https://x/", { method: "POST", body: JSON.stringify({ items: [{ sku: "AIR-1", quantity: 1 }, { sku: "AIR-1", quantity: 1 }], customer: { email: "a@b.cl" } }) }));
  assert(res.status === 400, "rechaza 2 > stock 1: " + res.status);
});

await t("create: guarda env, orden, sesión y token; no sobrescribe cliente", async () => {
  reset();
  db.tables.customers.push({ id: 9, email: "a@b.cl", first_name: "Real", phone: "+569111" });
  script = [{ match: /transactions$/, method: "POST", respond: J(200, { token: "newtok", url: "https://webpay3gint.transbank.cl/webpayserver/initTransaction" }) }];
  const res = await handlers.create(new Request("https://x/", { method: "POST", body: JSON.stringify({ items: [{ sku: "AIR-1" }], customer: { email: "a@b.cl", first_name: "Hacker", phone: "000" } }) }));
  const body = await res.json();
  const n = db.tables.orders[1];
  assert(res.status === 200 && body.token === "newtok", "200 " + JSON.stringify(body));
  assert(n.webpay_env === "integration" && n.webpay_buy_order === `APC${n.id}` && n.webpay_session_id?.length === 32 && n.webpay_status === "created" && n.webpay_token === "newtok", "campos " + JSON.stringify(n));
  assert(db.tables.customers[0].first_name === "Real" && db.tables.customers[0].phone === "+569111", "cliente intacto");
  assert(n.customer_id === 9, "usa cliente existente");
});

await t("create en producción rechaza productos QA-", async () => {
  reset();
  db.tables.products.push({ id: 8, sku: "QA-WEBPAY-001", name: "QA", price_sale: 1000, stock: 10, is_active: true });
  Deno.env.set("WEBPAY_ENV", "production"); Deno.env.set("WEBPAY_COMMERCE_CODE", "x"); Deno.env.set("WEBPAY_API_KEY", "y");
  const res = await handlers.create(new Request("https://x/", { method: "POST", body: JSON.stringify({ items: [{ sku: "QA-WEBPAY-001" }], customer: { email: "a@b.cl" } }) }));
  Deno.env.delete("WEBPAY_ENV"); Deno.env.delete("WEBPAY_COMMERCE_CODE"); Deno.env.delete("WEBPAY_API_KEY");
  assert(res.status === 400, "400: " + res.status);
});

console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL")).length;
console.log(`\n${results.length - fails}/${results.length} OK`);
if (fails) Deno.exit(1);
