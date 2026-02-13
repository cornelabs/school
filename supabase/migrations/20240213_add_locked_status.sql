-- Update course status check constraint to include 'locked'
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_status_check;
ALTER TABLE courses ADD CONSTRAINT courses_status_check 
  CHECK (status IN ('draft', 'published', 'locked'));
