-- Connexions Odoo (une par utilisateur)
CREATE TABLE public.odoo_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  url text NOT NULL,
  db_name text NOT NULL,
  username text NOT NULL,
  api_key_enc text NOT NULL,
  odoo_uid integer,
  odoo_version text,
  company_name text,
  modules jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.odoo_connections TO authenticated;
GRANT ALL ON public.odoo_connections TO service_role;
ALTER TABLE public.odoo_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own connection select" ON public.odoo_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own connection insert" ON public.odoo_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own connection update" ON public.odoo_connections FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own connection delete" ON public.odoo_connections FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Factures scannées
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  status text NOT NULL DEFAULT 'analyzing',
  extracted jsonb,
  supplier_match jsonb,
  odoo_partner_id integer,
  odoo_partner_created boolean NOT NULL DEFAULT false,
  odoo_move_id integer,
  odoo_move_name text,
  odoo_purchase_id integer,
  odoo_purchase_name text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX invoices_user_created_idx ON public.invoices (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own invoices select" ON public.invoices FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own invoices insert" ON public.invoices FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own invoices update" ON public.invoices FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own invoices delete" ON public.invoices FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- updated_at automatique
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER odoo_connections_updated_at BEFORE UPDATE ON public.odoo_connections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Temps réel sur les factures
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.odoo_connections;

ALTER TABLE public.invoices ADD COLUMN storage_path text NOT NULL DEFAULT '';