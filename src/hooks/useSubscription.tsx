import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useSubscription = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (data) return data;

      const { data: inserted, error: insertError } = await supabase
        .from('subscriptions')
        .insert({ user_id: user.id })
        .select()
        .single();
      if (insertError) throw insertError;
      return inserted;
    },
    enabled: !!user,
    retry: false,
  });

  const subscription = query.data;
  const now = new Date();
  const trialEnd = subscription?.trial_end_date ? new Date(subscription.trial_end_date) : null;
  const isTrialActive = subscription?.is_trial && trialEnd && trialEnd > now;
  const isSubscriptionActive = subscription?.status === 'active' && !subscription?.is_trial && subscription?.subscription_end_date && new Date(subscription.subscription_end_date) > now;
  const hasAccess = isTrialActive || isSubscriptionActive;

  const daysLeft = trialEnd && isTrialActive
    ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    subscription,
    isLoading: query.isLoading,
    isTrialActive: !!isTrialActive,
    isSubscriptionActive: !!isSubscriptionActive,
    hasAccess: !!hasAccess,
    daysLeft,
  };
};
