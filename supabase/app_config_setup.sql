-- SQL to create the app configuration table for Force Updates
-- Run this in the Supabase SQL Editor

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.app_config (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    min_version TEXT NOT NULL DEFAULT '1.0.0',
    download_url TEXT NOT NULL DEFAULT 'https://play.google.com/store/apps/details?id=com.taxfriendindia.app',
    update_message TEXT NOT NULL DEFAULT 'A new version of TaxFriend India is available. Please update to continue using the app.',
    is_maintenance_mode BOOLEAN NOT NULL DEFAULT false,
    maintenance_message TEXT NOT NULL DEFAULT 'We are currently performing scheduled maintenance. Please check back later.',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- 3. Create policy to allow anyone to read (SELECT)
CREATE POLICY "Allow public read access to app_config" 
ON public.app_config 
FOR SELECT 
USING (true);

-- 4. Insert initial configuration
INSERT INTO public.app_config (min_version, download_url)
VALUES ('1.0.0', 'https://play.google.com/store/apps/details?id=com.taxfriendindia.app');

-- Add comment to the table
COMMENT ON TABLE public.app_config IS 'Configuration for mobile app versioning and maintenance mode.';
