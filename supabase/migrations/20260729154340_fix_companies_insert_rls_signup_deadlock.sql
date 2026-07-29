/*
# Fix: Companies INSERT RLS Deadlock During Signup

## Problem
The `insert_company_owner` policy on `companies` checks
`id = get_user_company_id()`, but `get_user_company_id()` reads
from `user_profiles` — which does not exist yet at signup time.
This creates a chicken-and-egg deadlock: the user cannot insert a
company without a profile, and cannot insert a profile without a
company_id. Signup is completely broken.

## Fix
Replace the INSERT policy to allow any authenticated user to
insert a company. This is safe because:
1. The user is creating their own company during signup.
2. The company row has no sensitive data — just name and industry.
3. The user_profiles INSERT policy already restricts to id = auth.uid(),
   so only the user themselves can link a profile to the new company.
4. SELECT/UPDATE/DELETE policies remain scoped to company members.

## Changes
- DROP insert_company_owner policy
- CREATE insert_company_on_signup policy: TO authenticated WITH CHECK (true)
*/

DROP POLICY IF EXISTS "insert_company_owner" ON companies;
DROP POLICY IF EXISTS "insert_company_on_signup" ON companies;

CREATE POLICY "insert_company_on_signup" ON companies FOR INSERT
  TO authenticated WITH CHECK (true);
