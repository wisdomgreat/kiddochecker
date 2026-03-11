-- Migration: 20260311230000_staff_scheduling.sql

CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'canceled', 'absent')),
    role_type TEXT NOT NULL DEFAULT 'volunteer' CHECK (role_type IN ('leader', 'assistant', 'volunteer', 'admin')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access to shifts" 
    ON public.shifts FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Staff can view their own shifts
CREATE POLICY "Staff view own shifts"
    ON public.shifts FOR SELECT
    USING (staff_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_shifts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_shift_update
    BEFORE UPDATE ON public.shifts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_shifts_updated_at();
