/*
# Add factory_id to improvement_projects and decision_log

## Purpose
The improvement_projects and decision_log tables were created without a
factory_id column, so in a multi-factory SaaS deployment every factory sees
every other factory's projects and decisions. This migration adds a nullable
factory_id column to both tables and indexes it, without losing existing rows.

## 1. Schema Changes
- `improvement_projects`: add `factory_id uuid REFERENCES factories(id) ON DELETE CASCADE` (nullable).
- `decision_log`: add `factory_id uuid REFERENCES factories(id) ON DELETE CASCADE` (nullable).

## 2. Indexes
- `idx_projects_factory` on improvement_projects(factory_id)
- `idx_decisions_factory` on decision_log(factory_id)

## 3. Security
- RLS already enabled with anon+authenticated CRUD. No policy changes needed.

## 4. Important Notes
- Existing rows get NULL factory_id and remain visible (backward compatible).
- New inserts from the frontend will include factory_id.
*/

ALTER TABLE improvement_projects
  ADD COLUMN IF NOT EXISTS factory_id uuid REFERENCES factories(id) ON DELETE CASCADE;

ALTER TABLE decision_log
  ADD COLUMN IF NOT EXISTS factory_id uuid REFERENCES factories(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_projects_factory ON improvement_projects(factory_id);
CREATE INDEX IF NOT EXISTS idx_decisions_factory ON decision_log(factory_id);
