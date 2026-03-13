CREATE TABLE public.saved_meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  plan_data jsonb NOT NULL,
  considerations jsonb,
  duration integer NOT NULL DEFAULT 3
);

ALTER TABLE public.saved_meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal plans" ON public.saved_meal_plans
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans" ON public.saved_meal_plans
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans" ON public.saved_meal_plans
  FOR DELETE TO authenticated USING (auth.uid() = user_id);