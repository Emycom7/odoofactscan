import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { OdooScope } from "./invoice-types";
import type { Json } from "@/integrations/supabase/types";

const ConnectionInput = z.object({
  url: z.string().min(4),
  db: z.string().min(1),
  username: z.string().min(1),
  apiKey: z.string().min(1).optional(), // absent = conserver la clé existante
});

/** Enregistre la connexion Odoo après l'avoir testée (login + scopes). */
export const saveOdooConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ConnectionInput.parse(i))
  .handler(async ({ data, context }) => {
    const { OdooClient, checkScopes, encryptSecret, decryptSecret, normalizeUrl } = await import("./odoo.server");
    const { supabase, userId } = context;

    let apiKey = data.apiKey;
    if (!apiKey) {
      const { data: existing } = await supabase.from("odoo_connections").select("api_key_enc").eq("user_id", userId).maybeSingle();
      if (!existing) throw new Error("Veuillez saisir votre clé API Odoo.");
      apiKey = await decryptSecret(existing.api_key_enc);
    }

    const url = normalizeUrl(data.url);
    const client = new OdooClient({ url, db: data.db.trim(), username: data.username.trim(), apiKey });
    const uid = await client.login();
    const [version, me, scopes] = await Promise.all([
      client.version().catch(() => ({ server_version: undefined })),
      client.call<{ name: string; company_id: [number, string] | false }[]>("res.users", "read", [[uid]], { fields: ["name", "company_id"] }),
      checkScopes(client),
    ]);

    const row = {
      user_id: userId,
      url,
      db_name: data.db.trim(),
      username: data.username.trim(),
      api_key_enc: await encryptSecret(apiKey),
      odoo_uid: uid,
      odoo_version: version.server_version ?? null,
      company_name: me[0]?.company_id ? me[0].company_id[1] : null,
      modules: scopes as unknown as Json,
      last_checked_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("odoo_connections").upsert(row, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true, uid, version: row.odoo_version, company: row.company_name, scopes };
  });

/** Re-teste la connexion enregistrée. */
export const testOdooConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { OdooClient, checkScopes, decryptSecret } = await import("./odoo.server");
    const { supabase, userId } = context;
    const { data: conn } = await supabase.from("odoo_connections").select("*").eq("user_id", userId).maybeSingle();
    if (!conn) throw new Error("Aucune connexion Odoo configurée.");
    const client = new OdooClient({ url: conn.url, db: conn.db_name, username: conn.username, apiKey: await decryptSecret(conn.api_key_enc) });
    await client.login();
    const scopes: OdooScope[] = await checkScopes(client);
    await supabase
      .from("odoo_connections")
      .update({ modules: scopes as unknown as Json, last_checked_at: new Date().toISOString() })
      .eq("user_id", userId);
    return { ok: true, scopes };
  });
