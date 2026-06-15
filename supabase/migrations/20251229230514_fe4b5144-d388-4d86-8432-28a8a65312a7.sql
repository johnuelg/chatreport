-- Add abbreviation column to domains table
ALTER TABLE public.domains 
ADD COLUMN abbreviation text;

-- Add comment for the column
COMMENT ON COLUMN public.domains.abbreviation IS 'Short abbreviation for the domain displayed on badges';