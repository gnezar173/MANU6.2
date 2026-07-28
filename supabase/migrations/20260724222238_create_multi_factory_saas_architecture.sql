/*
# Multi-Factory SaaS Platform Architecture

1. New Tables
- `companies`: Top-level organization that owns multiple factories
  - id, name_ar, name_en, industry, country, subscription_plan, created_at

- `factories`: Individual factories belonging to a company
  - id, company_id, name_ar, name_en, industry, country, employees, shifts,
    power_sources, established_year, is_demo, created_at

- `departments`: Departments within a factory
  - id, factory_id, name_ar, name_en, type, created_at

- `platform_users`: Users with role-based access to factories
  - id, factory_id, name, email, role, avatar_color, is_active, created_at

- `subscription_plans`: SaaS plan definitions (seeded as static reference)
  - id, plan_key, name_ar, name_en, price_monthly, max_factories, features,
    is_popular, created_at

- `data_quality_scores`: Data quality intelligence per factory
  - id, factory_id, overall_score, production_score, maintenance_score,
    quality_score, energy_score, cost_score, completeness_score,
    update_frequency_score, recommendation, last_updated, created_at

2. Security
- Enable RLS on all new tables.
- Single-tenant demo mode: allow anon + authenticated CRUD.
- Data is intentionally shared for this demo platform.

3. Important Notes
- The existing demo factory (مصنع الميزان لخزانات المياه البلاستيكية) is seeded
  as the default factory with is_demo = true.
- Subscription plans are seeded with 3 tiers: Starter, Professional, Enterprise.
- The company "شركة الميزان للصناعات" is seeded as the parent company.
*/

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text,
  industry text,
  country text DEFAULT 'Yemen',
  subscription_plan text DEFAULT 'starter',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_companies_all" ON companies;
CREATE POLICY "anon_companies_all" ON companies FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Factories table
CREATE TABLE IF NOT EXISTS factories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name_ar text NOT NULL,
  name_en text,
  industry text,
  country text DEFAULT 'Yemen',
  employees integer DEFAULT 0,
  shifts integer DEFAULT 1,
  power_sources text[] DEFAULT '{}',
  established_year integer,
  is_demo boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE factories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_factories_all" ON factories;
CREATE POLICY "anon_factories_all" ON factories FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id uuid REFERENCES factories(id) ON DELETE CASCADE,
  name_ar text NOT NULL,
  name_en text,
  type text NOT NULL DEFAULT 'production',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_departments_all" ON departments;
CREATE POLICY "anon_departments_all" ON departments FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Platform users table
CREATE TABLE IF NOT EXISTS platform_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id uuid REFERENCES factories(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  role text NOT NULL DEFAULT 'factory_manager',
  avatar_color text DEFAULT '#0066FF',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE platform_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_users_all" ON platform_users;
CREATE POLICY "anon_users_all" ON platform_users FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  name_en text,
  price_monthly integer DEFAULT 0,
  max_factories integer DEFAULT 1,
  features jsonb DEFAULT '[]'::jsonb,
  is_popular boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_plans_select" ON subscription_plans;
CREATE POLICY "anon_plans_select" ON subscription_plans FOR SELECT
  TO anon, authenticated USING (true);

-- Data quality scores table
CREATE TABLE IF NOT EXISTS data_quality_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id uuid REFERENCES factories(id) ON DELETE CASCADE,
  overall_score integer DEFAULT 0,
  production_score integer DEFAULT 100,
  maintenance_score integer DEFAULT 85,
  quality_score integer DEFAULT 95,
  energy_score integer DEFAULT 70,
  cost_score integer DEFAULT 90,
  completeness_score integer DEFAULT 92,
  update_frequency_score integer DEFAULT 88,
  recommendation text,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE data_quality_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_quality_all" ON data_quality_scores;
CREATE POLICY "anon_quality_all" ON data_quality_scores FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_factories_company ON factories(company_id);
CREATE INDEX IF NOT EXISTS idx_departments_factory ON departments(factory_id);
CREATE INDEX IF NOT EXISTS idx_users_factory ON platform_users(factory_id);
CREATE INDEX IF NOT EXISTS idx_quality_factory ON data_quality_scores(factory_id);

-- Seed: Company
INSERT INTO companies (name_ar, name_en, industry, country, subscription_plan)
SELECT 'شركة الميزان للصناعات', 'Mizan Industries', 'Manufacturing', 'Yemen', 'professional'
WHERE NOT EXISTS (SELECT 1 FROM companies LIMIT 1);

-- Seed: Demo factory
INSERT INTO factories (company_id, name_ar, name_en, industry, country, employees, shifts, power_sources, established_year, is_demo)
SELECT c.id, 'مصنع الميزان لخزانات المياه البلاستيكية', 'Mizan Plastic Water Tanks Factory', 'Plastic Water Tank Manufacturing', 'Yemen', 95, 2, ARRAY['ديزل', 'طاقة شمسية'], 2015, true
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM factories WHERE is_demo = true);

-- Seed: Departments for demo factory
INSERT INTO departments (factory_id, name_ar, name_en, type)
SELECT f.id, d.name_ar, d.name_en, d.type
FROM factories f, (VALUES
  ('الإنتاج', 'Production', 'production'),
  ('الجودة', 'Quality', 'quality'),
  ('الصيانة', 'Maintenance', 'maintenance'),
  ('المخزون', 'Inventory', 'inventory'),
  ('الطاقة', 'Energy', 'energy')
) AS d(name_ar, name_en, type)
WHERE f.is_demo = true
AND NOT EXISTS (SELECT 1 FROM departments WHERE factory_id = f.id);

-- Seed: Users for demo factory
INSERT INTO platform_users (factory_id, name, email, role, avatar_color)
SELECT f.id, u.name, u.email, u.role, u.color
FROM factories f, (VALUES
  ('مدير المصنع', 'manager@mizan.factory', 'factory_manager', '#0A2540'),
  ('مهندس صناعي', 'engineer@mizan.factory', 'industrial_engineer', '#0066FF'),
  ('مدير الجودة', 'quality@mizan.factory', 'quality_manager', '#00B86B'),
  ('مدير الصيانة', 'maintenance@mizan.factory', 'maintenance_manager', '#F59E0B'),
  ('صاحب المصنع', 'owner@mizan.factory', 'factory_owner', '#8b5cf6')
) AS u(name, email, role, color)
WHERE f.is_demo = true
AND NOT EXISTS (SELECT 1 FROM platform_users WHERE factory_id = f.id);

-- Seed: Subscription plans
INSERT INTO subscription_plans (plan_key, name_ar, name_en, price_monthly, max_factories, features, is_popular)
VALUES
  ('starter', 'الباقة المبتدئة', 'Starter', 15000, 1,
    '["لوحة تحكم أساسية", "تحليل AI أساسي", "مصنع واحد", "دعم بالبريد الإلكتروني"]'::jsonb, false),
  ('professional', 'الباقة الاحترافية', 'Professional', 45000, 3,
    '["لوحة تحكم متقدمة", "مستشار AI صناعي", "تقارير التحسين", "مشاريع التحسين", "تحليل السبب الجذري", "3 مصانع", "دعم ذو أولوية"]'::jsonb, true),
  ('enterprise', 'باقة المؤسسات', 'Enterprise', 120000, 999,
    '["جميع ميزات الاحترافية", "مصانع غير محدودة", "تكامل ERP", "تكامل IoT", "API مخصص", "مدير حساب مخصص", "تدريب ميداني"]'::jsonb, false)
ON CONFLICT (plan_key) DO NOTHING;

-- Seed: Data quality for demo factory
INSERT INTO data_quality_scores (factory_id, overall_score, production_score, maintenance_score, quality_score, energy_score, cost_score, completeness_score, update_frequency_score, recommendation)
SELECT f.id, 87, 100, 85, 95, 70, 90, 92, 88, 'أكمل بيانات الطاقة للحصول على تحليل مالي أكثر دقة. بيانات الصيانة تحتاج تحديث منتظم.'
FROM factories f
WHERE f.is_demo = true
AND NOT EXISTS (SELECT 1 FROM data_quality_scores WHERE factory_id = f.id);
