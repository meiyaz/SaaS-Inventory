CREATE EXTENSION IF NOT EXISTS pgcrypto;


DO $$
DECLARE
  admin_uid UUID := '00000000-0000-0000-0000-000000000001';
  manager_uid UUID := '00000000-0000-0000-0000-000000000002';
  tech_uid UUID := '00000000-0000-0000-0000-000000000003';
BEGIN

  INSERT INTO public.organizations (id, name, billing_email, subscription_tier) 
  VALUES ('99999999-0000-0000-0000-000000000001', 'SaaS Inventory Demo HQ', 'admin@company.com', 'PRO')
  ON CONFLICT (id) DO NOTHING;

  DELETE FROM auth.users WHERE email IN ('admin@company.com', 'manager@company.com', 'technician@company.com');

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
    last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, 
    created_at, updated_at, phone, phone_confirmed_at, confirmation_token, 
    recovery_token, email_change_token_new, email_change
  ) VALUES (
    admin_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@company.com', 
    crypt('123456', gen_salt('bf')), now(), now(), 
    '{"provider":"email","providers":["email"]}', '{"email":"admin@company.com"}', false,
    now(), now(), NULL, NULL, '', '', '', ''
  );
    
  INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), admin_uid::text, admin_uid, format('{"sub": "%s", "email": "%s", "email_verified": true, "phone_verified": false}', admin_uid::text, 'admin@company.com')::jsonb, 'email', now(), now(), now());

  INSERT INTO public.organization_members (organization_id, user_id, role) VALUES ('99999999-0000-0000-0000-000000000001', admin_uid, 'ADMIN') ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'ADMIN';

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
    last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, 
    created_at, updated_at, phone, phone_confirmed_at, confirmation_token, 
    recovery_token, email_change_token_new, email_change
  ) VALUES (
    manager_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'manager@company.com', 
    crypt('123456', gen_salt('bf')), now(), now(), 
    '{"provider":"email","providers":["email"]}', '{"email":"manager@company.com"}', false,
    now(), now(), NULL, NULL, '', '', '', ''
  );
    
  INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), manager_uid::text, manager_uid, format('{"sub": "%s", "email": "%s", "email_verified": true, "phone_verified": false}', manager_uid::text, 'manager@company.com')::jsonb, 'email', now(), now(), now());

  INSERT INTO public.organization_members (organization_id, user_id, role) VALUES ('99999999-0000-0000-0000-000000000001', manager_uid, 'MANAGER') ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'MANAGER';

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
    last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, 
    created_at, updated_at, phone, phone_confirmed_at, confirmation_token, 
    recovery_token, email_change_token_new, email_change
  ) VALUES (
    tech_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'technician@company.com', 
    crypt('123456', gen_salt('bf')), now(), now(), 
    '{"provider":"email","providers":["email"]}', '{"email":"technician@company.com"}', false,
    now(), now(), NULL, NULL, '', '', '', ''
  );
    
  INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), tech_uid::text, tech_uid, format('{"sub": "%s", "email": "%s", "email_verified": true, "phone_verified": false}', tech_uid::text, 'technician@company.com')::jsonb, 'email', now(), now(), now());

  INSERT INTO public.organization_members (organization_id, user_id, role) VALUES ('99999999-0000-0000-0000-000000000001', tech_uid, 'TECHNICIAN') ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'TECHNICIAN';
END $$;


INSERT INTO public.clients (organization_id, id, name, company_name, email, phone, address, gst_number) VALUES
  ('99999999-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Rajesh Sharma',   'Tata Motors Ltd.',          'rajesh@tatamotors.com',   '+91-98201-11001', '1 Tata Lane, MIDC, Pune, Maharashtra',            '27AABCT3518Q1ZJ'),
  ('99999999-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', 'Meena Pillai',    'InfoEdge India Pvt. Ltd.',  'meena@infoedge.in',       '+91-98201-11002', 'D-28, Sector 3, Noida, Uttar Pradesh 201301',     '09AAACI5754H1ZR'),
  ('99999999-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', 'Suresh Nair',     'Reliance Retail Ltd.',      'suresh.nair@jiomart.com', '+91-98201-11003', 'Maker Chambers IV, BKC, Mumbai, Maharashtra',     '27AAACR5055K1Z5'),
  ('99999999-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004', 'Anjali Kapoor',   'HDFC Bank Limited',         'anjali.k@hdfcbank.com',   '+91-98201-11004', 'HDFC House, Lower Parel, Mumbai, Maharashtra',    '27AACCH0001A1ZH'),
  ('99999999-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000005', 'Vikram Mehta',    'BJP Office - Maharashtra',  'vmehta@mls.org.in',       '+91-98201-11005', 'Plot 12, Nariman Point, Mumbai, Maharashtra',     NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.suppliers (organization_id, id, company_name, contact_person, email, phone, address, gst_number, categories, payment_terms) VALUES
  ('99999999-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'CP Plus India Pvt. Ltd.',    'Pankaj Dubey',    'pankaj@cpplus.in',        '+91-95001-22001', 'Plot A4, Udyog Nagar, Delhi',       '07AABCC7698N1Z2', 'Cameras, NVR, DVR',       'Net 30'),
  ('99999999-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', 'Hikvision India Pvt. Ltd.',  'Srinivas Rao',    'srao@hikvision.com',      '+91-95001-22002', 'Baner Road, Pune, Maharashtra',     '27AACCH1234B1Z5', 'Cameras, NVR, Accessories','Net 15'),
  ('99999999-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000003', 'Dahua Technology India',     'Deepak Thakur',   'dthakur@dahuasecurity.in','+91-95001-22003', 'Saket Dist. Centre, New Delhi',    '07AABCD9876C1ZK', 'Cameras, NVR, DVR',       'Advance'),
  ('99999999-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000004', 'Ravi Cable Industries',      'Harish Goel',     'harish@ravicables.com',   '+91-95001-22004', 'GIDC Estate, Surat, Gujarat',      '24AABCR1122D1Z3', 'Cables, Accessories',     'Net 45')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.categories (organization_id, id, name, description) VALUES
  ('99999999-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'IP Cameras',         'Network-based PoE surveillance cameras'),
  ('99999999-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002', 'Analog Cameras',     'Traditional CVBS/TVI/AHD cameras'),
  ('99999999-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000003', 'NVR / DVR',          'Network and Digital Video Recorders'),
  ('99999999-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000004', 'Cables & Conduits',  'Co-axial, Cat6, power and conduit wiring'),
  ('99999999-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000005', 'Accessories',        'Mounts, JBs, switches, power supplies')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (organization_id, id, sku, name, brand, category_id, supplier_id, description, base_price, selling_price, tax_rate, unit, min_stock_alert, current_stock) VALUES
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 'CAM-HIK-2MP-DOM', 'Hikvision 2MP Dome Camera',      'Hikvision', '33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', 'DS-2CD1123G2I, 2.8mm, H.265+, IR 30m, PoE, IP67',        2200.00,  3500.00, 18, 'Pieces', 5,  42),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000002', 'CAM-HIK-5MP-BUL', 'Hikvision 5MP Bullet Camera',    'Hikvision', '33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', 'DS-2CD2055G1-I, 4mm, H.265+, IR 50m, PoE, IP67, WDR 120dB', 3800.00,  6200.00, 18, 'Pieces', 5,  28),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000003', 'CAM-CPP-2MP-PTZ', 'CP Plus 2MP PTZ Camera',         'CP Plus',   '33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'CP-UNP-2301L3-D, 23x Optical Zoom, IR 100m, PoE',        12500.00, 19000.00, 18, 'Pieces', 2,  8 ),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000004', 'CAM-DAH-4MP-TUR', 'Dahua 4MP Turret Camera (WizSense)', 'Dahua', '33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000003', 'IPC-HDW2849H-S-IL, 2.8mm, Full-Color, SMD+, H.265+',     3200.00,  5100.00, 18, 'Pieces', 5,  15),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000005', 'NVR-HIK-8CH-4K',  'Hikvision 8CH 4K NVR',           'Hikvision', '33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000002', 'DS-7608NXI-K2, 8CH, 4K, H.265+, 2 SATA, PoE Out 8CH',   7500.00, 11500.00, 18, 'Pieces', 2,  12),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000006', 'NVR-CPP-16CH',    'CP Plus 16CH NVR',               'CP Plus',   '33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001', 'CP-UVR-1601K2-I2, 16CH, H.265+, 2 SATA',                 9000.00, 14500.00, 18, 'Pieces', 2,  6 ),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000007', 'HDD-SEA-4TB',     'Seagate SkyHawk 4TB HDD',        'Seagate',   '33333333-0000-0000-0000-000000000005', NULL,                                   '4TB, 5400 RPM, SATA 6Gb/s, Surveillance Optimised',        4800.00,  7200.00, 18, 'Pieces', 4,  20),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000008', 'CAB-COAX-RG6-100','RG6 Coaxial Cable (100m Roll)',   'Finolex',   '33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000004', 'RG6/U with power, 100m, White',                            900.00,  1500.00, 18, 'Roll',   3,  35),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000009', 'CAB-CAT6-300',    'Cat6 Ethernet Cable (300m Reel)', 'Polycab',   '33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000004', 'Cat 6 UTP, 0.58mm Copper, 300m Reel',                     2800.00,  4500.00, 18, 'Reel',   2,  10),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000010', 'ACC-POE-8P',      '8-Port PoE Switch (60W)',         'D-Link',    '33333333-0000-0000-0000-000000000005', NULL,                                   'DGS-F1010P-E, 8x PoE 802.3at, 2x Uplink, 60W Total',      2200.00,  3800.00, 18, 'Pieces', 3,  18)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.stock_transactions (organization_id, product_id, transaction_type, quantity, unit_cost, reference_no, notes, user_email) VALUES
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 'IN', 50, 2200.00, 'PO-2024-001', 'Initial stock from Hikvision distributor', 'admin@cctv.com'),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000002', 'IN', 30, 3800.00, 'PO-2024-001', 'Initial stock from Hikvision distributor', 'admin@cctv.com'),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000003', 'IN', 10, 12500.00,'PO-2024-002', 'CP Plus PTZ cameras batch 1',               'admin@cctv.com'),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000004', 'IN', 20, 3200.00, 'PO-2024-003', 'Dahua WizSense batch from Dahua India',     'admin@cctv.com'),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000005', 'IN', 15, 7500.00, 'PO-2024-001', 'NVR batch from Hikvision distributor',      'admin@cctv.com'),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000006', 'IN', 8,  9000.00, 'PO-2024-002', 'CP Plus 16CH NVR stock',                    'admin@cctv.com'),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000007', 'IN', 25, 4800.00, 'PO-2024-004', 'Seagate SkyHawk HDDs - batch 1',            'admin@cctv.com'),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000008', 'IN', 40, 900.00,  'PO-2024-005', 'RG6 cable rolls from Ravi Cables',          'admin@cctv.com'),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000009', 'IN', 12, 2800.00, 'PO-2024-005', 'Cat6 reels from Ravi Cables',               'admin@cctv.com'),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000010', 'IN', 20, 2200.00, 'PO-2024-006', 'D-Link PoE switches batch',                 'admin@cctv.com'),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 'OUT', 8,  3500.00, 'PRJ-TATA-01', 'Tata Motors Pune factory installation',    'admin@cctv.com'),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000002', 'OUT', 2,  6200.00, 'PRJ-TATA-01', 'Tata Motors - perimeter coverage',         'admin@cctv.com'),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000005', 'OUT', 3,  11500.00,'PRJ-TATA-01', 'Tata Motors - 3x 8CH NVR units',           'admin@cctv.com'),
  ('99999999-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000007', 'OUT', 5,  7200.00, 'PRJ-TATA-01', 'Tata Motors - 4TB HDD per NVR',            'admin@cctv.com');

INSERT INTO public.projects (organization_id, id, title, project_code, client_id, status, project_manager, start_date, end_date, contract_value, site_address, scope_notes) VALUES
  ('99999999-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', 'Tata Motors Pune Factory - Shop Floor CCTV', 'PRJ-TATA-01', '11111111-0000-0000-0000-000000000001', 'INSTALLING', 'Kavya Menon', '2024-10-01', '2024-11-30', 385000.00, 'MIDC Bhosari, Survey No 1, Pune, Maharashtra 411026', '42 IP cameras (mix of dome and bullet), 3x 8CH NVRs, server room integration, access point coverage of main floor and perimeter. 300m of Cat6 + power.'),
  ('99999999-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000002', 'InfoEdge Noida Corporate Office',            'PRJ-INFO-01', '11111111-0000-0000-0000-000000000002', 'QUOTED',     'Rajan Tiwari', '2024-11-15', '2024-12-31', 220000.00, 'D-28, Sector 3, Noida, UP 201301',                                 '22 Dome cameras across 4 floors, 2x 16CH NVR, ANPR camera for parking exit, biometric integration pending.'),
  ('99999999-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000003', 'Reliance Retail Nagpur Outlet',              'PRJ-REL-01',  '11111111-0000-0000-0000-000000000003', 'COMPLETED',  'Kavya Menon', '2024-08-01', '2024-09-15', 145000.00, 'Empress City Mall, Nagpur, Maharashtra',                           '18 IP cameras, 1x 16CH NVR, 4TB HDD, 200m RG6, basic installation. Handover done.'),
  ('99999999-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000004', 'HDFC Bank Branch - Andheri CCTV Refresh',   'PRJ-HDFC-01', '11111111-0000-0000-0000-000000000004', 'SURVEY',     'Rajan Tiwari', '2024-12-01', NULL,          NULL,         '42 Andheri West Branch, Mumbai, Maharashtra',                  'Client wants full replacement of analog system with IP. Site survey in progress. Potential 30+ camera project.'),
  ('99999999-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000005', 'Maharashtra BJP Office - Nariman Point',    'PRJ-BJP-01',  '11111111-0000-0000-0000-000000000005', 'LEAD',       NULL,           NULL,         NULL,          NULL,         'Nariman Point, Mumbai, Maharashtra',                           'Initial inquiry via referral. Need to survey 3 floors, parking, and entrance area.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.project_bom (organization_id, project_id, product_id, quantity, unit_sell_price, notes) VALUES
  ('99999999-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 30, 3500.00, 'Shop floor dome cameras'),
  ('99999999-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000002', 12, 6200.00, 'Parking and perimeter bullet cameras'),
  ('99999999-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000005', 3,  11500.00,'1 NVR per zone'),
  ('99999999-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000007', 3,  7200.00, '4TB SkyHawk per NVR'),
  ('99999999-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000009', 2,  4500.00, '2x 300m Cat6 reels'),
  ('99999999-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000010', 4,  3800.00, '4x 8-port PoE switches'),
  ('99999999-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000001', 22, 3500.00, 'Dome cameras - all 4 floors'),
  ('99999999-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000006', 2,  14500.00,'2x 16CH NVRs'),
  ('99999999-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000007', 2,  7200.00, '4TB per NVR'),
  ('99999999-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000009', 1,  4500.00, '1x Cat6 300m reel');

INSERT INTO public.quotations (
  organization_id, id, quote_number, project_id, status, valid_until,
  bom_sell_value, cabling_cost, labor_cost, other_cost,
  discount_pct, discount_amt, subtotal_after_discount,
  gst_rate, gst_amt, grand_total,
  terms_and_conditions, notes
) VALUES (
  '99999999-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', 'QT-2410-0001', '55555555-0000-0000-0000-000000000001', 'ACCEPTED', '2024-10-31',
  248000.00, 10500.00, 25000.00, 0.00,
  5.00, 14175.00, 269325.00,
  18.00, 48478.50, 317803.50,
  '1. Valid for 30 days from date of issue.\n2. 50% advance payment required to confirm order.\n3. Balance due on project completion.\n4. 1 Year warranty on hardware, 90 Days on Labour.',
  'Rate includes site cable pulling. 300m Cat6 and power wiring considered.'
) ON CONFLICT (quote_number) DO UPDATE SET id = EXCLUDED.id;

INSERT INTO public.amc_contracts (
  organization_id, contract_number, client_id, start_date, end_date,
  annual_value, status, coverage_details
) VALUES (
  '99999999-0000-0000-0000-000000000001', 'AMC-2024-001', '11111111-0000-0000-0000-000000000003', '2024-10-01', '2025-09-30',
  25000.00, 'ACTIVE', 'Comprehensive AMC for 18 cameras and 1 NVR at Nagpur outlet. 4 preventive visits/year.'
), (
  '99999999-0000-0000-0000-000000000001', 'AMC-2024-002', '11111111-0000-0000-0000-000000000002', '2023-11-01', '2024-10-31',
  35000.00, 'EXPIRED', 'Non-comprehensive AMC. Labour only for 22 cameras at Noida HQ.'
) ON CONFLICT (contract_number) DO NOTHING;

INSERT INTO public.payment_receipts (
  organization_id, receipt_number, quotation_id, amount, payment_date,
  payment_mode, reference_no, notes
) VALUES (
  '99999999-0000-0000-0000-000000000001', 'REC-24-001', '66666666-0000-0000-0000-000000000001',
  158900.00, '2024-10-15', 'Bank Transfer', 'UTR-HDFC-123456', '50% Advance against QT-2410-0001'
) ON CONFLICT (receipt_number) DO NOTHING;

