-- Add cover_photo column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cover_photo TEXT;
