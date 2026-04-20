import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Leaf, Lock, Mail, Shield, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState(import.meta.env.VITE_DEMO_EMAIL ?? '');
  const [password, setPassword] = useState(import.meta.env.VITE_DEMO_PASSWORD ?? '');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectPath = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, user]);

  const handleSubmit = async () => {
    if (!email || !password) {
      toast({ title: 'Email and password are required', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: fullName,
            },
          },
        });

        if (error) throw error;

        toast({
          title: 'Account created',
          description: 'Your FitBite account is ready. Sign in to continue.',
        });
        setMode('signin');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      navigate(redirectPath, { replace: true });
    } catch (error) {
      toast({
        title: mode === 'signup' ? 'Unable to create account' : 'Unable to sign in',
        description: error instanceof Error ? error.message : 'Unexpected authentication error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    const demoEmail = import.meta.env.VITE_DEMO_EMAIL;
    const demoPassword = import.meta.env.VITE_DEMO_PASSWORD;

    if (!demoEmail || !demoPassword) {
      toast({
        title: 'Demo account not configured',
        description: 'Set VITE_DEMO_EMAIL and VITE_DEMO_PASSWORD to enable one-click demo access.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    });
    setLoading(false);

    if (error) {
      toast({ title: 'Demo sign-in failed', description: error.message, variant: 'destructive' });
      return;
    }

    navigate(redirectPath, { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
            <Leaf className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground">FitBite Student</h1>
          <p className="text-muted-foreground mt-2">Healthy eating, simplified for campus life</p>
        </div>

        <div className="bg-card rounded-2xl shadow-card p-6 space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex rounded-xl bg-muted p-1">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${mode === 'signin' ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${mode === 'signup' ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground'}`}
            >
              Create Account
            </button>
          </div>

          {mode === 'signup' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <Input
                type="text"
                placeholder="Enter your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {mode === 'signup' ? 'Use at least 8 characters for your account password.' : 'Use your FitBite login to continue.'}
            </p>
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full gradient-primary text-primary-foreground">
            {loading ? (mode === 'signup' ? 'Creating account...' : 'Signing in...') : (mode === 'signup' ? 'Create Account' : 'Sign In')}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>

          <Button onClick={handleDemoSignIn} disabled={loading} variant="outline" className="w-full">
            Sign In with Demo Account
          </Button>
        </div>

        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure</span>
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Demo-ready billing</span>
          <span className="flex items-center gap-1"><Leaf className="w-3 h-3" /> Supabase auth</span>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
