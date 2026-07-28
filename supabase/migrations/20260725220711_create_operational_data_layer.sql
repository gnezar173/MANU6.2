/*
# Create Operational Data Layer for Real Factory Data

## Purpose
Creates the database structure for real factory operational data, replacing
the hardcoded demo arrays in `src/data/factoryData.ts`. All tables are scoped
to a factory via `factory_id` so the platform can host multiple factories
(real customer factories alongside the demo factory).

The existing demo factory (is_demo = true, seeded by the previous migration)
is linked to seeded demo operational data so the "real data" path is testable
without changing the UI or AI logic.

## 1. New Tables (all scoped by factory_id, text ids matching existing code ids)

- `production_lines`, `products`, `machines`, `process_stages`,
  `raw_materials`, `shift_data`, `defect_records`, `downtime_events`,
  `energy_records` — see inline comments for columns.

## 2. Security
- RLS enabled on every table.
- Single-tenant demo mode: anon + authenticated CRUD allowed — the app has
  no sign-in screen, so the anon-key client must read/write.

## 3. Indexes
- factory_id index on every operational table.

## 4. Seed
- Reference data + 14 days of shift/energy data for the demo factory,
  mirroring the JS demo generator. All inserts guarded by NOT EXISTS.

## 5. Important Notes
- Text `id` columns keep the same values as the hardcoded demo data
  ('line-1', 'm-mold-2', 'shift-...-line-1-1') so the AI engine and modules
  can later consume database data WITHOUT changing id comparisons.
- Safe to re-run (timeouts after commit do not cause duplicate seeds).
*/

-- =====================================================
-- production_lines
-- =====================================================
CREATE TABLE IF NOT EXISTS production_lines (
  factory_id uuid NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  id text NOT NULL,
  name text,
  name_ar text NOT NULL,
  products text[] DEFAULT '{}',
  shift_capacity integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (factory_id, id)
);
ALTER TABLE production_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_production_lines_all" ON production_lines;
CREATE POLICY "anon_production_lines_all" ON production_lines FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_production_lines_factory ON production_lines(factory_id);

-- =====================================================
-- products
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  factory_id uuid NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  id text NOT NULL,
  name text NOT NULL,
  size text NOT NULL,
  capacity_liters integer DEFAULT 0,
  cycle_time_min integer DEFAULT 0,
  material_kg numeric DEFAULT 0,
  unit_cost integer DEFAULT 0,
  unit_price integer DEFAULT 0,
  line_id text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (factory_id, id)
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_products_all" ON products;
CREATE POLICY "anon_products_all" ON products FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_products_factory ON products(factory_id);

-- =====================================================
-- machines
-- =====================================================
CREATE TABLE IF NOT EXISTS machines (
  factory_id uuid NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  id text NOT NULL,
  name text NOT NULL,
  name_ar text NOT NULL,
  type text NOT NULL,
  line_id text,
  status text NOT NULL DEFAULT 'running',
  availability numeric DEFAULT 0,
  performance numeric DEFAULT 0,
  quality numeric DEFAULT 0,
  oee numeric DEFAULT 0,
  downtime_hours numeric DEFAULT 0,
  mtbf_hours numeric DEFAULT 0,
  mttr_hours numeric DEFAULT 0,
  last_maintenance date,
  next_maintenance date,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (factory_id, id)
);
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_machines_all" ON machines;
CREATE POLICY "anon_machines_all" ON machines FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_machines_factory ON machines(factory_id);

-- =====================================================
-- process_stages
-- =====================================================
CREATE TABLE IF NOT EXISTS process_stages (
  factory_id uuid NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  id text NOT NULL,
  step text NOT NULL,
  name_ar text NOT NULL,
  name_en text,
  sort_order integer NOT NULL DEFAULT 0,
  cycle_time_min integer DEFAULT 0,
  yield_rate integer DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (factory_id, id)
);
ALTER TABLE process_stages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_process_stages_all" ON process_stages;
CREATE POLICY "anon_process_stages_all" ON process_stages FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_process_stages_factory ON process_stages(factory_id);

-- =====================================================
-- raw_materials
-- =====================================================
CREATE TABLE IF NOT EXISTS raw_materials (
  factory_id uuid NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  id text NOT NULL,
  name_ar text NOT NULL,
  name_en text,
  unit text DEFAULT 'كجم',
  stock_kg numeric DEFAULT 0,
  consumption_per_day_kg numeric DEFAULT 0,
  unit_cost integer DEFAULT 0,
  supplier text,
  lead_time_days integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (factory_id, id)
);
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_raw_materials_all" ON raw_materials;
CREATE POLICY "anon_raw_materials_all" ON raw_materials FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_raw_materials_factory ON raw_materials(factory_id);

-- =====================================================
-- shift_data
-- =====================================================
CREATE TABLE IF NOT EXISTS shift_data (
  factory_id uuid NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  id text NOT NULL,
  shift_name text NOT NULL,
  date date NOT NULL,
  line_id text NOT NULL,
  planned_units integer DEFAULT 0,
  actual_units integer DEFAULT 0,
  good_units integer DEFAULT 0,
  defect_units integer DEFAULT 0,
  scrap_kg integer DEFAULT 0,
  runtime_hours numeric DEFAULT 0,
  downtime_hours numeric DEFAULT 0,
  energy_kwh integer DEFAULT 0,
  energy_cost integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (factory_id, id)
);
ALTER TABLE shift_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_shift_data_all" ON shift_data;
CREATE POLICY "anon_shift_data_all" ON shift_data FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_shift_data_factory ON shift_data(factory_id);
CREATE INDEX IF NOT EXISTS idx_shift_data_factory_date ON shift_data(factory_id, date);

-- =====================================================
-- defect_records
-- =====================================================
CREATE TABLE IF NOT EXISTS defect_records (
  factory_id uuid NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  id text NOT NULL,
  date date NOT NULL,
  product_size text,
  defect_type text NOT NULL,
  count integer DEFAULT 0,
  root_cause text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (factory_id, id)
);
ALTER TABLE defect_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_defect_records_all" ON defect_records;
CREATE POLICY "anon_defect_records_all" ON defect_records FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_defect_records_factory ON defect_records(factory_id);

-- =====================================================
-- downtime_events
-- =====================================================
CREATE TABLE IF NOT EXISTS downtime_events (
  factory_id uuid NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  id text NOT NULL,
  date date NOT NULL,
  machine_id text NOT NULL,
  machine_name text,
  reason text NOT NULL,
  duration_min integer DEFAULT 0,
  category text NOT NULL DEFAULT 'breakdown',
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (factory_id, id)
);
ALTER TABLE downtime_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_downtime_events_all" ON downtime_events;
CREATE POLICY "anon_downtime_events_all" ON downtime_events FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_downtime_events_factory ON downtime_events(factory_id);

-- =====================================================
-- energy_records
-- =====================================================
CREATE TABLE IF NOT EXISTS energy_records (
  factory_id uuid NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  id text NOT NULL,
  date date NOT NULL,
  source text NOT NULL,
  kwh integer DEFAULT 0,
  cost integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (factory_id, id)
);
ALTER TABLE energy_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_energy_records_all" ON energy_records;
CREATE POLICY "anon_energy_records_all" ON energy_records FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_energy_records_factory ON energy_records(factory_id);

-- =====================================================
-- Seed demo operational data (linked to the demo factory)
-- =====================================================

-- production_lines
INSERT INTO production_lines (factory_id, id, name, name_ar, products, shift_capacity)
SELECT f.id, v.id, v.name, v.name_ar, v.products, v.shift_capacity
FROM factories f,
LATERAL (VALUES
  ('line-1', 'Line 1 — Small Tanks', 'خط 1 - الخزانات الصغيرة', ARRAY['500L','1000L']::text[], 120),
  ('line-2', 'Line 2 — Medium Tanks', 'خط 2 - الخزانات المتوسطة', ARRAY['2000L','3000L']::text[], 70),
  ('line-3', 'Line 3 — Large Tanks', 'خط 3 - الخزانات الكبيرة', ARRAY['5000L']::text[], 35)
) AS v(id, name, name_ar, products, shift_capacity)
WHERE f.is_demo = true
AND NOT EXISTS (SELECT 1 FROM production_lines WHERE factory_id = f.id);

-- products
INSERT INTO products (factory_id, id, name, size, capacity_liters, cycle_time_min, material_kg, unit_cost, unit_price, line_id)
SELECT f.id, v.id, v.name, v.size, v.cap, v.ct, v.mat, v.uc, v.up, v.line
FROM factories f,
LATERAL (VALUES
  ('p-500','خزان 500 لتر','500L',500,18,8.5,14500,22000,'line-1'),
  ('p-1000','خزان 1000 لتر','1000L',1000,25,16,28000,42000,'line-1'),
  ('p-2000','خزان 2000 لتر','2000L',2000,38,32,55000,82000,'line-2'),
  ('p-3000','خزان 3000 لتر','3000L',3000,48,48,78000,115000,'line-2'),
  ('p-5000','خزان 5000 لتر','5000L',5000,72,82,132000,195000,'line-3')
) AS v(id,name,size,cap,ct,mat,uc,up,line)
WHERE f.is_demo = true
AND NOT EXISTS (SELECT 1 FROM products WHERE factory_id = f.id);

-- machines
INSERT INTO machines (factory_id, id, name, name_ar, type, line_id, status, availability, performance, quality, oee, downtime_hours, mtbf_hours, mttr_hours, last_maintenance, next_maintenance)
SELECT f.id, v.id, v.name, v.name_ar, v.type, v.line, v.status, v.avail, v.perf, v.qual, v.oee, v.dh, v.mtbf, v.mttr, v.lm::date, v.nm::date
FROM factories f,
LATERAL (VALUES
  ('m-mold-1','Molding Machine 1','ماكينة التشكيل رقم 1','molding','line-1','running',92::numeric,88,96,77.8,6.2,320,3.5,'2026-06-28','2026-07-28'),
  ('m-mold-2','Molding Machine 2','ماكينة التشكيل رقم 2','molding','line-2','down',71,82,91,53.1,22.8,140,8.2,'2026-05-15','2026-07-15'),
  ('m-mold-3','Molding Machine 3','ماكينة التشكيل رقم 3','molding','line-3','running',89,85,94,71.2,8.4,280,4.1,'2026-06-20','2026-08-05'),
  ('m-mixer-1','Material Mixer','ماكينة الخلط','mixer',NULL::text,'running',95,90,98,83.8,3.2,450,2.0,'2026-07-01','2026-08-01'),
  ('m-grinder-1','Grinding Machine','ماكينة الطحن','grinder',NULL::text,'idle',97,92,95,84.9,1.8,520,1.5,'2026-06-15','2026-09-15'),
  ('m-comp-1','Air Compressor','ضاغط الهواء','compressor',NULL::text,'running',88,86,100,75.7,7.5,210,3.8,'2026-05-30','2026-07-30'),
  ('m-forklift-1','Forklift','الرافعة الشوكية','forklift',NULL::text,'idle',93,78,100,72.5,4.6,360,5.0,'2026-06-10','2026-08-10'),
  ('m-gen-1','Diesel Generator','مولد الديزل','generator',NULL::text,'running',91,84,100,76.4,9.2,260,6.5,'2026-06-05','2026-07-25'),
  ('m-solar-1','Solar Energy System','نظام الطاقة الشمسية','solar',NULL::text,'running',98,95,100,93.1,1.2,800,1.0,'2026-04-20','2026-10-20')
) AS v(id,name,name_ar,type,line,status,avail,perf,qual,oee,dh,mtbf,mttr,lm,nm)
WHERE f.is_demo = true
AND NOT EXISTS (SELECT 1 FROM machines WHERE factory_id = f.id);

-- process_stages
INSERT INTO process_stages (factory_id, id, step, name_ar, name_en, sort_order, cycle_time_min, yield_rate)
SELECT f.id, v.id, v.step, v.name_ar, v.name_en, v.ord, v.ct, v.yr
FROM factories f,
LATERAL (VALUES
  ('ps-1','receiving','استلام المواد الخام','Raw Material Receiving',1,15,100),
  ('ps-2','inspection','فحص المواد','Material Inspection',2,20,99),
  ('ps-3','mixing','خلط المواد','Material Mixing',3,12,99),
  ('ps-4','heating','عملية التسخين','Heating Process',4,25,98),
  ('ps-5','molding','عملية التشكيل','Molding Process',5,35,94),
  ('ps-6','cooling','التبريد','Cooling',6,18,97),
  ('ps-7','trimming','التشذيب','Trimming',7,8,96),
  ('ps-8','quality','فحص الجودة','Quality Inspection',8,10,95),
  ('ps-9','storage','التخزين','Final Storage',9,12,100),
  ('ps-10','shipping','الشحن','Shipping',10,15,100)
) AS v(id,step,name_ar,name_en,ord,ct,yr)
WHERE f.is_demo = true
AND NOT EXISTS (SELECT 1 FROM process_stages WHERE factory_id = f.id);

-- raw_materials
INSERT INTO raw_materials (factory_id, id, name_ar, name_en, unit, stock_kg, consumption_per_day_kg, unit_cost, supplier, lead_time_days)
SELECT f.id, v.id, v.name_ar, v.name_en, v.unit, v.stock, v.consump, v.uc, v.supplier, v.lead
FROM factories f,
LATERAL (VALUES
  ('rm-1','حبيبات البلاستيك HDPE','HDPE Plastic Resin','كجم',18500,2400,1850,'مؤسسة المواد الصناعية',14),
  ('rm-2','ماستر باتش للألوان','Color Masterbatch','كجم',1200,120,6500,'شركة الألوان المتقدمة',21),
  ('rm-3','إضافات الحماية من الأشعة فوق البنفسجية','UV Additives','كجم',340,36,12000,'مجموعة الإضافات الصناعية',30)
) AS v(id,name_ar,name_en,unit,stock,consump,uc,supplier,lead)
WHERE f.is_demo = true
AND NOT EXISTS (SELECT 1 FROM raw_materials WHERE factory_id = f.id);

-- defect_records
INSERT INTO defect_records (factory_id, id, date, product_size, defect_type, count, root_cause)
SELECT f.id, v.id, v.dt::date, v.ps, v.dt_type, v.cnt, v.rc
FROM factories f,
LATERAL (VALUES
  ('d-1','2026-07-23','1000L','تشوه في الشكل',8,'حرارة التشكيل غير متجانسة'),
  ('d-2','2026-07-23','2000L','فقاعات هوائية',5,'رطوبة في حبيبات البلاستيك'),
  ('d-3','2026-07-22','1000L','سماكة غير متساوية',12,'تآكل في القالب'),
  ('d-4','2026-07-22','500L','لون غير مطابق',4,'خلط غير كافٍ للماستر باتش'),
  ('d-5','2026-07-21','2000L','تشقق في الحواف',7,'تبريد سريع'),
  ('d-6','2026-07-21','3000L','تشوه في الشكل',3,'ضغط منخفض في القالب'),
  ('d-7','2026-07-20','1000L','سماكة غير متساوية',9,'تآكل في القالب'),
  ('d-8','2026-07-20','5000L','فقاعات هوائية',2,'رطوبة في حبيبات البلاستيك')
) AS v(id,dt,ps,dt_type,cnt,rc)
WHERE f.is_demo = true
AND NOT EXISTS (SELECT 1 FROM defect_records WHERE factory_id = f.id);

-- downtime_events
INSERT INTO downtime_events (factory_id, id, date, machine_id, machine_name, reason, duration_min, category)
SELECT f.id, v.id, v.dt::date, v.mid, v.mn, v.reason, v.dur, v.cat
FROM factories f,
LATERAL (VALUES
  ('dt-1','2026-07-23','m-mold-2','ماكينة التشكيل رقم 2','عطل في نظام التسخين',185,'breakdown'),
  ('dt-2','2026-07-23','m-comp-1','ضاغط الهواء','صيانة دورية',45,'planned'),
  ('dt-3','2026-07-22','m-mold-2','ماكينة التشكيل رقم 2','تغيير القالب',55,'changeover'),
  ('dt-4','2026-07-22','m-gen-1','مولد الديزل','انقطاع وقود الديزل',90,'material'),
  ('dt-5','2026-07-21','m-mold-2','ماكينة التشكيل رقم 2','عطل في النظام الهيدروليكي',140,'breakdown'),
  ('dt-6','2026-07-21','m-mold-1','ماكينة التشكيل رقم 1','تغيير القالب',40,'changeover'),
  ('dt-7','2026-07-20','m-mold-2','ماكينة التشكيل رقم 2','مشكلة في نظام التبريد',110,'breakdown'),
  ('dt-8','2026-07-20','m-comp-1','ضاغط الهواء','ضغط منخفض',35,'breakdown'),
  ('dt-9','2026-07-19','m-mold-2','ماكينة التشكيل رقم 2','صيانة طارئة',95,'breakdown'),
  ('dt-10','2026-07-19','m-forklift-1','الرافعة الشوكية','بطارية فارغة',60,'energy')
) AS v(id,dt,mid,mn,reason,dur,cat)
WHERE f.is_demo = true
AND NOT EXISTS (SELECT 1 FROM downtime_events WHERE factory_id = f.id);

-- shift_data + energy_records: generate 14 days mirroring the JS demo generator.
DO $$
DECLARE
  f_id uuid;
  base_date date := '2026-07-24';
  d integer;
  lines text[] := ARRAY['line-1','line-2','line-3'];
  planned int[] := ARRAY[120,70,35];
  base_actual int[] := ARRAY[108,62,30];
  idx integer;
  shift integer;
  variance double precision;
  actual integer;
  defect_rate double precision;
  defect_units integer;
  good_units integer;
  scrap_kg integer;
  runtime double precision;
  downtime_h double precision;
  energy_kwh integer;
  energy_cost integer;
  date_str text;
  shift_id text;
  solar_factor double precision;
  total_kwh double precision;
  solar_kwh integer;
  diesel_kwh integer;
BEGIN
  SELECT id INTO f_id FROM factories WHERE is_demo = true LIMIT 1;
  IF f_id IS NULL THEN RETURN; END IF;

  IF EXISTS (SELECT 1 FROM shift_data WHERE factory_id = f_id LIMIT 1) THEN RETURN; END IF;

  FOR d IN REVERSE 13..0 LOOP
    date_str := to_char(base_date - make_interval(days => d), 'YYYY-MM-DD');
    FOR idx IN 1..3 LOOP
      FOR shift IN 1..2 LOOP
        variance := (sin(d * 0.7 + idx) + cos(d * 0.4)) * 0.08;
        actual := round(base_actual[idx] * (1 + variance) * CASE WHEN shift = 2 THEN 0.92 ELSE 1 END);
        defect_rate := 0.04 + GREATEST(0, sin(d * 0.5)) * 0.03;
        defect_units := round(actual * defect_rate);
        good_units := actual - defect_units;
        scrap_kg := round(defect_units * 20 * (1 + (idx - 1) * 0.3));
        runtime := 7.5 - GREATEST(0, sin(d * 0.6 + idx)) * 0.8;
        downtime_h := 8 - runtime;
        energy_kwh := round(actual * (1.8 + (idx - 1) * 0.5));
        energy_cost := round(energy_kwh * 85);
        shift_id := 'shift-' || date_str || '-' || lines[idx] || '-' || shift;

        INSERT INTO shift_data (factory_id, id, shift_name, date, line_id, planned_units, actual_units, good_units, defect_units, scrap_kg, runtime_hours, downtime_hours, energy_kwh, energy_cost)
        VALUES (f_id, shift_id, 'وردية ' || shift, date_str::date, lines[idx], planned[idx], actual, good_units, defect_units, scrap_kg, round(runtime::numeric,1), round(downtime_h::numeric,1), energy_kwh, energy_cost);
      END LOOP;
    END LOOP;

    solar_factor := 0.35 + GREATEST(0, sin(d * 0.3)) * 0.1;
    total_kwh := 1800 + sin(d * 0.5) * 150;
    solar_kwh := round(total_kwh * solar_factor);
    diesel_kwh := round(total_kwh * (1 - solar_factor));
    INSERT INTO energy_records (factory_id, id, date, source, kwh, cost)
    VALUES (f_id, 'en-' || date_str || '-solar', date_str::date, 'solar', solar_kwh, 0);
    INSERT INTO energy_records (factory_id, id, date, source, kwh, cost)
    VALUES (f_id, 'en-' || date_str || '-diesel', date_str::date, 'diesel', diesel_kwh, round(diesel_kwh * 85));
  END LOOP;
END $$;
