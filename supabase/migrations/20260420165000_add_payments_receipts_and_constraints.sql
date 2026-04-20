CREATE UNIQUE INDEX IF NOT EXISTS meal_plans_user_id_plan_date_key
ON public.meal_plans (user_id, plan_date);

ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL DEFAULT 'demo' CHECK (gateway IN ('demo')),
  gateway_reference TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('daily', 'weekly', 'monthly')),
  amount_inr INTEGER NOT NULL CHECK (amount_inr > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;

CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL UNIQUE DEFAULT ('RCPT-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 12))),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('daily', 'weekly', 'monthly')),
  amount_inr INTEGER NOT NULL CHECK (amount_inr > 0),
  receipt_payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own receipts" ON public.receipts;
DROP POLICY IF EXISTS "Users can insert own receipts" ON public.receipts;

CREATE POLICY "Users can view own receipts" ON public.receipts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own receipts" ON public.receipts FOR INSERT WITH CHECK (auth.uid() = user_id);
