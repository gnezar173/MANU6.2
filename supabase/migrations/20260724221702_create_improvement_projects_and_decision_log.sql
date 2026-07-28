/*
# Create Improvement Projects and Decision Log Tables

1. New Tables
- `improvement_projects`: Tracks AI-recommended improvement projects through their lifecycle
  - id (uuid, primary key)
  - title (text, not null) - project title
  - problem (text, not null) - problem description
  - root_cause (text) - root cause analysis result
  - action_plan (text) - planned actions
  - owner (text) - responsible person
  - due_date (date) - expected completion date
  - expected_saving (integer) - expected monthly saving in YER
  - actual_saving (integer) - actual measured saving
  - status (text, default 'detected') - project lifecycle status
  - category (text) - improvement category (maintenance, quality, production, energy, cost, waste, delivery)
  - methodology (text) - analysis methodology used (DMAIC, 5 Why, Pareto, etc.)
  - recommendation_id (text) - reference to AI recommendation that generated this project
  - dmaic_stages (jsonb) - DMAIC workflow stage data
  - created_at (timestamp, default now)
  - updated_at (timestamp, default now)

- `decision_log`: Tracks AI recommendations and management decisions
  - id (uuid, primary key)
  - date (date, not null) - decision date
  - problem (text, not null) - detected problem
  - ai_recommendation (text, not null) - AI's recommendation
  - management_decision (text) - management's actual decision
  - implementation_status (text, default 'pending') - pending, in_progress, completed, cancelled
  - result (text) - outcome description
  - saving (integer) - actual saving achieved
  - created_at (timestamp, default now)

2. Security
- Enable RLS on both tables.
- Single-tenant app (no auth) - allow anon + authenticated CRUD on both tables.
- Data is intentionally shared/public for this factory monitoring platform.
*/

CREATE TABLE IF NOT EXISTS improvement_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  problem text NOT NULL,
  root_cause text,
  action_plan text,
  owner text DEFAULT 'غير محدد',
  due_date date,
  expected_saving integer DEFAULT 0,
  actual_saving integer DEFAULT 0,
  status text NOT NULL DEFAULT 'detected',
  category text NOT NULL DEFAULT 'maintenance',
  methodology text NOT NULL DEFAULT 'DMAIC',
  recommendation_id text,
  dmaic_stages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE improvement_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_projects" ON improvement_projects;
CREATE POLICY "anon_select_projects" ON improvement_projects FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_projects" ON improvement_projects;
CREATE POLICY "anon_insert_projects" ON improvement_projects FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_projects" ON improvement_projects;
CREATE POLICY "anon_update_projects" ON improvement_projects FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_projects" ON improvement_projects;
CREATE POLICY "anon_delete_projects" ON improvement_projects FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS decision_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  problem text NOT NULL,
  ai_recommendation text NOT NULL,
  management_decision text,
  implementation_status text NOT NULL DEFAULT 'pending',
  result text,
  saving integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE decision_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_decisions" ON decision_log;
CREATE POLICY "anon_select_decisions" ON decision_log FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_decisions" ON decision_log;
CREATE POLICY "anon_insert_decisions" ON decision_log FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_decisions" ON decision_log;
CREATE POLICY "anon_update_decisions" ON decision_log FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_decisions" ON decision_log;
CREATE POLICY "anon_delete_decisions" ON decision_log FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_projects_status ON improvement_projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON improvement_projects(category);
CREATE INDEX IF NOT EXISTS idx_decisions_date ON decision_log(date);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decision_log(implementation_status);
