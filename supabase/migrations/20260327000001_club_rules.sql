-- Club Rules & Digital Signatures

-- 1. Table: admin-uploaded rule documents
CREATE TABLE club_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_url text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT false,
  uploaded_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Table: member signatures on rules
CREATE TABLE club_rule_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  club_rule_id uuid NOT NULL REFERENCES club_rules(id),
  signature_url text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, club_rule_id)
);

-- 3. New column on users
ALTER TABLE users ADD COLUMN rules_accepted boolean NOT NULL DEFAULT false;

-- 4. RLS policies

ALTER TABLE club_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_rule_signatures ENABLE ROW LEVEL SECURITY;

-- Admins: full access to club_rules
CREATE POLICY "Admins can manage club rules"
  ON club_rules FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Members: read active rules
CREATE POLICY "Members can view active club rules"
  ON club_rules FOR SELECT
  USING (is_active = true);

-- Admins: full access to signatures
CREATE POLICY "Admins can view all signatures"
  ON club_rule_signatures FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Members: read own signatures
CREATE POLICY "Members can view own signatures"
  ON club_rule_signatures FOR SELECT
  USING (user_id = auth.uid());

-- Members: insert own signatures
CREATE POLICY "Members can sign rules"
  ON club_rule_signatures FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Grant permissions (matching existing pattern from grant_permissions migration)
GRANT ALL ON club_rules TO service_role;
GRANT ALL ON club_rules TO authenticated;
GRANT ALL ON club_rule_signatures TO service_role;
GRANT ALL ON club_rule_signatures TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
