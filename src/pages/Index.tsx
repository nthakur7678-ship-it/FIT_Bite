import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Leaf } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  useEffect(() => {
    if (authLoading || profileLoading) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    if (!profile?.profile_completed) {
      navigate('/profile-setup');
      return;
    }

    navigate('/dashboard');
  }, [user, authLoading, profile, profileLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse-soft text-primary">
        <Leaf className="w-10 h-10" />
      </div>
    </div>
  );
};

export default Index;
