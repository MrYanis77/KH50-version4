
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles: only admins can read/manage
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Contributions table
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  memorial_person_id INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('testimony', 'photograph', 'video', 'story', 'document', 'place')),
  title TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_id UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- Users can view their own contributions + all approved ones
CREATE POLICY "Users can view own contributions"
  ON public.contributions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR status = 'approved');

-- Admins can view all contributions
CREATE POLICY "Admins can view all contributions"
  ON public.contributions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert their own contributions
CREATE POLICY "Users can insert contributions"
  ON public.contributions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can update contributions (for moderation)
CREATE POLICY "Admins can update contributions"
  ON public.contributions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can update their own pending contributions
CREATE POLICY "Users can update own pending contributions"
  ON public.contributions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

-- Users can delete their own pending contributions
CREATE POLICY "Users can delete own pending contributions"
  ON public.contributions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

-- Admins can delete any contribution
CREATE POLICY "Admins can delete contributions"
  ON public.contributions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_contributions_updated_at
  BEFORE UPDATE ON public.contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for contribution media
INSERT INTO storage.buckets (id, name, public) VALUES ('contributions', 'contributions', true);

CREATE POLICY "Anyone can view contribution files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'contributions');

CREATE POLICY "Authenticated users can upload contribution files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'contributions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own contribution files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'contributions' AND auth.uid()::text = (storage.foldername(name))[1]);
