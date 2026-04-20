import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

const questions = [
  {
    key: 'diet_type',
    question: 'What type of diet do you follow?',
    options: ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Eggetarian'],
  },
  {
    key: 'activity_level',
    question: 'How active are you?',
    options: ['Sedentary (mostly sitting)', 'Lightly active (walks, light exercise)', 'Moderately active (gym 3-4x/week)', 'Very active (daily intense exercise)'],
  },
  {
    key: 'primary_goal',
    question: 'What is your primary health goal?',
    options: ['Lose weight', 'Gain weight', 'Maintain weight', 'Build muscle', 'Improve energy'],
  },
  {
    key: 'meals_per_day',
    question: 'How many meals do you prefer per day?',
    options: ['2 meals', '3 meals', '4 meals (with snacks)', '5-6 small meals'],
  },
  {
    key: 'allergies',
    question: 'Do you have any food allergies?',
    options: ['None', 'Dairy', 'Gluten', 'Nuts', 'Soy', 'Seafood'],
    multi: true,
  },
  {
    key: 'budget',
    question: 'What is your daily food budget?',
    options: ['Under INR 100', 'INR 100-200', 'INR 200-350', 'INR 350+'],
  },
  {
    key: 'cooking',
    question: 'Do you have access to cooking?',
    options: ['Yes, full kitchen', 'Limited (microwave, basic)', 'No, I rely on outside food'],
  },
  {
    key: 'schedule',
    question: 'What does your daily schedule look like?',
    options: ['Early bird (6am-10pm)', 'Regular (8am-12am)', 'Night owl (10am-2am)', 'Irregular/shifting'],
  },
] as const;

const HealthQuiz = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateProfile } = useProfile();
  const { toast } = useToast();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(false);

  const q = questions[currentQ];

  const handleSelect = (option: string) => {
    if (q.multi) {
      const current = (answers[q.key] as string[]) || [];
      if (option === 'None') {
        setAnswers({ ...answers, [q.key]: ['None'] });
        return;
      }

      const filtered = current.filter((value) => value !== 'None');
      setAnswers({
        ...answers,
        [q.key]: filtered.includes(option)
          ? filtered.filter((value) => value !== option)
          : [...filtered, option],
      });
      return;
    }

    setAnswers({ ...answers, [q.key]: option });
  };

  const isSelected = (option: string) => {
    const value = answers[q.key];
    if (Array.isArray(value)) return value.includes(option);
    return value === option;
  };

  const canNext = q.multi ? ((answers[q.key] as string[])?.length ?? 0) > 0 : Boolean(answers[q.key]);

  const handleFinish = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await supabase.from('quiz_responses').insert({
        user_id: user.id,
        answers: answers as Json,
      });

      const allergiesArr = Array.isArray(answers.allergies)
        ? (answers.allergies as string[]).filter((item) => item !== 'None')
        : [];
      const goalsArr = typeof answers.primary_goal === 'string' ? [answers.primary_goal] : [];

      await updateProfile.mutateAsync({
        allergies: allergiesArr,
        goals: goalsArr,
        preferences: [answers.diet_type as string, answers.budget as string].filter(Boolean),
        profile_completed: true,
      });

      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Failed to save quiz',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Question {currentQ + 1} of {questions.length}</span>
            <span>{Math.round(((currentQ + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full gradient-primary rounded-full transition-all duration-500"
              style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-card p-6 animate-slide-up" key={currentQ}>
          <h2 className="text-lg font-heading font-bold text-foreground mb-1">{q.question}</h2>
          {q.multi && <p className="text-xs text-muted-foreground mb-4">Select all that apply</p>}

          <div className="space-y-2 mt-4">
            {q.options.map((option) => (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  isSelected(option)
                    ? 'border-primary bg-accent text-accent-foreground'
                    : 'border-border bg-background text-foreground hover:border-primary/40'
                }`}
              >
                <span className="flex items-center justify-between">
                  {option}
                  {isSelected(option) && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </span>
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            {currentQ > 0 && (
              <Button variant="outline" onClick={() => setCurrentQ(currentQ - 1)} className="flex-1">
                <ArrowLeft className="mr-2 w-4 h-4" /> Back
              </Button>
            )}
            {currentQ < questions.length - 1 ? (
              <Button onClick={() => setCurrentQ(currentQ + 1)} disabled={!canNext} className="flex-1 gradient-primary text-primary-foreground">
                Next <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={!canNext || loading} className="flex-1 gradient-primary text-primary-foreground">
                {loading ? 'Saving your plan...' : 'Get My Meal Plan'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthQuiz;
