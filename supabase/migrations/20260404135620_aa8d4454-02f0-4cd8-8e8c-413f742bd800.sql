INSERT INTO public.site_settings (key, value)
VALUES ('login_page', '{"bg_image": "/images/login-bg.png", "logo": "/images/hospital-logo.svg", "title_en": "Taif Children''s Hospital", "title_ar": "مستشفى الطائف للأطفال"}'::jsonb)
ON CONFLICT (key) DO NOTHING;