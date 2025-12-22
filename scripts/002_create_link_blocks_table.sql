-- Create link_blocks table to store user links (public and encrypted)
CREATE TABLE IF NOT EXISTS public.link_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('link', 'social', 'contact', 'file', 'note')),
  title TEXT NOT NULL,
  url TEXT, -- For public links
  icon TEXT, -- Icon name or URL
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private')),
  encrypted_blob TEXT, -- For private/friends-only content (AES-GCM encrypted)
  position INTEGER NOT NULL DEFAULT 0, -- For ordering
  is_active BOOLEAN DEFAULT true,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.link_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for link_blocks table

-- Public links visible to everyone
CREATE POLICY "Anyone can view public link blocks"
  ON public.link_blocks FOR SELECT
  USING (visibility = 'public' AND is_active = true);

-- Users can view their own links (all visibility levels)
CREATE POLICY "Users can view their own link blocks"
  ON public.link_blocks FOR SELECT
  USING (auth.uid() = user_id);

-- Friends can view friends-only links (requires connection check)
CREATE POLICY "Friends can view friends-only link blocks"
  ON public.link_blocks FOR SELECT
  USING (
    visibility = 'friends' 
    AND is_active = true 
    AND EXISTS (
      SELECT 1 FROM public.connections 
      WHERE status = 'accepted' 
      AND (
        (requester_id = auth.uid() AND receiver_id = user_id) 
        OR 
        (receiver_id = auth.uid() AND requester_id = user_id)
      )
    )
  );

-- Users can insert their own link blocks
CREATE POLICY "Users can insert their own link blocks"
  ON public.link_blocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own link blocks
CREATE POLICY "Users can update their own link blocks"
  ON public.link_blocks FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own link blocks
CREATE POLICY "Users can delete their own link blocks"
  ON public.link_blocks FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_link_blocks_user_id ON public.link_blocks(user_id);
CREATE INDEX idx_link_blocks_visibility ON public.link_blocks(visibility);
CREATE INDEX idx_link_blocks_position ON public.link_blocks(user_id, position);

-- Create trigger for updated_at
CREATE TRIGGER update_link_blocks_updated_at
    BEFORE UPDATE ON public.link_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
