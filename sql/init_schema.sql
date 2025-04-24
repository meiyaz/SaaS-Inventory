CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text,
  billing_email text,
  subscription_tier text DEFAULT 'FREE',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'TECHNICIAN')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
CREATE POLICY "Users can view their organization" ON public.organizations FOR SELECT TO authenticated USING (id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
CREATE POLICY "Users can create organizations" ON public.organizations FOR INSERT TO authenticated WITH CHECK (true);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view members of their organization" ON public.organization_members;
CREATE POLICY "Users can view members of their organization" ON public.organization_members FOR SELECT TO authenticated USING (user_id = auth.uid());
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
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SENT','ACCEPTED','REJECTED','EXPIRED')),
  valid_until date,
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

CREATE TABLE IF NOT EXISTS public.payment_receipts (
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  receipt_number text UNIQUE NOT NULL,
  quotation_id uuid REFERENCES public.quotations(id) ON DELETE CASCADE NOT NULL,
  amount numeric(12,2) NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_mode text NOT NULL DEFAULT 'Bank Transfer' CHECK (payment_mode IN ('Cash','Cheque','Bank Transfer','UPI','NEFT','RTGS')),
  reference_no text,
  notes text
);

ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable ALL for authenticated users only" ON public.payment_receipts;
CREATE POLICY "Enable ALL for users in same organization" ON public.payment_receipts FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())) WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));


-- ==========================================
-- PostgreSQL Trigger: Auto-inject organization_id
-- ==========================================
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
            'clients', 'suppliers', 'categories', 'products', 'stock_transactions', 'projects', 'project_bom', 'quotations', 'amc_contracts', 'payment_receipts'
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
