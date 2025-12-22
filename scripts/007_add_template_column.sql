-- Add template column to link_blocks table
ALTER TABLE link_blocks
ADD COLUMN template TEXT DEFAULT 'classic';

-- Update existing links to use classic template
UPDATE link_blocks SET template = 'classic' WHERE template IS NULL;
