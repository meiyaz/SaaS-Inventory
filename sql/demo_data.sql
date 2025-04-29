CREATE EXTENSION IF NOT EXISTS pgcrypto;


DO $$
DECLARE
  org1_id UUID := '99999999-0000-0000-0000-000000000001';
  org2_id UUID := '99999999-0000-0000-0000-000000000002';

  cctv_admin UUID   := '00000000-0000-0000-0000-000000000001';
  cctv_manager UUID := '00000000-0000-0000-0000-000000000002';
  cctv_tech UUID    := '00000000-0000-0000-0000-000000000003';

  moto_admin UUID   := '00000000-0000-0000-0000-000000000011';
  moto_manager UUID := '00000000-0000-0000-0000-000000000012';
  moto_tech UUID    := '00000000-0000-0000-0000-000000000013';

BEGIN

  INSERT INTO public.organizations (id, name, billing_email, subscription_tier, gst_number, website) 
  VALUES 
    (org1_id, 'CCTV Sales & Installation', 'admin@cctv.com', 'PRO', '27AABCU9603R1Z2', 'https://www.cctvsales.com'),
    (org2_id, 'Moto Spare Parts & Repair', 'admin@motors.com', 'PRO', '29BBBCU1234S1Z8', 'https://www.motoparts.com')
  ON CONFLICT (id) DO NOTHING;

  DELETE FROM auth.users WHERE email IN (
    'admin@cctv.com', 'manager@cctv.com', 'technician@cctv.com',
    'admin@motors.com', 'manager@motors.com', 'technician@motors.com'
  );

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
    phone, phone_confirmed_at, confirmation_token, recovery_token, email_change_token_new, email_change
  ) 
  VALUES 
    (cctv_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@cctv.com', crypt('123456', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"email":"admin@cctv.com"}', false, now(), now(), NULL, NULL, '', '', '', ''),
    (cctv_manager, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'manager@cctv.com', crypt('123456', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"email":"manager@cctv.com"}', false, now(), now(), NULL, NULL, '', '', '', ''),
    (cctv_tech, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'technician@cctv.com', crypt('123456', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"email":"technician@cctv.com"}', false, now(), now(), NULL, NULL, '', '', '', '')
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email, 
    encrypted_password = EXCLUDED.encrypted_password, 
    raw_user_meta_data = EXCLUDED.raw_user_meta_data;

  INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES 
    (gen_random_uuid(), cctv_admin::text, cctv_admin, format('{"sub": "%s", "email": "%s", "email_verified": true}', cctv_admin::text, 'admin@cctv.com')::jsonb, 'email', now(), now(), now()),
    (gen_random_uuid(), cctv_manager::text, cctv_manager, format('{"sub": "%s", "email": "%s", "email_verified": true}', cctv_manager::text, 'manager@cctv.com')::jsonb, 'email', now(), now(), now()),
    (gen_random_uuid(), cctv_tech::text, cctv_tech, format('{"sub": "%s", "email": "%s", "email_verified": true}', cctv_tech::text, 'technician@cctv.com')::jsonb, 'email', now(), now(), now())
  ON CONFLICT (provider_id, provider) DO UPDATE SET identity_data = EXCLUDED.identity_data;

  INSERT INTO public.users (id, email, raw_user_meta_data) VALUES
    (cctv_admin, 'admin@cctv.com', '{"email":"admin@cctv.com"}'),
    (cctv_manager, 'manager@cctv.com', '{"email":"manager@cctv.com"}'),
    (cctv_tech, 'technician@cctv.com', '{"email":"technician@cctv.com"}')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, raw_user_meta_data = EXCLUDED.raw_user_meta_data;

  INSERT INTO public.organization_members (organization_id, user_id, role) VALUES 
    (org1_id, cctv_admin, 'ADMIN'),
    (org1_id, cctv_manager, 'MANAGER'),
    (org1_id, cctv_tech, 'TECHNICIAN')
  ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role;


  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
    phone, phone_confirmed_at, confirmation_token, recovery_token, email_change_token_new, email_change
  ) 
  VALUES 
    (moto_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@motors.com', crypt('123456', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"email":"admin@motors.com"}', false, now(), now(), NULL, NULL, '', '', '', ''),
    (moto_manager, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'manager@motors.com', crypt('123456', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"email":"manager@motors.com"}', false, now(), now(), NULL, NULL, '', '', '', ''),
    (moto_tech, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'technician@motors.com', crypt('123456', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"email":"technician@motors.com"}', false, now(), now(), NULL, NULL, '', '', '', '')
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email, 
    encrypted_password = EXCLUDED.encrypted_password, 
    raw_user_meta_data = EXCLUDED.raw_user_meta_data;

  INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES 
    (gen_random_uuid(), moto_admin::text, moto_admin, format('{"sub": "%s", "email": "%s", "email_verified": true}', moto_admin::text, 'admin@motors.com')::jsonb, 'email', now(), now(), now()),
    (gen_random_uuid(), moto_manager::text, moto_manager, format('{"sub": "%s", "email": "%s", "email_verified": true}', moto_manager::text, 'manager@motors.com')::jsonb, 'email', now(), now(), now()),
    (gen_random_uuid(), moto_tech::text, moto_tech, format('{"sub": "%s", "email": "%s", "email_verified": true}', moto_tech::text, 'technician@motors.com')::jsonb, 'email', now(), now(), now())
  ON CONFLICT (provider_id, provider) DO UPDATE SET identity_data = EXCLUDED.identity_data;

  INSERT INTO public.users (id, email, raw_user_meta_data) VALUES
    (moto_admin, 'admin@motors.com', '{"email":"admin@motors.com"}'),
    (moto_manager, 'manager@motors.com', '{"email":"manager@motors.com"}'),
    (moto_tech, 'technician@motors.com', '{"email":"technician@motors.com"}')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, raw_user_meta_data = EXCLUDED.raw_user_meta_data;

  INSERT INTO public.organization_members (organization_id, user_id, role) VALUES 
    (org2_id, moto_admin, 'ADMIN'),
    (org2_id, moto_manager, 'MANAGER'),
    (org2_id, moto_tech, 'TECHNICIAN')
  ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role;

END $$;


INSERT INTO public.clients (organization_id, id, name, company_name, email, phone) VALUES
  ('99999999-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Rajesh Sharma', 'SecureTech Ltd', 'rajesh@securetech.com', '+91-98201-11001'),
  ('99999999-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', 'Meena Pillai',  'City Hospital HQ', 'meena@hospital.in', '+91-98201-11002'),
  ('99999999-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', 'Anita Desai', 'Global School Branch', 'admin@globalschool.edu', '+91-98201-22003'),
  ('99999999-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004', 'Vikram Singh', 'Tech Park Alpha', 'vsingh@techpark.com', '+91-98201-22004'),
  ('99999999-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000005', 'Kavita Reddy', 'Reddy Jewellers', 'security@reddyjewels.com', '+91-98201-22005')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.categories (organization_id, id, name, description) VALUES
  ('99999999-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'IP Cameras', 'Network-based PoE cameras'),
  ('99999999-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002', 'Cables', 'Networking cables'),
  ('99999999-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000003', 'Storage NVR', 'Network Video Recorders and HDDs'),
  ('99999999-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000004', 'Access Control', 'Biometrics and Maglocks')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (organization_id, id, sku, name, brand, category_id, description, base_price, selling_price, tax_rate, unit, min_stock_alert, current_stock) VALUES
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 'CAM-HIK-2MP', 'Hikvision 2MP Dome', 'Hikvision', '33333333-0000-0000-0000-000000000001', 'IP Dome Camera IP67', 2200.00, 3500.00, 18, 'Pieces', 5, 20),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000002', 'CAB-CAT6-3', 'Cat6 Cable 300m', 'Polycab', '33333333-0000-0000-0000-000000000002', 'Ethernet Roll', 2500.00, 3800.00, 18, 'Reel', 2, 5),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000003', 'NVR-DAH-16CH', 'Dahua 16-Ch NVR', 'Dahua', '33333333-0000-0000-0000-000000000003', '16 Channel 4K NVR', 8500.00, 12000.00, 18, 'Pieces', 2, 8),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000004', 'HDD-WD-4TB', 'WD Purple 4TB', 'Western Digital', '33333333-0000-0000-0000-000000000003', 'Surveillance Hard Drive', 7500.00, 9500.00, 18, 'Pieces', 3, 14),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000005', 'BIO-ESSL-K9', 'eSSL K9 Biometric', 'eSSL', '33333333-0000-0000-0000-000000000004', 'Fingerprint & RFID Attendance', 4000.00, 6000.00, 18, 'Pieces', 5, 12)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.stock_transactions (organization_id, product_id, transaction_type, quantity, unit_cost, notes, user_email) VALUES
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 'IN', 20, 2200.00, 'Initial Stock', 'admin@cctv.com'),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000002', 'IN', 5, 2500.00, 'Initial Stock', 'admin@cctv.com'),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000003', 'IN', 8, 8500.00, 'Batch 1 Delivery', 'admin@cctv.com'),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000004', 'IN', 14, 7500.00, 'Bulk HDD Order', 'admin@cctv.com'),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000005', 'IN', 12, 4000.00, 'Restock', 'manager@cctv.com'),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 'OUT', 4, null, 'Sent to Hospital Site', 'technician@cctv.com'),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000004', 'OUT', 2, null, 'Used for Reddy Jewellers upgrade', 'technician@cctv.com');

INSERT INTO public.suppliers (organization_id, id, company_name, contact_person, email, phone) VALUES 
  ('99999999-0000-0000-0000-000000000001', '88888888-0000-0000-0000-000000000001', 'Hikvision Core Distributors', 'Amit', 'sales@hikvision-core.com', '+91-98765-00001'),
  ('99999999-0000-0000-0000-000000000001', '88888888-0000-0000-0000-000000000002', 'Global Cables India', 'Vikas', 'orders@globalcables.com', '+91-98765-00002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (organization_id, id, title, project_code, client_id, status, start_date) VALUES 
  ('99999999-0000-0000-0000-000000000001', '77777777-0000-0000-0000-000000000001', 'Hospital Security Overhaul', 'PRJ-2024-001', '11111111-0000-0000-0000-000000000001', 'INSTALLING', CURRENT_DATE - interval '5 days'),
  ('99999999-0000-0000-0000-000000000001', '77777777-0000-0000-0000-000000000002', 'Reddy Jewellers Display Upgrade', 'PRJ-2024-002', '11111111-0000-0000-0000-000000000005', 'WON', CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quotations (organization_id, id, quote_number, project_id, client_id, status, grand_total, valid_until) VALUES 
  ('99999999-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', 'QT-2024-001', '77777777-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'ACCEPTED', 150000.00, CURRENT_DATE + interval '10 days'),
  ('99999999-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000002', 'QT-2024-002', '77777777-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000005', 'ACCEPTED', 85000.00, CURRENT_DATE + interval '5 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.invoices (organization_id, id, invoice_number, client_id, reference_type, reference_id, status, subtotal, tax_amt, grand_total, due_date) VALUES 
  ('99999999-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', 'INV-2024-001', '11111111-0000-0000-0000-000000000001', 'PROJECT', '77777777-0000-0000-0000-000000000001', 'PARTIAL', 127118.64, 22881.36, 150000.00, CURRENT_DATE + interval '10 days'),
  ('99999999-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000002', 'INV-2024-002', '11111111-0000-0000-0000-000000000005', 'PROJECT', '77777777-0000-0000-0000-000000000002', 'DRAFT', 72033.89, 12966.11, 85000.00, CURRENT_DATE + interval '5 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.invoice_line_items (organization_id, invoice_id, description, quantity, unit_price, total_price) VALUES
  ('99999999-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', 'Hospital Security Overhaul Project Phase 1', 1, 127118.64, 127118.64),
  ('99999999-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000002', 'Reddy Jewellers Display Cameras', 1, 72033.89, 72033.89);

INSERT INTO public.payment_receipts (organization_id, id, receipt_number, invoice_id, amount, payment_mode) VALUES 
  ('99999999-0000-0000-0000-000000000001', gen_random_uuid(), 'RCPT-001', '55555555-0000-0000-0000-000000000001', 50000.00, 'Bank Transfer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.expenses (organization_id, id, expense_number, category, reference_type, reference_id, amount, vendor_name, status, notes) VALUES 
  ('99999999-0000-0000-0000-000000000001', gen_random_uuid(), 'EXP-DEMO-001', 'OFFICE', 'GENERAL', null, 25000.00, 'Modern Spaces Coworking', 'PAID', 'Office Rent for October'),
  ('99999999-0000-0000-0000-000000000001', gen_random_uuid(), 'EXP-DEMO-002', 'TRAVEL', 'PROJECT', '77777777-0000-0000-0000-000000000001', 1200.00, 'Uber', 'PAID', 'Travel to Hospital Site for cabling audit')
ON CONFLICT (expense_number) DO NOTHING;

INSERT INTO public.tasks (organization_id, title, description, assigned_to, created_by, status, priority, due_date, project_id, amc_id, billable, billing_amount, comments) VALUES 
  ('99999999-0000-0000-0000-000000000001', 'City Hospital NVR Setup', 'Install dual 16CH NVR at server room', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'PENDING', 'HIGH', CURRENT_DATE + interval '2 days', '77777777-0000-0000-0000-000000000001', null, false, 0, '[{"text": "Awaiting gate pass to enter server room.", "author": "technician@cctv.com", "timestamp": "2024-10-18T09:00:00Z"}]'::jsonb),
  ('99999999-0000-0000-0000-000000000001', 'Warehouse Camera Fix', 'Lens cleaning and POE fix near Dock 4', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'COMPLETED', 'MEDIUM', CURRENT_DATE - interval '1 days', null, null, true, 1500.00, '[{"text": "Cleaned lens and tested ping.", "author": "technician@cctv.com", "timestamp": "2024-10-19T10:15:00Z"}]'::jsonb),
  ('99999999-0000-0000-0000-000000000001', 'Tech Park Access Control Audit', 'Test all biometric scanners for offline mode syncing.', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'IN_PROGRESS', 'MEDIUM', CURRENT_DATE, '77777777-0000-0000-0000-000000000002', null, false, 0, '[]'::jsonb),
  ('99999999-0000-0000-0000-000000000001', 'Reddy Jewellers HDD Upgrade', 'Swap 2TB drives for 4TB Purple drives.', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'PENDING', 'HIGH', CURRENT_DATE + interval '1 days', '77777777-0000-0000-0000-000000000002', null, true, 12000.00, '[{"text": "Checked drives out of inventory today.", "author": "manager@cctv.com", "timestamp": "2024-10-20T14:30:00Z"}]'::jsonb);

INSERT INTO public.amc_contracts (organization_id, id, client_id, contract_number, start_date, end_date, annual_value, status, coverage_details) VALUES
  ('99999999-0000-0000-0000-000000000001', gen_random_uuid(), '11111111-0000-0000-0000-000000000002', 'AMC-2024-001', CURRENT_DATE - interval '6 months', CURRENT_DATE + interval '6 months', 45000.00, 'ACTIVE', 'Quarterly maintenance of 40 cameras and 3 NVRs.'),
  ('99999999-0000-0000-0000-000000000001', gen_random_uuid(), '11111111-0000-0000-0000-000000000001', 'AMC-2024-002', CURRENT_DATE - interval '11 months', CURRENT_DATE + interval '1 months', 22000.00, 'ACTIVE', 'Biomertic software updates and maglock alignments.');

INSERT INTO public.clients (organization_id, id, name, company_name, email, phone) VALUES
  ('99999999-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000011', 'Rahul Kumar', 'Speed Track Racing', 'rahul@speedtrack.com', '+91-98801-11001'),
  ('99999999-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000012', 'Arvind Patel', 'Gujarat Auto Works', 'arvind@gujauto.in', '+91-98801-11002'),
  ('99999999-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000013', 'Sanjay Dutt', 'Dutt Logistics Fleet', 'fleet@duttlogistics.com', '+91-98801-11003'),
  ('99999999-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000014', 'Imran Khan', 'Khan Motors', 'imran@khanmotors.com', '+91-98801-11004')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.categories (organization_id, id, name, description) VALUES
  ('99999999-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000011', 'Engine Components', 'Pistons, valves, and belts'),
  ('99999999-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000012', 'Consumables', 'Oils, filters, brakes'),
  ('99999999-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000013', 'Electrical', 'Batteries, relays, led lights'),
  ('99999999-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000014', 'Gear & Accessories', 'Helmets, riding jackets')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (organization_id, id, sku, name, brand, category_id, description, base_price, selling_price, tax_rate, unit, min_stock_alert, current_stock) VALUES
  ('99999999-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000011', 'ENG-PIS-001', 'Forged Racing Piston Set', 'Mahle', '33333333-0000-0000-0000-000000000011', 'High comp piston kit', 4500.00, 7500.00, 28, 'Set', 3, 10),
  ('99999999-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000012', 'OIL-SYN-10W40', '10W40 Fully Synthetic', 'Motul', '33333333-0000-0000-0000-000000000012', '1L Engine Oil', 800.00, 1100.00, 18, 'Bottles', 20, 15),
  ('99999999-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000013', 'BAT-12V-7AH', '12V 7AH VRLA Battery', 'Exide', '33333333-0000-0000-0000-000000000013', 'Maintenance Free Battery', 1100.00, 1650.00, 28, 'Pieces', 10, 22),
  ('99999999-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000014', 'LED-H4-WHT', 'H4 White LED Headlight', 'Philips', '33333333-0000-0000-0000-000000000013', '6000k Ultra Bright', 1800.00, 2400.00, 18, 'Pair', 5, 8)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.stock_transactions (organization_id, product_id, transaction_type, quantity, unit_cost, notes, user_email) VALUES
  ('99999999-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000011', 'IN', 10, 4500.00, 'Initial Stock', 'admin@motors.com'),
  ('99999999-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000012', 'IN', 15, 800.00, 'Stock critically low', 'admin@motors.com'),
  ('99999999-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000013', 'IN', 22, 1100.00, 'Distributor Batch', 'admin@motors.com'),
  ('99999999-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000014', 'IN', 8, 1800.00, 'Distributor Batch', 'admin@motors.com'),
  ('99999999-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000011', 'OUT', 1, null, 'Issued for engine rebuild', 'technician@motors.com');

INSERT INTO public.suppliers (organization_id, id, company_name, contact_person, email, phone) VALUES 
  ('99999999-0000-0000-0000-000000000002', '88888888-0000-0000-0000-000000000011', 'Motul Wholesales', 'Sameer', 'orders@motulindia.com', '+91-98765-00011'),
  ('99999999-0000-0000-0000-000000000002', '88888888-0000-0000-0000-000000000012', 'Exide Authorized Dist', 'Priya', 'sales@exidedelhi.com', '+91-98765-00012')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (organization_id, id, title, project_code, client_id, status, start_date) VALUES 
  ('99999999-0000-0000-0000-000000000002', '77777777-0000-0000-0000-000000000011', 'Fleet Maintenance Run #1', 'SRV-2024-001', '11111111-0000-0000-0000-000000000013', 'COMPLETED', CURRENT_DATE - interval '10 days'),
  ('99999999-0000-0000-0000-000000000002', '77777777-0000-0000-0000-000000000012', 'Track Bike Racing Rebuild', 'SRV-2024-002', '11111111-0000-0000-0000-000000000011', 'INSTALLING', CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quotations (organization_id, id, quote_number, project_id, client_id, status, grand_total, valid_until) VALUES 
  ('99999999-0000-0000-0000-000000000002', '66666666-0000-0000-0000-000000000011', 'QT-2024-M01', '77777777-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000013', 'ACCEPTED', 45000.00, CURRENT_DATE + interval '3 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.invoices (organization_id, id, invoice_number, client_id, reference_type, reference_id, status, subtotal, tax_amt, grand_total, due_date) VALUES 
  ('99999999-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000011', 'INV-M01', '11111111-0000-0000-0000-000000000013', 'PROJECT', '77777777-0000-0000-0000-000000000011', 'PAID', 38135.59, 6864.41, 45000.00, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.invoice_line_items (organization_id, invoice_id, description, quantity, unit_price, total_price) VALUES
  ('99999999-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000011', 'Fleet Maintenance Run Cost', 1, 38135.59, 38135.59);

INSERT INTO public.payment_receipts (organization_id, id, receipt_number, invoice_id, amount, payment_mode) VALUES 
  ('99999999-0000-0000-0000-000000000002', gen_random_uuid(), 'RCPT-M01', '55555555-0000-0000-0000-000000000011', 45000.00, 'UPI')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.expenses (organization_id, id, expense_number, category, reference_type, reference_id, amount, vendor_name, status, notes) VALUES 
  ('99999999-0000-0000-0000-000000000002', gen_random_uuid(), 'EXP-M01', 'LABOR', 'GENERAL', null, 15000.00, 'Mechanic Guild Freelancer', 'UNPAID', 'Outsourced labor for engine block machining')
ON CONFLICT (expense_number) DO NOTHING;

INSERT INTO public.tasks (organization_id, title, description, assigned_to, created_by, status, priority, due_date, project_id, amc_id, billable, billing_amount, comments) VALUES 
  ('99999999-0000-0000-0000-000000000002', 'Engine Rebuild: RJ-14-1234', 'Strip engine, replace piston set, seal headers', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000012', 'IN_PROGRESS', 'HIGH', CURRENT_DATE, '77777777-0000-0000-0000-000000000012', null, true, 8000.00, '[{"text": "Engine stripped. Awaiting machining.", "author": "technician@motors.com", "timestamp": "2024-10-18T09:00:00Z"}]'::jsonb),
  ('99999999-0000-0000-0000-000000000002', 'Dispatch Oil Crates', 'Send 5 boxes of Motul to Gujarat Garage', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000011', 'PENDING', 'MEDIUM', CURRENT_DATE + interval '3 days', null, null, false, 0, '[{"text": "Packed and ready for dispatch.", "author": "technician@motors.com", "timestamp": "2024-10-18T09:00:00Z"}]'::jsonb),
  ('99999999-0000-0000-0000-000000000002', 'Fleet Maintenance: Dutt Logistics', 'Perform 10k service including brake pads and oil change on 3 trucks.', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000012', 'PENDING', 'HIGH', CURRENT_DATE + interval '2 days', '77777777-0000-0000-0000-000000000011', null, false, 0, '[]'::jsonb),
  ('99999999-0000-0000-0000-000000000002', 'Electrical Diagnosis: KA-01-9922', 'Check battery drain issue and rectify wiring shorts.', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000012', 'COMPLETED', 'MEDIUM', CURRENT_DATE - interval '2 days', null, null, true, 2500.00, '[{"text": "Replaced relay. No drain found.", "author": "technician@motors.com", "timestamp": "2024-10-21T09:00:00Z"}]'::jsonb);

INSERT INTO public.amc_contracts (organization_id, id, client_id, contract_number, start_date, end_date, annual_value, status, coverage_details) VALUES
  ('99999999-0000-0000-0000-000000000002', gen_random_uuid(), '11111111-0000-0000-0000-000000000013', 'FLEET-AMC-001', CURRENT_DATE - interval '2 months', CURRENT_DATE + interval '10 months', 120000.00, 'ACTIVE', 'Annual maintenance for all logistics vehicles including oil checks.');
