// Minimal in-memory mock of the supabase-js v2 query builder, enough for the Webpay functions.
export type SupabaseClient = any;

type Row = Record<string, any>;
export const db: { tables: Record<string, Row[]>; failNextUpdates: number; rpcCalls: any[]; failWhen: ((p: Row) => boolean) | null } = {
  tables: { orders: [], order_items: [], products: [], customers: [] },
  failNextUpdates: 0,
  rpcCalls: [],
  failWhen: null,
};

function parseOr(expr: string): (r: Row) => boolean {
  // supports: a.in.(x,y),and(b.eq.Z,c.lt.ISO)  and  a.eq.X,and(...)
  const parts: string[] = [];
  let depth = 0, cur = "";
  for (const ch of expr) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { parts.push(cur); cur = ""; } else cur += ch;
  }
  if (cur) parts.push(cur);
  const preds = parts.map((p) => {
    if (p.startsWith("and(")) {
      const inner = p.slice(4, -1);
      const sub = inner.split(",").map(cond);
      return (r: Row) => sub.every((f) => f(r));
    }
    return cond(p);
  });
  return (r) => preds.some((f) => f(r));
}
function cond(c: string): (r: Row) => boolean {
  const [col, op, ...rest] = c.split(".");
  const val = rest.join(".");
  if (op === "eq") return (r) => String(r[col]) === val;
  if (op === "lt") return (r) => r[col] != null && String(r[col]) < val;
  if (op === "in") { const set = val.replace(/^\(|\)$/g, "").split(","); return (r) => set.includes(String(r[col])); }
  throw new Error("unsupported op " + c);
}

class Q {
  private filters: ((r: Row) => boolean)[] = [];
  private op: "select" | "update" | "insert" = "select";
  private patch: Row | null = null;
  private inserts: Row[] = [];
  private wantSingle: "" | "single" | "maybe" = "";
  private returning = false;
  private lim = Infinity;
  constructor(private table: string) {}
  select(_c?: string) { if (this.op !== "select") this.returning = true; return this; }
  update(p: Row) { this.op = "update"; this.patch = p; return this; }
  insert(v: Row | Row[]) { this.op = "insert"; this.inserts = Array.isArray(v) ? v : [v]; return this; }
  eq(c: string, v: any) { this.filters.push((r) => r[c] === v || String(r[c]) === String(v)); return this; }
  in(c: string, vs: any[]) { this.filters.push((r) => vs.map(String).includes(String(r[c]))); return this; }
  match(m: Row) { for (const [k, v] of Object.entries(m)) this.eq(k, v); return this; }
  or(expr: string) { this.filters.push(parseOr(expr)); return this; }
  gte(c: string, v: any) { this.filters.push((r) => String(r[c]) >= String(v)); return this; }
  lt(c: string, v: any) { this.filters.push((r) => String(r[c]) < String(v)); return this; }
  limit(n: number) { this.lim = n; return this; }
  single() { this.wantSingle = "single"; return this; }
  maybeSingle() { this.wantSingle = "maybe"; return this; }
  then(res: any, rej?: any) { return Promise.resolve(this.run()).then(res, rej); }
  private run(): { data: any; error: any } {
    const rows = db.tables[this.table];
    if (this.op === "insert") {
      const out = this.inserts.map((r) => { const row = { id: rows.length + 1, ...r }; rows.push(row); return row; });
      return this.shape(out);
    }
    const hit = rows.filter((r) => this.filters.every((f) => f(r))).slice(0, this.lim);
    if (this.op === "update") {
      if (db.failNextUpdates > 0 && this.table === "orders" && (!db.failWhen || db.failWhen(this.patch!))) { db.failNextUpdates--; return { data: null, error: { message: "simulated db error" } }; }
      for (const r of hit) Object.assign(r, structuredClone(this.patch));
      return this.returning ? this.shape(hit.map((r) => ({ ...r }))) : { data: null, error: null };
    }
    return this.shape(hit.map((r) => ({ ...r })));
  }
  private shape(list: Row[]) {
    if (this.wantSingle === "single") return list.length === 1 ? { data: list[0], error: null } : { data: null, error: { message: "not single" } };
    if (this.wantSingle === "maybe") return list.length > 1 ? { data: null, error: { message: "multiple" } } : { data: list[0] ?? null, error: null };
    return { data: list, error: null };
  }
}

export function createClient(..._a: any[]) {
  return {
    from: (t: string) => new Q(t),
    rpc: async (name: string, args: any) => {
      db.rpcCalls.push({ name, args });
      if (name !== "try_decrement_product_stock") return { data: null, error: { message: "no rpc" } };
      const p = db.tables.products.find((x) => x.id === args.p_product_id);
      if (!p) return { data: false, error: null };
      if (p.stock == null) return { data: true, error: null };
      if (p.stock >= args.p_qty) { p.stock -= args.p_qty; return { data: true, error: null }; }
      return { data: false, error: null };
    },
  };
}
