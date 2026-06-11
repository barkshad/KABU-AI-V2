-- Supabase Schema Migration for Kabu AI

-- 1. Users Table (Extending default auth.users is standard, but keeping a public profile table is better)
-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  student_number TEXT,
  faculty TEXT,
  department TEXT,
  year_of_study TEXT,
  role TEXT DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  status TEXT DEFAULT 'Draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  documentId TEXT UNIQUE NOT NULL,
  fileUrl TEXT,
  cloudinaryUrl TEXT,
  fileFormat TEXT,
  fileSizeBytes BIGINT,
  originalFilename TEXT
);

-- Settings Table (Global configuration)
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY,
  "allowInternet" BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: Seed global settings
INSERT INTO public.settings (id, "allowInternet") VALUES ('global', false) ON CONFLICT DO NOTHING;

-- 2. Row Level Security (RLS)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile." 
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles." 
  ON public.profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update their own profile." 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Documents Policies
CREATE POLICY "Anyone can view published documents." 
  ON public.documents FOR SELECT USING (status = 'Published');

CREATE POLICY "Admin can completely manage documents." 
  ON public.documents FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Settings Policies
CREATE POLICY "Anyone can view settings." 
  ON public.settings FOR SELECT USING (true);

CREATE POLICY "Admin can update settings." 
  ON public.settings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Storage buckets
-- Create a "resources" bucket for user files.
insert into storage.buckets (id, name, public) values ('resources', 'resources', true) on conflict do nothing;

CREATE POLICY "Anyone can read public resources"
  ON storage.objects FOR SELECT USING (bucket_id = 'resources');

CREATE POLICY "Authenticated users can upload resources"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resources' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can manage resources"
  ON storage.objects FOR ALL USING (
    bucket_id = 'resources' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
