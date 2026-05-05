
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'user');
CREATE TYPE public.admin_type AS ENUM ('khabri', 'professor');
CREATE TYPE public.user_type AS ENUM ('student', 'alumni', 'faculty');
CREATE TYPE public.resource_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.opp_status AS ENUM ('open', 'closed');
CREATE TYPE public.community_category AS ENUM ('lost_found', 'rooms', 'marketplace');
CREATE TYPE public.support_urgency AS ENUM ('standard', 'emergency');
CREATE TYPE public.support_status AS ENUM ('pending', 'approved', 'resolved');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  college_name TEXT NOT NULL DEFAULT 'UECU',
  mobile_number TEXT,
  user_type public.user_type NOT NULL DEFAULT 'student',
  branch TEXT,
  year INT,
  verified BOOLEAN NOT NULL DEFAULT false,
  is_disabled BOOLEAN NOT NULL DEFAULT false,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  admin_type public.admin_type,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- helper functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','super_admin'));
$$;

CREATE OR REPLACE FUNCTION public.has_admin_type(_user_id UUID, _t public.admin_type)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND admin_type = _t);
$$;

CREATE OR REPLACE FUNCTION public.is_verified(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND verified = true AND is_disabled = false AND is_banned = false);
$$;

-- profile policies
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins update any profile" ON public.profiles FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- roles policies
CREATE POLICY "Roles viewable by authenticated" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- handle new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    CASE WHEN NEW.email ILIKE '%@uecu.ac.in' THEN true ELSE false END
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE PLPGSQL AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ RESOURCES ============
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  branch TEXT NOT NULL,
  year INT NOT NULL CHECK (year BETWEEN 1 AND 4),
  semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  status public.resource_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  rejected_at TIMESTAMPTZ,
  like_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER resources_touch BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "Resources visible to all authenticated" ON public.resources FOR SELECT TO authenticated
  USING (status = 'approved' OR uploader_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Verified users upload resources" ON public.resources FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploader_id AND public.is_verified(auth.uid()));
CREATE POLICY "Owner or admin update resources" ON public.resources FOR UPDATE TO authenticated
  USING (auth.uid() = uploader_id OR public.is_admin(auth.uid()));
CREATE POLICY "Owner or admin delete resources" ON public.resources FOR DELETE TO authenticated
  USING (auth.uid() = uploader_id OR public.is_admin(auth.uid()));

CREATE TABLE public.resource_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, resource_id)
);
ALTER TABLE public.resource_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes visible to authenticated" ON public.resource_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Verified users like" ON public.resource_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_verified(auth.uid()));
CREATE POLICY "Users unlike own" ON public.resource_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- like count trigger
CREATE OR REPLACE FUNCTION public.update_resource_like_count()
RETURNS TRIGGER LANGUAGE PLPGSQL AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.resources SET like_count = like_count + 1 WHERE id = NEW.resource_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.resources SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.resource_id;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER resource_likes_count
AFTER INSERT OR DELETE ON public.resource_likes
FOR EACH ROW EXECUTE FUNCTION public.update_resource_like_count();

-- mark rejected_at when status becomes rejected
CREATE OR REPLACE FUNCTION public.mark_rejected_at()
RETURNS TRIGGER LANGUAGE PLPGSQL AS $$
BEGIN
  IF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    NEW.rejected_at = now();
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER resource_rejected BEFORE UPDATE ON public.resources
FOR EACH ROW EXECUTE FUNCTION public.mark_rejected_at();

-- cleanup function for rejected > 24h
CREATE OR REPLACE FUNCTION public.cleanup_rejected_resources()
RETURNS void LANGUAGE PLPGSQL SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.resources WHERE status = 'rejected' AND rejected_at < now() - INTERVAL '24 hours';
END; $$;

-- ============ OPPORTUNITIES ============
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  description TEXT NOT NULL,
  apply_url TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  location TEXT,
  deadline DATE,
  status public.opp_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER opps_touch BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "Opps viewable by authenticated" ON public.opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Khabri admin manage opps" ON public.opportunities FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) AND public.has_admin_type(auth.uid(), 'khabri'))
  WITH CHECK (public.is_admin(auth.uid()) AND public.has_admin_type(auth.uid(), 'khabri'));

-- ============ COMMUNITY ============
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category public.community_category NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  price NUMERIC,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER cp_touch BEFORE UPDATE ON public.community_posts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- marketplace requires price + image
CREATE OR REPLACE FUNCTION public.validate_community_post()
RETURNS TRIGGER LANGUAGE PLPGSQL AS $$
BEGIN
  IF NEW.category = 'marketplace' THEN
    IF NEW.price IS NULL OR NEW.price <= 0 THEN RAISE EXCEPTION 'Marketplace posts require price'; END IF;
    IF NEW.images IS NULL OR array_length(NEW.images,1) IS NULL THEN RAISE EXCEPTION 'Marketplace posts require at least one image'; END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER cp_validate BEFORE INSERT OR UPDATE ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.validate_community_post();

CREATE POLICY "Posts viewable" ON public.community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Verified create posts" ON public.community_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND public.is_verified(auth.uid()));
CREATE POLICY "Owner or admin update post" ON public.community_posts FOR UPDATE TO authenticated
  USING (auth.uid() = author_id OR public.is_admin(auth.uid()));
CREATE POLICY "Owner or admin delete post" ON public.community_posts FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR public.is_admin(auth.uid()));

CREATE TABLE public.community_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Replies viewable" ON public.community_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Verified reply" ON public.community_replies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND public.is_verified(auth.uid()));
CREATE POLICY "Owner or admin delete reply" ON public.community_replies FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR public.is_admin(auth.uid()));

-- ============ SUPPORT ============
CREATE TABLE public.support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  urgency public.support_urgency NOT NULL DEFAULT 'standard',
  anonymous BOOLEAN NOT NULL DEFAULT false,
  status public.support_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER sr_touch BEFORE UPDATE ON public.support_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- emergency auto-approves
CREATE OR REPLACE FUNCTION public.support_emergency_autostatus()
RETURNS TRIGGER LANGUAGE PLPGSQL AS $$
BEGIN
  IF NEW.urgency = 'emergency' AND NEW.status = 'pending' THEN
    NEW.status = 'approved';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER sr_emergency BEFORE INSERT ON public.support_requests
FOR EACH ROW EXECUTE FUNCTION public.support_emergency_autostatus();

CREATE POLICY "Support visible to authenticated" ON public.support_requests FOR SELECT TO authenticated
  USING (status IN ('approved','resolved') OR author_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Verified create support" ON public.support_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND public.is_verified(auth.uid()));
CREATE POLICY "Owner or admin update support" ON public.support_requests FOR UPDATE TO authenticated
  USING (auth.uid() = author_id OR public.is_admin(auth.uid()));
CREATE POLICY "Owner or admin delete support" ON public.support_requests FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR public.is_admin(auth.uid()));

CREATE TABLE public.support_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.support_requests(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.support_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Replies visible" ON public.support_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Verified reply support" ON public.support_replies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND public.is_verified(auth.uid()));
CREATE POLICY "Owner or admin delete reply" ON public.support_replies FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR public.is_admin(auth.uid()));

-- ============ ADMIN ACTIONS ============
CREATE TABLE public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read actions" ON public.admin_actions FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins write actions" ON public.admin_actions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = admin_id AND public.is_admin(auth.uid()));

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User reads own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User updates own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins create notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- notify on resource approval/reject
CREATE OR REPLACE FUNCTION public.notify_resource_status()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status <> OLD.status AND NEW.status IN ('approved','rejected') THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (NEW.uploader_id,
      'Resource ' || NEW.status,
      'Your resource "' || NEW.title || '" was ' || NEW.status || '.',
      '/resources');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER resource_notify AFTER UPDATE ON public.resources
FOR EACH ROW EXECUTE FUNCTION public.notify_resource_status();

-- notify on support status
CREATE OR REPLACE FUNCTION public.notify_support_status()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status <> OLD.status THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (NEW.author_id,
      'Support request ' || NEW.status,
      'Your request "' || NEW.subject || '" is now ' || NEW.status || '.',
      '/support');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER support_notify AFTER UPDATE ON public.support_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_support_status();

-- ============ STORAGE ============
INSERT INTO storage.buckets (id, name, public) VALUES ('resources','resources', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('community-images','community-images', true);

-- resources bucket: only verified users upload to their own folder; admins can read/delete; uploader can read/delete own
CREATE POLICY "Verified upload resources file" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'resources'
    AND public.is_verified(auth.uid())
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Owner read own resource files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resources' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin(auth.uid()) OR public.is_verified(auth.uid())));
CREATE POLICY "Owner or admin delete resource files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'resources' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin(auth.uid())));

-- community images: verified upload to own folder
CREATE POLICY "Public read community images" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'community-images');
CREATE POLICY "Verified upload community images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'community-images'
    AND public.is_verified(auth.uid())
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Owner delete community images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'community-images' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin(auth.uid())));
