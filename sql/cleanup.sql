DO $$
BEGIN
  DELETE FROM auth.users WHERE email IN (
    'admin@cctv.com', 'manager@cctv.com', 'technician@cctv.com',
    'admin@motors.com', 'manager@motors.com', 'technician@motors.com'
  );
END $$;

DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.payment_receipts CASCADE;
DROP TABLE IF EXISTS public.amc_contracts CASCADE;
DROP TABLE IF EXISTS public.quotations CASCADE;
DROP TABLE IF EXISTS public.project_bom CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.stock_transactions CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.organization_members CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

DROP FUNCTION IF EXISTS public.inject_organization_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_org_id() CASCADE;
DROP FUNCTION IF EXISTS public.add_team_member(text, text, text, uuid) CASCADE;
