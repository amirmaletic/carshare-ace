-- Allow the handle_new_user trigger (SECURITY DEFINER) to insert into organisaties
-- The trigger runs as the function owner, but we also need a policy for service role
-- Since handle_new_user is SECURITY DEFINER it bypasses RLS, so this is fine.

-- Also ensure the trigger is actually attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
