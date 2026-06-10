-- Remove the auto-create profile trigger
-- Profile creation is now handled explicitly in the application code

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
