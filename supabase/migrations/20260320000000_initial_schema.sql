-- Initial database schema for Boat Club Management
-- Migration: 20260320000000_initial_schema

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'member', 'sub_user');
CREATE TYPE membership_type AS ENUM ('monthly', 'annual');
CREATE TYPE reservation_status AS ENUM ('active', 'cancelled');
CREATE TYPE charge_type AS ENUM ('gas', 'misc');
CREATE TYPE charge_status AS ENUM ('pending', 'paid', 'failed');
CREATE TYPE document_type AS ENUM ('waiver', 'drivers_license');

-- ============================================
-- TABLES
-- ============================================

-- Users (profile data, linked to auth.users)
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  parent_user_id uuid REFERENCES users(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone_number text NOT NULL DEFAULT '',
  membership_type membership_type NOT NULL DEFAULT 'monthly',
  membership_active boolean NOT NULL DEFAULT false,
  documents_approved boolean NOT NULL DEFAULT false,
  stripe_customer_id text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Boats
CREATE TABLE boats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text,
  description text,
  capacity integer NOT NULL DEFAULT 1,
  horsepower text,
  features text[] NOT NULL DEFAULT '{}',
  supported_activities text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Time slots
CREATE TABLE time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Reservations
CREATE TABLE reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  boat_id uuid NOT NULL REFERENCES boats(id),
  date date NOT NULL,
  time_slot_id uuid NOT NULL REFERENCES time_slots(id),
  status reservation_status NOT NULL DEFAULT 'active',
  created_by uuid NOT NULL REFERENCES users(id),
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Blocked dates (per boat)
CREATE TABLE blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id uuid NOT NULL REFERENCES boats(id),
  date date NOT NULL,
  reason text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Charges (gas + misc, per trip)
CREATE TABLE charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  reservation_id uuid REFERENCES reservations(id),
  amount integer NOT NULL,
  type charge_type NOT NULL,
  description text NOT NULL DEFAULT '',
  status charge_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id text,
  retry_count integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

-- Subscriptions (membership tracking)
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  type membership_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Documents (waiver, license)
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  type document_type NOT NULL,
  file_url text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  approved boolean NOT NULL DEFAULT false,
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz
);

-- Audit log
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

-- Users
CREATE INDEX idx_users_parent ON users(parent_user_id) WHERE parent_user_id IS NOT NULL;
CREATE INDEX idx_users_email ON users(email);

-- Reservations
CREATE INDEX idx_reservations_boat_date_slot ON reservations(boat_id, date, time_slot_id);
CREATE INDEX idx_reservations_user_status ON reservations(user_id, status);

-- Blocked dates
CREATE UNIQUE INDEX idx_blocked_dates_boat_date ON blocked_dates(boat_id, date);

-- Charges
CREATE INDEX idx_charges_user_status ON charges(user_id, status);

-- Documents
CREATE INDEX idx_documents_user ON documents(user_id);

-- Audit log
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_target ON audit_log(target_type, target_id);

-- ============================================
-- UNIQUE CONSTRAINTS
-- ============================================

-- Prevent double-booking: one active reservation per boat/date/slot
CREATE UNIQUE INDEX idx_reservations_no_double_booking
  ON reservations(boat_id, date, time_slot_id)
  WHERE status = 'active';

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_boats_updated_at
  BEFORE UPDATE ON boats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED: Default time slots
-- ============================================

INSERT INTO time_slots (name, start_time, end_time) VALUES
  ('Morning', '09:00', '13:00'),
  ('Afternoon', '14:00', '18:00');
