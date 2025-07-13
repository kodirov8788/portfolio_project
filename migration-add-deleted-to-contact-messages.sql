-- Migration: Add deleted column to contact_messages table
-- This enables soft-delete functionality instead of hard-delete

-- Add deleted column with default value FALSE
ALTER TABLE public.contact_messages 
ADD COLUMN deleted BOOLEAN DEFAULT FALSE NOT NULL;

-- Create index for better performance when filtering by deleted status
CREATE INDEX idx_contact_messages_deleted ON public.contact_messages(deleted);

-- Update existing messages to ensure they are not marked as deleted
UPDATE public.contact_messages 
SET deleted = FALSE 
WHERE deleted IS NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN public.contact_messages.deleted IS 'Soft delete flag - when TRUE, message is considered deleted and should not appear in normal queries'; 