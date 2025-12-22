-- Add partner tracking to user_documents table
-- This allows admins to see which partner uploaded documents for clients

ALTER TABLE public.user_documents 
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.user_documents.uploaded_by IS 'Partner who uploaded this document on behalf of the client';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.user_documents(uploaded_by);
