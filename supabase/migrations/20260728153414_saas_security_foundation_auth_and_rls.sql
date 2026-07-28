/*
# SaaS Security Foundation — Authentication & Multi-Tenant RLS

## Purpose
Convert MIZAN AI from open single-tenant demo mode to a real multi-tenant SaaS
platform where each authenticated user belongs to a company and can only
access factories and data owned by their company.

## 1. New Tables
- `user_profiles`: Links auth.users to a company with a role (owner/manager/engineer).
  - `id` (uuid, PK, references auth.users)
  - `company_id` (uuid, references companies, NOT NULL)
  - `full_name` (text)
  - `role` (text: 'owner' | 'manager' | 'engineer' | 'viewer')
  - `created_at` (timestamptz)

## 2. Security Changes — RLS Policy Replacement
ALL open `USING (true)` policies are replaced with company-membership checks.

### Pattern
Every factory-scoped table gets policies that check:
  EXISTS (SELECT 1 FROM factories f
    WHERE f.id = <table>.factory_id AND f.company_id = public.get_user_company_id())

### Tables updated (factory-scoped):
- factories, departments, platform_users, data_quality_scores
- production_lines, products, machines, process_stages, raw_materials
- shift_data, defect_records, downtime_events, energy_records
- improvement_projects, decision_log

### Tables updated (company-scoped):
- companies: user must have a profile with that company_id
- subscription_plans: remains public SELECT (reference data, no auth needed)

## 3. Important Notes
- Existing demo data remains intact.
- All policies use `TO authenticated` — anon key can no longer read/write tenant data.
- subscription_plans remains readable by anon so pricing page works before login.
*/

-- =====================================================
-- 1. user_profiles table
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  full_name text,
  role text NOT NULL DEFAULT 'owner',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_company_profiles" ON user_profiles;
CREATE POLICY "select_own_company_profiles" ON user_profiles FOR SELECT
  TO authenticated USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "delete_own_profile" ON user_profiles;
CREATE POLICY "delete_own_profile" ON user_profiles FOR DELETE
  TO authenticated USING (id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_user_profiles_company ON user_profiles(company_id);

-- =====================================================
-- 2. Helper function: get the caller's company_id
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM public.user_profiles WHERE id = auth.uid();
$$;

-- =====================================================
-- 3. companies — company-scoped
-- =====================================================

DROP POLICY IF EXISTS "anon_companies_all" ON companies;
DROP POLICY IF EXISTS "select_company_members" ON companies;
CREATE POLICY "select_company_members" ON companies FOR SELECT
  TO authenticated USING (id = public.get_user_company_id());

DROP POLICY IF EXISTS "insert_company_owner" ON companies;
CREATE POLICY "insert_company_owner" ON companies FOR INSERT
  TO authenticated WITH CHECK (id = public.get_user_company_id());

DROP POLICY IF EXISTS "update_company_member" ON companies;
CREATE POLICY "update_company_member" ON companies FOR UPDATE
  TO authenticated USING (id = public.get_user_company_id()) WITH CHECK (id = public.get_user_company_id());

DROP POLICY IF EXISTS "delete_company_member" ON companies;
CREATE POLICY "delete_company_member" ON companies FOR DELETE
  TO authenticated USING (id = public.get_user_company_id());

-- =====================================================
-- 4. factories — factory-scoped via company membership
-- =====================================================

DROP POLICY IF EXISTS "anon_factories_all" ON factories;
DROP POLICY IF EXISTS "select_company_factories" ON factories;
CREATE POLICY "select_company_factories" ON factories FOR SELECT
  TO authenticated USING (company_id = public.get_user_company_id());

DROP POLICY IF EXISTS "insert_company_factories" ON factories;
CREATE POLICY "insert_company_factories" ON factories FOR INSERT
  TO authenticated WITH CHECK (company_id = public.get_user_company_id());

DROP POLICY IF EXISTS "update_company_factories" ON factories;
CREATE POLICY "update_company_factories" ON factories FOR UPDATE
  TO authenticated USING (company_id = public.get_user_company_id()) WITH CHECK (company_id = public.get_user_company_id());

DROP POLICY IF EXISTS "delete_company_factories" ON factories;
CREATE POLICY "delete_company_factories" ON factories FOR DELETE
  TO authenticated USING (company_id = public.get_user_company_id());

-- =====================================================
-- 5. departments — factory-scoped
-- =====================================================

DROP POLICY IF EXISTS "anon_departments_all" ON departments;
DROP POLICY IF EXISTS "select_company_departments" ON departments;
CREATE POLICY "select_company_departments" ON departments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = departments.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "insert_company_departments" ON departments;
CREATE POLICY "insert_company_departments" ON departments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = departments.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "update_company_departments" ON departments;
CREATE POLICY "update_company_departments" ON departments FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = departments.factory_id AND f.company_id = public.get_user_company_id())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = departments.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "delete_company_departments" ON departments;
CREATE POLICY "delete_company_departments" ON departments FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = departments.factory_id AND f.company_id = public.get_user_company_id())
  );

-- =====================================================
-- 6. platform_users — factory-scoped
-- =====================================================

DROP POLICY IF EXISTS "anon_users_all" ON platform_users;
DROP POLICY IF EXISTS "select_company_platform_users" ON platform_users;
CREATE POLICY "select_company_platform_users" ON platform_users FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = platform_users.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "insert_company_platform_users" ON platform_users;
CREATE POLICY "insert_company_platform_users" ON platform_users FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = platform_users.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "update_company_platform_users" ON platform_users;
CREATE POLICY "update_company_platform_users" ON platform_users FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = platform_users.factory_id AND f.company_id = public.get_user_company_id())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = platform_users.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "delete_company_platform_users" ON platform_users;
CREATE POLICY "delete_company_platform_users" ON platform_users FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = platform_users.factory_id AND f.company_id = public.get_user_company_id())
  );

-- =====================================================
-- 7. data_quality_scores — factory-scoped
-- =====================================================

DROP POLICY IF EXISTS "anon_quality_all" ON data_quality_scores;
DROP POLICY IF EXISTS "select_company_quality" ON data_quality_scores;
CREATE POLICY "select_company_quality" ON data_quality_scores FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = data_quality_scores.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "insert_company_quality" ON data_quality_scores;
CREATE POLICY "insert_company_quality" ON data_quality_scores FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = data_quality_scores.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "update_company_quality" ON data_quality_scores;
CREATE POLICY "update_company_quality" ON data_quality_scores FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = data_quality_scores.factory_id AND f.company_id = public.get_user_company_id())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = data_quality_scores.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "delete_company_quality" ON data_quality_scores;
CREATE POLICY "delete_company_quality" ON data_quality_scores FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = data_quality_scores.factory_id AND f.company_id = public.get_user_company_id())
  );

-- =====================================================
-- 8. production_lines — factory-scoped
-- =====================================================

DROP POLICY IF EXISTS "anon_production_lines_all" ON production_lines;
DROP POLICY IF EXISTS "select_company_production_lines" ON production_lines;
CREATE POLICY "select_company_production_lines" ON production_lines FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = production_lines.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "insert_company_production_lines" ON production_lines;
CREATE POLICY "insert_company_production_lines" ON production_lines FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = production_lines.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "update_company_production_lines" ON production_lines;
CREATE POLICY "update_company_production_lines" ON production_lines FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = production_lines.factory_id AND f.company_id = public.get_user_company_id())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = production_lines.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "delete_company_production_lines" ON production_lines;
CREATE POLICY "delete_company_production_lines" ON production_lines FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = production_lines.factory_id AND f.company_id = public.get_user_company_id())
  );

-- =====================================================
-- 9. products — factory-scoped
-- =====================================================

DROP POLICY IF EXISTS "anon_products_all" ON products;
DROP POLICY IF EXISTS "select_company_products" ON products;
CREATE POLICY "select_company_products" ON products FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = products.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "insert_company_products" ON products;
CREATE POLICY "insert_company_products" ON products FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = products.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "update_company_products" ON products;
CREATE POLICY "update_company_products" ON products FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = products.factory_id AND f.company_id = public.get_user_company_id())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = products.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "delete_company_products" ON products;
CREATE POLICY "delete_company_products" ON products FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = products.factory_id AND f.company_id = public.get_user_company_id())
  );

-- =====================================================
-- 10. machines — factory-scoped
-- =====================================================

DROP POLICY IF EXISTS "anon_machines_all" ON machines;
DROP POLICY IF EXISTS "select_company_machines" ON machines;
CREATE POLICY "select_company_machines" ON machines FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = machines.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "insert_company_machines" ON machines;
CREATE POLICY "insert_company_machines" ON machines FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = machines.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "update_company_machines" ON machines;
CREATE POLICY "update_company_machines" ON machines FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = machines.factory_id AND f.company_id = public.get_user_company_id())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = machines.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "delete_company_machines" ON machines;
CREATE POLICY "delete_company_machines" ON machines FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = machines.factory_id AND f.company_id = public.get_user_company_id())
  );

-- =====================================================
-- 11. process_stages — factory-scoped
-- =====================================================

DROP POLICY IF EXISTS "anon_process_stages_all" ON process_stages;
DROP POLICY IF EXISTS "select_company_process_stages" ON process_stages;
CREATE POLICY "select_company_process_stages" ON process_stages FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = process_stages.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "insert_company_process_stages" ON process_stages;
CREATE POLICY "insert_company_process_stages" ON process_stages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = process_stages.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "update_company_process_stages" ON process_stages;
CREATE POLICY "update_company_process_stages" ON process_stages FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = process_stages.factory_id AND f.company_id = public.get_user_company_id())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = process_stages.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "delete_company_process_stages" ON process_stages;
CREATE POLICY "delete_company_process_stages" ON process_stages FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = process_stages.factory_id AND f.company_id = public.get_user_company_id())
  );

-- =====================================================
-- 12. raw_materials — factory-scoped
-- =====================================================

DROP POLICY IF EXISTS "anon_raw_materials_all" ON raw_materials;
DROP POLICY IF EXISTS "select_company_raw_materials" ON raw_materials;
CREATE POLICY "select_company_raw_materials" ON raw_materials FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = raw_materials.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "insert_company_raw_materials" ON raw_materials;
CREATE POLICY "insert_company_raw_materials" ON raw_materials FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = raw_materials.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "update_company_raw_materials" ON raw_materials;
CREATE POLICY "update_company_raw_materials" ON raw_materials FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = raw_materials.factory_id AND f.company_id = public.get_user_company_id())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = raw_materials.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "delete_company_raw_materials" ON raw_materials;
CREATE POLICY "delete_company_raw_materials" ON raw_materials FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = raw_materials.factory_id AND f.company_id = public.get_user_company_id())
  );

-- =====================================================
-- 13. shift_data — factory-scoped
-- =====================================================

DROP POLICY IF EXISTS "anon_shift_data_all" ON shift_data;
DROP POLICY IF EXISTS "select_company_shift_data" ON shift_data;
CREATE POLICY "select_company_shift_data" ON shift_data FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = shift_data.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "insert_company_shift_data" ON shift_data;
CREATE POLICY "insert_company_shift_data" ON shift_data FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = shift_data.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "update_company_shift_data" ON shift_data;
CREATE POLICY "update_company_shift_data" ON shift_data FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = shift_data.factory_id AND f.company_id = public.get_user_company_id())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = shift_data.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "delete_company_shift_data" ON shift_data;
CREATE POLICY "delete_company_shift_data" ON shift_data FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = shift_data.factory_id AND f.company_id = public.get_user_company_id())
  );

-- =====================================================
-- 14. defect_records — factory-scoped
-- =====================================================

DROP POLICY IF EXISTS "anon_defect_records_all" ON defect_records;
DROP POLICY IF EXISTS "select_company_defects" ON defect_records;
CREATE POLICY "select_company_defects" ON defect_records FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = defect_records.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "insert_company_defects" ON defect_records;
CREATE POLICY "insert_company_defects" ON defect_records FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = defect_records.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "update_company_defects" ON defect_records;
CREATE POLICY "update_company_defects" ON defect_records FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = defect_records.factory_id AND f.company_id = public.get_user_company_id())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = defect_records.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "delete_company_defects" ON defect_records;
CREATE POLICY "delete_company_defects" ON defect_records FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = defect_records.factory_id AND f.company_id = public.get_user_company_id())
  );

-- =====================================================
-- 15. downtime_events — factory-scoped
-- =====================================================

DROP POLICY IF EXISTS "anon_downtime_events_all" ON downtime_events;
DROP POLICY IF EXISTS "select_company_downtime" ON downtime_events;
CREATE POLICY "select_company_downtime" ON downtime_events FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = downtime_events.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "insert_company_downtime" ON downtime_events;
CREATE POLICY "insert_company_downtime" ON downtime_events FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = downtime_events.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "update_company_downtime" ON downtime_events;
CREATE POLICY "update_company_downtime" ON downtime_events FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = downtime_events.factory_id AND f.company_id = public.get_user_company_id())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = downtime_events.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "delete_company_downtime" ON downtime_events;
CREATE POLICY "delete_company_downtime" ON downtime_events FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = downtime_events.factory_id AND f.company_id = public.get_user_company_id())
  );

-- =====================================================
-- 16. energy_records — factory-scoped
-- =====================================================

DROP POLICY IF EXISTS "anon_energy_records_all" ON energy_records;
DROP POLICY IF EXISTS "select_company_energy" ON energy_records;
CREATE POLICY "select_company_energy" ON energy_records FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = energy_records.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "insert_company_energy" ON energy_records;
CREATE POLICY "insert_company_energy" ON energy_records FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = energy_records.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "update_company_energy" ON energy_records;
CREATE POLICY "update_company_energy" ON energy_records FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = energy_records.factory_id AND f.company_id = public.get_user_company_id())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = energy_records.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "delete_company_energy" ON energy_records;
CREATE POLICY "delete_company_energy" ON energy_records FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM factories f WHERE f.id = energy_records.factory_id AND f.company_id = public.get_user_company_id())
  );

-- =====================================================
-- 17. improvement_projects — factory-scoped
-- =====================================================

DROP POLICY IF EXISTS "anon_select_projects" ON improvement_projects;
DROP POLICY IF EXISTS "anon_insert_projects" ON improvement_projects;
DROP POLICY IF EXISTS "anon_update_projects" ON improvement_projects;
DROP POLICY IF EXISTS "anon_delete_projects" ON improvement_projects;

DROP POLICY IF EXISTS "select_company_projects" ON improvement_projects;
CREATE POLICY "select_company_projects" ON improvement_projects FOR SELECT
  TO authenticated USING (
    factory_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM factories f WHERE f.id = improvement_projects.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "insert_company_projects" ON improvement_projects;
CREATE POLICY "insert_company_projects" ON improvement_projects FOR INSERT
  TO authenticated WITH CHECK (
    factory_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM factories f WHERE f.id = improvement_projects.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "update_company_projects" ON improvement_projects;
CREATE POLICY "update_company_projects" ON improvement_projects FOR UPDATE
  TO authenticated USING (
    factory_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM factories f WHERE f.id = improvement_projects.factory_id AND f.company_id = public.get_user_company_id())
  ) WITH CHECK (
    factory_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM factories f WHERE f.id = improvement_projects.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "delete_company_projects" ON improvement_projects;
CREATE POLICY "delete_company_projects" ON improvement_projects FOR DELETE
  TO authenticated USING (
    factory_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM factories f WHERE f.id = improvement_projects.factory_id AND f.company_id = public.get_user_company_id())
  );

-- =====================================================
-- 18. decision_log — factory-scoped
-- =====================================================

DROP POLICY IF EXISTS "anon_select_decisions" ON decision_log;
DROP POLICY IF EXISTS "anon_insert_decisions" ON decision_log;
DROP POLICY IF EXISTS "anon_update_decisions" ON decision_log;
DROP POLICY IF EXISTS "anon_delete_decisions" ON decision_log;

DROP POLICY IF EXISTS "select_company_decisions" ON decision_log;
CREATE POLICY "select_company_decisions" ON decision_log FOR SELECT
  TO authenticated USING (
    factory_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM factories f WHERE f.id = decision_log.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "insert_company_decisions" ON decision_log;
CREATE POLICY "insert_company_decisions" ON decision_log FOR INSERT
  TO authenticated WITH CHECK (
    factory_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM factories f WHERE f.id = decision_log.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "update_company_decisions" ON decision_log;
CREATE POLICY "update_company_decisions" ON decision_log FOR UPDATE
  TO authenticated USING (
    factory_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM factories f WHERE f.id = decision_log.factory_id AND f.company_id = public.get_user_company_id())
  ) WITH CHECK (
    factory_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM factories f WHERE f.id = decision_log.factory_id AND f.company_id = public.get_user_company_id())
  );

DROP POLICY IF EXISTS "delete_company_decisions" ON decision_log;
CREATE POLICY "delete_company_decisions" ON decision_log FOR DELETE
  TO authenticated USING (
    factory_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM factories f WHERE f.id = decision_log.factory_id AND f.company_id = public.get_user_company_id())
  );

-- =====================================================
-- 19. subscription_plans — stays public SELECT (reference data)
-- =====================================================
-- The existing anon_plans_select policy already allows anon + authenticated
-- SELECT. No changes needed — this is intentionally public pricing data.