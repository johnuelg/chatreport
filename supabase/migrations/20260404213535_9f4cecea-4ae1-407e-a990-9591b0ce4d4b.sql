ALTER TABLE public.custom_roles ADD COLUMN description text NOT NULL DEFAULT '';
ALTER TABLE public.custom_roles ADD COLUMN is_system boolean NOT NULL DEFAULT false;

UPDATE public.custom_roles SET description = 'Full system access and user management', is_system = true WHERE name = 'Administrator';
UPDATE public.custom_roles SET description = 'Hospital Director' WHERE name = 'Director';
UPDATE public.custom_roles SET description = 'Hospital Doctor' WHERE name = 'Doctor';
UPDATE public.custom_roles SET description = 'Staff Coordinator' WHERE name = 'Nurse';
UPDATE public.custom_roles SET description = 'Hospital Data Collector' WHERE name = 'Data Collector';