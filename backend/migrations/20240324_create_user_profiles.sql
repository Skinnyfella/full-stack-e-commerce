-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create RLS policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

-- Allow users to update their own profile (except role)
CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = OLD.role);

-- Allow service role to manage all profiles
CREATE POLICY "Service role can manage all profiles"
    ON user_profiles
    USING (auth.role() = 'service_role');

-- Create function to handle user creation with admin email check
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    admin_email TEXT := 'admin@example.com'; -- Replace this with your actual admin email
BEGIN
    INSERT INTO public.user_profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        CASE 
            WHEN NEW.email = admin_email THEN 'admin'
            ELSE 'customer'
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert admin user profile if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE email = 'admin@example.com'
    ) THEN
        -- Note: You'll need to manually create the admin user through Supabase Auth first
        -- This just ensures the profile exists
        INSERT INTO public.user_profiles (id, email, name, role)
        SELECT id, email, COALESCE(raw_user_meta_data->>'name', 'Admin User'), 'admin'
        FROM auth.users
        WHERE email = 'admin@example.com'
        ON CONFLICT DO NOTHING;
    END IF;
END $$; 