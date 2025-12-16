-- Enable RLS on profiles if not already (it usually is)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Superusers and Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  (select role from profiles where id = auth.uid()) IN ('admin', 'superuser')
);

-- Policy: Users can view their own profile (Standard)
-- (Existing policy likely handles this, but ensuring Admin one exists is key)
