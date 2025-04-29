CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  raw_user_meta_data jsonb
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all authenticated users" ON public.users FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, raw_user_meta_data)
  VALUES (new.id, new.email, new.raw_user_meta_data);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text,
  address text,
  location_url text,
  gst_number text,
  website text,
  billing_email text,
  subscription_tier text DEFAULT 'FREE',
  role_settings jsonb DEFAULT '{"MANAGER":["dashboard","projects","clients","suppliers","categories","products","products_import","products_in","products_out","products_logs","billing","amc","reports","tasks"],"TECHNICIAN":["dashboard","projects","products_in","products_out","tasks"]}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'TECHNICIAN')),
  assigned_manager_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
CREATE POLICY "Users can view their organization" ON public.organizations FOR SELECT TO authenticated USING (id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
CREATE POLICY "Users can create organizations" ON public.organizations FOR INSERT TO authenticated WITH CHECK (true);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_user_org_id() 
RETURNS uuid AS $$
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

DROP POLICY IF EXISTS "Users can view members of their organization" ON public.organization_members;
CREATE POLICY "Users can view members of their organization" ON public.organization_members FOR SELECT TO authenticated USING (organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "Users can insert themselves" ON public.organization_members;
CREATE POLICY "Users can insert themselves" ON public.organization_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());


CREATE TABLE IF NOT EXISTS public.clients (
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  name text NOT NULL,
  company_name text,
  email text,
  phone text NOT NULL,
  address text,
  gst_number text,
  location_url text,
  notes text
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for authenticated users only" ON public.clients;
CREATE POLICY "Enable ALL for users in same organization" ON public.clients FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())) WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.suppliers (
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  company_name text NOT NULL,
  contact_person text,
  email text,
  phone text NOT NULL,
  address text,
  gst_number text,
  categories text,
  payment_terms text,
  notes text
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for authenticated users only" ON public.suppliers;
CREATE POLICY "Enable ALL for users in same organization" ON public.suppliers FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())) WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.categories (
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  name text NOT NULL UNIQUE,
  description text
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for authenticated users only" ON public.categories;
CREATE POLICY "Enable ALL for users in same organization" ON public.categories FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())) WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.products (
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  brand text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  description text,
  base_price numeric(10,2) DEFAULT 0.00,
  selling_price numeric(10,2) DEFAULT 0.00,
  tax_rate numeric(5,2) DEFAULT 18.00,
  unit text DEFAULT 'Pieces',
  min_stock_alert integer DEFAULT 5,
  current_stock integer DEFAULT 0
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for authenticated users only" ON public.products;
CREATE POLICY "Enable ALL for users in same organization" ON public.products FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())) WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.stock_transactions (
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('IN', 'OUT', 'ADJUST')),
  quantity integer NOT NULL,
  reference_no text,
  unit_cost numeric(10,2),
  notes text,
  user_email text
);

ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for authenticated users only" ON public.stock_transactions;
CREATE POLICY "Enable ALL for users in same organization" ON public.stock_transactions FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())) WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.projects (
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  title text NOT NULL,
  project_code text UNIQUE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'LEAD' CHECK (status IN ('LEAD','SURVEY','QUOTED','WON','INSTALLING','COMPLETED','LOST')),
  project_manager text,
  start_date date,
  end_date date,
  contract_value numeric(12,2),
  site_address text,
  scope_notes text
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for authenticated users only" ON public.projects;
CREATE POLICY "Enable ALL for users in same organization" ON public.projects FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())) WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.project_bom (
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_sell_price numeric(10,2) NOT NULL,
  notes text
);

ALTER TABLE public.project_bom ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for authenticated users only" ON public.project_bom;
CREATE POLICY "Enable ALL for users in same organization" ON public.project_bom FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())) WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.quotations (
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  quote_number text UNIQUE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SENT','ACCEPTED','REJECTED','EXPIRED')),
  valid_until date,
  line_items jsonb DEFAULT '[]'::jsonb,
  bom_sell_value numeric(12,2) DEFAULT 0,
  cabling_cost numeric(12,2) DEFAULT 0,
  labor_cost numeric(12,2) DEFAULT 0,
  other_cost numeric(12,2) DEFAULT 0,
  discount_pct numeric(5,2) DEFAULT 0,
  discount_amt numeric(12,2) DEFAULT 0,
  subtotal_after_discount numeric(12,2) DEFAULT 0,
  gst_rate numeric(5,2) DEFAULT 18,
  gst_amt numeric(12,2) DEFAULT 0,
  grand_total numeric(12,2) DEFAULT 0,
  terms_and_conditions text,
  notes text
);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for authenticated users only" ON public.quotations;
CREATE POLICY "Enable ALL for users in same organization" ON public.quotations FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())) WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.amc_contracts (
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  contract_number text UNIQUE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','EXPIRED','CANCELLED','PENDING')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  annual_value numeric(12,2) DEFAULT 0,
  coverage_details text,
  visit_frequency text DEFAULT 'Quarterly',
  notes text
);

ALTER TABLE public.amc_contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for authenticated users only" ON public.amc_contracts;
CREATE POLICY "Enable ALL for users in same organization" ON public.amc_contracts FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())) WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.invoices (
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  invoice_number text UNIQUE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  reference_type text NOT NULL CHECK (reference_type IN ('PROJECT', 'TASK', 'AMC', 'GENERAL')),
  reference_id uuid,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SENT','PARTIAL','PAID','OVERDUE')),
  due_date date,
  subtotal numeric(12,2) DEFAULT 0,
  tax_amt numeric(12,2) DEFAULT 0,
  discount_amt numeric(12,2) DEFAULT 0,
  grand_total numeric(12,2) DEFAULT 0,
  notes text
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for authenticated users only" ON public.invoices;
CREATE POLICY "Enable ALL for users in same organization" ON public.invoices FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())) WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  quantity numeric(10,2) DEFAULT 1,
  unit_price numeric(12,2) DEFAULT 0,
  total_price numeric(12,2) DEFAULT 0
);

ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for authenticated users only" ON public.invoice_line_items;
CREATE POLICY "Enable ALL for users in same organization" ON public.invoice_line_items FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())) WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.expenses (
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  expense_number text UNIQUE NOT NULL,
  category text NOT NULL CHECK (category IN ('PARTS', 'LABOR', 'TRAVEL', 'OFFICE', 'SOFTWARE', 'OTHER')),
  reference_type text DEFAULT 'GENERAL' CHECK (reference_type IN ('PROJECT', 'TASK', 'GENERAL')),
  reference_id uuid,
  amount numeric(12,2) NOT NULL,
  vendor_name text,
  incurred_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PAID')),
  notes text
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for authenticated users only" ON public.expenses;
CREATE POLICY "Enable ALL for users in same organization" ON public.expenses FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())) WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));


CREATE TABLE IF NOT EXISTS public.payment_receipts (
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  receipt_number text UNIQUE NOT NULL,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  amount numeric(12,2) NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_mode text NOT NULL DEFAULT 'Bank Transfer' CHECK (payment_mode IN ('Cash','Cheque','Bank Transfer','UPI','NEFT','RTGS')),
  reference_no text,
  notes text
);

ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for authenticated users only" ON public.payment_receipts;
CREATE POLICY "Enable ALL for users in same organization" ON public.payment_receipts FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())) WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));


CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED')),
  priority text NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  due_date date,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  amc_id uuid REFERENCES public.amc_contracts(id) ON DELETE SET NULL,
  billable boolean DEFAULT false,
  billing_amount numeric(12,2) DEFAULT 0,
  comments jsonb DEFAULT '[]'::jsonb
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for users in same organization" ON public.tasks;
CREATE POLICY "Enable ALL for users in same organization" ON public.tasks 
  FOR ALL TO authenticated 
  USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())) 
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.get_current_org_id()
RETURNS uuid AS $$
DECLARE
    org_id uuid;
BEGIN
    SELECT organization_id INTO org_id FROM public.organization_members WHERE user_id = auth.uid() LIMIT 1;
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.inject_organization_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.organization_id IS NULL THEN
        NEW.organization_id := public.get_current_org_id();
    END IF;
    IF NEW.organization_id IS NULL THEN
        RAISE EXCEPTION 'Cannot insert record: User is not associated with any organization.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
DECLARE 
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'clients', 'suppliers', 'categories', 'products', 'stock_transactions', 'projects', 'project_bom', 'quotations', 'amc_contracts', 'invoices', 'invoice_line_items', 'expenses', 'payment_receipts', 'tasks'
        ])
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_inject_org_id_%1$s ON public.%1$I;
            CREATE TRIGGER trg_inject_org_id_%1$s
            BEFORE INSERT ON public.%1$I
            FOR EACH ROW
            EXECUTE FUNCTION public.inject_organization_id();
        ', tbl);
    END LOOP;
END $$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.add_team_member(
  p_email text,
  p_password text,
  p_role text,
  p_org_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  new_user_id uuid;
BEGIN
  IF p_role NOT IN ('MANAGER', 'TECHNICIAN') THEN
    RAISE EXCEPTION 'Invalid role specified. Must be MANAGER or TECHNICIAN.';
  END IF;

  new_user_id := gen_random_uuid();
  
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, last_sign_in_at, raw_app_meta_data, 
    raw_user_meta_data, is_super_admin, created_at, updated_at
  ) VALUES (
    new_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
    p_email, crypt(p_password, gen_salt('bf')), now(), now(), 
    '{"provider":"email","providers":["email"]}', format('{"email":"%s"}', p_email)::jsonb, 
    false, now(), now()
  );

  INSERT INTO auth.identities (
    id, provider_id, user_id, identity_data, provider, 
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), new_user_id::text, new_user_id, 
    format('{"sub": "%s", "email": "%s", "email_verified": true}', new_user_id::text, p_email)::jsonb, 
    'email', now(), now(), now()
  );

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (p_org_id, new_user_id, p_role);

  RETURN new_user_id;
EXCEPTION 
  WHEN unique_violation THEN
    RAISE EXCEPTION 'A user with this email already exists.';
  WHEN OTHERS THEN
    RAISE;
END;
$func$;

-- ==========================================
-- AMC Automated Task Generation Triggers
-- ==========================================
CREATE OR REPLACE FUNCTION public.create_amc_task_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  client_name text;
BEGIN
  -- Fetch the client name locally for the title
  SELECT name INTO client_name FROM public.clients WHERE id = NEW.client_id LIMIT 1;

  -- Generate the pending tracking task corresponding to the AMC expiration date
  INSERT INTO public.tasks (
    organization_id, 
    title, 
    description, 
    status, 
    priority, 
    due_date
  )
  VALUES (
    NEW.organization_id,
    'AMC Contract Expiration: ' || COALESCE(client_name, 'Unknown Client'),
    'Automated System Alert: AMC Contract #' || NEW.contract_number || ' expires on ' || NEW.end_date || '. Please reach out to the client for renewal processing.',
    'PENDING',
    'HIGH',
    NEW.end_date
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to prevent duplicates on multiple runs
DROP TRIGGER IF EXISTS amc_creation_task_trigger ON public.amc_contracts;

-- Attach trigger natively to amc_contracts insertions
CREATE TRIGGER amc_creation_task_trigger
AFTER INSERT ON public.amc_contracts
FOR EACH ROW
EXECUTE FUNCTION public.create_amc_task_on_insert();

CREATE OR REPLACE FUNCTION public.create_amc_invoice_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.invoices (
    organization_id, 
    invoice_number, 
    client_id, 
    reference_type, 
    reference_id, 
    status, 
    grand_total,
    due_date
  )
  VALUES (
    NEW.organization_id,
    'INV-' || NEW.contract_number,
    NEW.client_id,
    'AMC',
    NEW.id,
    'DRAFT',
    NEW.annual_value,
    NEW.start_date
  )
  ON CONFLICT (invoice_number) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS amc_creation_invoice_trigger ON public.amc_contracts;

CREATE TRIGGER amc_creation_invoice_trigger
AFTER INSERT ON public.amc_contracts
FOR EACH ROW
EXECUTE FUNCTION public.create_amc_invoice_on_insert();

-- ==========================================
-- Audit Log Trail System
-- ==========================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  table_name text NOT NULL,
  record_id text NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  old_data jsonb,
  new_data jsonb,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view audit logs of their organization" ON public.audit_logs;
CREATE POLICY "Users can view audit logs of their organization" ON public.audit_logs FOR SELECT TO authenticated USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.record_audit()
RETURNS trigger AS $$
DECLARE
  org_id uuid;
  user_id uuid;
BEGIN
  user_id := auth.uid();
  IF TG_OP = 'INSERT' THEN
    org_id := NEW.organization_id;
    INSERT INTO public.audit_logs (organization_id, action_type, table_name, record_id, user_id, new_data)
    VALUES (org_id, TG_OP, TG_TABLE_NAME, NEW.id::text, user_id, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    org_id := NEW.organization_id;
    INSERT INTO public.audit_logs (organization_id, action_type, table_name, record_id, user_id, old_data, new_data)
    VALUES (org_id, TG_OP, TG_TABLE_NAME, NEW.id::text, user_id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    org_id := OLD.organization_id;
    INSERT INTO public.audit_logs (organization_id, action_type, table_name, record_id, user_id, old_data)
    VALUES (org_id, TG_OP, TG_TABLE_NAME, OLD.id::text, user_id, row_to_json(OLD)::jsonb);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach Audit Triggers to major tables
DROP TRIGGER IF EXISTS trg_audit_quotations_ins ON public.quotations;
CREATE TRIGGER trg_audit_quotations_ins AFTER INSERT ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.record_audit();
DROP TRIGGER IF EXISTS trg_audit_quotations_upd ON public.quotations;
CREATE TRIGGER trg_audit_quotations_upd AFTER UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.record_audit();
DROP TRIGGER IF EXISTS trg_audit_quotations_del ON public.quotations;
CREATE TRIGGER trg_audit_quotations_del AFTER DELETE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.record_audit();

DROP TRIGGER IF EXISTS trg_audit_invoices_ins ON public.invoices;
CREATE TRIGGER trg_audit_invoices_ins AFTER INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.record_audit();
DROP TRIGGER IF EXISTS trg_audit_invoices_upd ON public.invoices;
CREATE TRIGGER trg_audit_invoices_upd AFTER UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.record_audit();
DROP TRIGGER IF EXISTS trg_audit_invoices_del ON public.invoices;
CREATE TRIGGER trg_audit_invoices_del AFTER DELETE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.record_audit();

-- ==========================================
-- Phase 5 Fixes
-- ==========================================
-- 1. Extend Status Constraint to accommodate post-acceptance events
ALTER TABLE public.quotations DROP CONSTRAINT IF EXISTS quotations_status_check;
ALTER TABLE public.quotations ADD CONSTRAINT quotations_status_check CHECK (status = ANY (ARRAY['DRAFT'::text, 'SENT'::text, 'ACCEPTED'::text, 'REJECTED'::text, 'EXPIRED'::text, 'CANCELLED'::text]));

-- 2. Force PostgREST to reload its schema cache (Fixes PGRST200 where audit_logs to users relation is completely invisible until restart).
NOTIFY pgrst, 'reload schema';
