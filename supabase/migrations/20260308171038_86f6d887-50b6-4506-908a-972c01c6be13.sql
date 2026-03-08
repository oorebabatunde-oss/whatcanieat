
CREATE TABLE public.saved_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cuisine TEXT,
  image_query TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved recommendations"
  ON public.saved_recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved recommendations"
  ON public.saved_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved recommendations"
  ON public.saved_recommendations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
