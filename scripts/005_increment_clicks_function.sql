-- Create function to increment link click counts
CREATE OR REPLACE FUNCTION increment_link_clicks(link_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE link_blocks
  SET click_count = click_count + 1
  WHERE id = link_id;
END;
$$;
