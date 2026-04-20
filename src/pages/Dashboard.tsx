import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Apple,
  Clock,
  Coffee,
  Droplets,
  Flame,
  Leaf,
  LogOut,
  Moon,
  RefreshCw,
  Sandwich,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Meal {
  type: string;
  time: string;
  name: string;
  calories: number;
  description: string;
}

interface MealPlanData {
  meals: Meal[];
  total_calories: number;
  hydration_tip: string;
  fitness_tip: string;
}

const mealIcons: Record<string, React.ReactNode> = {
  breakfast: <Coffee className="w-5 h-5" />,
  lunch: <Sun className="w-5 h-5" />,
  snack: <Apple className="w-5 h-5" />,
  dinner: <Moon className="w-5 h-5" />,
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { isTrialActive, hasAccess, daysLeft } = useSubscription();
  const { toast } = useToast();
  const [mealPlan, setMealPlan] = useState<MealPlanData | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => {
    if (!profileLoading && profile && !profile.profile_completed) {
      navigate('/profile-setup');
    }
  }, [profile, profileLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchPlan = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_date', today)
        .limit(1)
        .maybeSingle();

      if (data) {
        setMealPlan({
          meals: data.meals as unknown as Meal[],
          total_calories: data.total_calories ?? 0,
          hydration_tip: (data.nutrition_data as Record<string, string>)?.hydration_tip ?? 'Drink 8 glasses of water today!',
          fitness_tip: (data.nutrition_data as Record<string, string>)?.fitness_tip ?? 'Take a 20-minute walk between classes.',
        });
      }
    };

    fetchPlan();
  }, [user]);

  const generatePlan = async () => {
    if (!user) return;

    setLoadingPlan(true);
    try {
      const res = await supabase.functions.invoke('generate-meal-plan', {
        body: { user_id: user.id },
      });

      if (res.error) throw res.error;

      setMealPlan(res.data as MealPlanData);
      toast({ title: 'Meal plan generated!', description: 'Your personalized plan is ready.' });
    } catch (error) {
      toast({
        title: 'Failed to generate plan',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPlan(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-soft text-primary"><Leaf className="w-8 h-8" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="gradient-primary px-4 pt-8 pb-12 rounded-b-3xl">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Leaf className="w-6 h-6 text-primary-foreground" />
              <span className="font-heading font-bold text-primary-foreground">FitBite</span>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} className="text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
          <h1 className="text-2xl font-heading font-bold text-primary-foreground">
            Hey, {profile?.name ?? 'Student'}!
          </h1>
          <p className="text-primary-foreground/80 text-sm mt-1">Let's eat healthy today</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-6 space-y-4">
        {isTrialActive && (
          <div className="bg-secondary/10 border border-secondary/30 rounded-xl px-4 py-3 flex items-center gap-3 animate-fade-in">
            <Clock className="w-5 h-5 text-secondary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Free Trial: {daysLeft} days left</p>
              <p className="text-xs text-muted-foreground">Explore all features during your trial</p>
            </div>
          </div>
        )}

        {!hasAccess && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 flex items-center gap-3 animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Trial expired</p>
              <p className="text-xs text-muted-foreground">Subscribe to continue using FitBite</p>
            </div>
            <Button size="sm" onClick={() => navigate('/subscribe')} className="ml-auto gradient-warm text-primary-foreground text-xs">
              Subscribe
            </Button>
          </div>
        )}

        {hasAccess && (
          <div className="bg-card rounded-xl shadow-soft px-4 py-3 flex items-center justify-between animate-fade-in">
            <div>
              <p className="text-sm font-medium text-foreground">Billing & receipts</p>
              <p className="text-xs text-muted-foreground">Manage demo subscription payments and download receipts</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/subscribe')}>
              Open
            </Button>
          </div>
        )}

        {mealPlan ? (
          <>
            <div className="bg-card rounded-2xl shadow-card p-5 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-bold text-foreground flex items-center gap-2">
                  <Sandwich className="w-5 h-5 text-primary" /> Today's Meals
                </h2>
                <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3" /> {mealPlan.total_calories} cal
                </span>
              </div>
              <div className="space-y-3">
                {mealPlan.meals.map((meal, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-accent-foreground flex-shrink-0">
                      {mealIcons[meal.type.toLowerCase()] ?? <Apple className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-foreground">{meal.name}</p>
                        <span className="text-xs text-muted-foreground">{meal.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{meal.description}</p>
                      <p className="text-xs text-primary font-medium mt-1">{meal.calories} cal</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="bg-card rounded-xl shadow-soft p-4">
                <Droplets className="w-5 h-5 text-primary mb-2" />
                <p className="text-xs font-medium text-foreground">Hydration</p>
                <p className="text-xs text-muted-foreground mt-1">{mealPlan.hydration_tip}</p>
              </div>
              <div className="bg-card rounded-xl shadow-soft p-4">
                <Sparkles className="w-5 h-5 text-secondary mb-2" />
                <p className="text-xs font-medium text-foreground">Fitness Tip</p>
                <p className="text-xs text-muted-foreground mt-1">{mealPlan.fitness_tip}</p>
              </div>
            </div>

            <Button onClick={generatePlan} disabled={loadingPlan} variant="outline" className="w-full">
              <RefreshCw className={`mr-2 w-4 h-4 ${loadingPlan ? 'animate-spin' : ''}`} />
              Regenerate Plan
            </Button>
          </>
        ) : (
          <div className="bg-card rounded-2xl shadow-card p-8 text-center animate-slide-up">
            <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
            <h2 className="font-heading font-bold text-foreground mb-1">Generate Your Meal Plan</h2>
            <p className="text-sm text-muted-foreground mb-4">Create a personalized daily plan based on your profile and quiz answers.</p>
            <Button onClick={generatePlan} disabled={loadingPlan || !hasAccess} className="gradient-primary text-primary-foreground">
              {loadingPlan ? (
                <><RefreshCw className="mr-2 w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="mr-2 w-4 h-4" /> Generate Meal Plan</>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
