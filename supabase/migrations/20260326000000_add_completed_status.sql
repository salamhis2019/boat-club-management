-- Add 'completed' to reservation_status enum
ALTER TYPE reservation_status ADD VALUE 'completed';

-- Function to mark past active reservations as completed
-- Uses pg_trigger_depth() to prevent infinite recursion
CREATE OR REPLACE FUNCTION complete_past_reservations()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() = 1 THEN
    UPDATE reservations
    SET status = 'completed'
    WHERE status = 'active'
      AND date < CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: auto-complete past reservations on INSERT or UPDATE
CREATE TRIGGER trg_complete_past_reservations
  AFTER INSERT OR UPDATE ON reservations
  FOR EACH STATEMENT
  EXECUTE FUNCTION complete_past_reservations();

-- Backfill: complete all existing past active reservations
UPDATE reservations
SET status = 'completed'
WHERE status = 'active'
  AND date < CURRENT_DATE;
