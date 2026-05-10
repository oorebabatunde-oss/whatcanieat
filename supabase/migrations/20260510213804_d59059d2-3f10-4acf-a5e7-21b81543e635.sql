CREATE POLICY "Users can update own meal plans"
ON public.saved_meal_plans
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);