-- Add workshop fields to opportunities
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS event_at timestamptz,
  ADD COLUMN IF NOT EXISTS conducted_by text,
  ADD COLUMN IF NOT EXISTS mode text;

-- Notify all verified users when a new opportunity is created
CREATE OR REPLACE FUNCTION public.notify_new_opportunity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, link)
  SELECT p.id,
         'New ' || NEW.category || ' posted',
         COALESCE(NEW.role, '') || CASE WHEN NEW.company IS NOT NULL AND NEW.company <> '' THEN ' · ' || NEW.company ELSE '' END,
         '/opportunities'
  FROM public.profiles p
  WHERE p.verified = true AND p.is_disabled = false AND p.is_banned = false AND p.id <> NEW.created_by;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_opportunity ON public.opportunities;
CREATE TRIGGER trg_notify_new_opportunity
AFTER INSERT ON public.opportunities
FOR EACH ROW EXECUTE FUNCTION public.notify_new_opportunity();

-- Realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.opportunities REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.opportunities; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;