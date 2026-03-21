-- Row Level Security policies for all tables
-- Migration: 20260320000001_rls_policies

-- ============================================
-- HELPER FUNCTION
-- ============================================

-- Returns the current user's role from the users table
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Returns true if the current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT get_user_role() = 'admin'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE boats ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS
-- ============================================

-- Admin can see all users
CREATE POLICY users_select_admin ON users
  FOR SELECT USING (is_admin());

-- Members can see their own row and their sub-users
CREATE POLICY users_select_own ON users
  FOR SELECT USING (
    id = auth.uid()
    OR parent_user_id = auth.uid()
  );

-- Admin can insert new users
CREATE POLICY users_insert_admin ON users
  FOR INSERT WITH CHECK (is_admin());

-- Admin can update any user
CREATE POLICY users_update_admin ON users
  FOR UPDATE USING (is_admin());

-- Members/sub-users can update their own row
CREATE POLICY users_update_own ON users
  FOR UPDATE USING (id = auth.uid());

-- ============================================
-- BOATS
-- ============================================

-- All authenticated users can view active boats
CREATE POLICY boats_select ON boats
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Admin only: insert, update, delete
CREATE POLICY boats_insert_admin ON boats
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY boats_update_admin ON boats
  FOR UPDATE USING (is_admin());

CREATE POLICY boats_delete_admin ON boats
  FOR DELETE USING (is_admin());

-- ============================================
-- TIME SLOTS
-- ============================================

-- All authenticated users can view
CREATE POLICY time_slots_select ON time_slots
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Admin only: insert, update, delete
CREATE POLICY time_slots_insert_admin ON time_slots
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY time_slots_update_admin ON time_slots
  FOR UPDATE USING (is_admin());

CREATE POLICY time_slots_delete_admin ON time_slots
  FOR DELETE USING (is_admin());

-- ============================================
-- RESERVATIONS
-- ============================================

-- Admin can see all reservations
CREATE POLICY reservations_select_admin ON reservations
  FOR SELECT USING (is_admin());

-- Members/sub-users can see their own reservations
CREATE POLICY reservations_select_own ON reservations
  FOR SELECT USING (user_id = auth.uid());

-- Admin can insert any reservation (book on behalf)
CREATE POLICY reservations_insert_admin ON reservations
  FOR INSERT WITH CHECK (is_admin());

-- Members/sub-users can insert reservations for themselves
CREATE POLICY reservations_insert_own ON reservations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admin can update any reservation
CREATE POLICY reservations_update_admin ON reservations
  FOR UPDATE USING (is_admin());

-- Members/sub-users can update (cancel) their own reservations
CREATE POLICY reservations_update_own ON reservations
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- BLOCKED DATES
-- ============================================

-- All authenticated users can view (needed for booking UI)
CREATE POLICY blocked_dates_select ON blocked_dates
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Admin only: insert, update, delete
CREATE POLICY blocked_dates_insert_admin ON blocked_dates
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY blocked_dates_update_admin ON blocked_dates
  FOR UPDATE USING (is_admin());

CREATE POLICY blocked_dates_delete_admin ON blocked_dates
  FOR DELETE USING (is_admin());

-- ============================================
-- CHARGES
-- ============================================

-- Admin can see all charges
CREATE POLICY charges_select_admin ON charges
  FOR SELECT USING (is_admin());

-- Members/sub-users can see their own charges
CREATE POLICY charges_select_own ON charges
  FOR SELECT USING (user_id = auth.uid());

-- Admin only: insert, update
CREATE POLICY charges_insert_admin ON charges
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY charges_update_admin ON charges
  FOR UPDATE USING (is_admin());

-- ============================================
-- SUBSCRIPTIONS
-- ============================================

-- Admin can see all subscriptions
CREATE POLICY subscriptions_select_admin ON subscriptions
  FOR SELECT USING (is_admin());

-- Members/sub-users can see their own
CREATE POLICY subscriptions_select_own ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- Admin only: insert, update
CREATE POLICY subscriptions_insert_admin ON subscriptions
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY subscriptions_update_admin ON subscriptions
  FOR UPDATE USING (is_admin());

-- ============================================
-- DOCUMENTS
-- ============================================

-- Admin can see all documents
CREATE POLICY documents_select_admin ON documents
  FOR SELECT USING (is_admin());

-- Members/sub-users can see their own documents
CREATE POLICY documents_select_own ON documents
  FOR SELECT USING (user_id = auth.uid());

-- Members/sub-users can upload their own documents
CREATE POLICY documents_insert_own ON documents
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admin can update documents (for approval)
CREATE POLICY documents_update_admin ON documents
  FOR UPDATE USING (is_admin());

-- ============================================
-- AUDIT LOG
-- ============================================

-- Admin can see all audit entries
CREATE POLICY audit_log_select_admin ON audit_log
  FOR SELECT USING (is_admin());

-- Members/sub-users can see their own audit entries
CREATE POLICY audit_log_select_own ON audit_log
  FOR SELECT USING (user_id = auth.uid());

-- All authenticated users can insert (server-side logging)
CREATE POLICY audit_log_insert ON audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
