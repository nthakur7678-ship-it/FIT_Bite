import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { User, MapPin, ArrowRight } from 'lucide-react';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { updateProfile } = useProfile();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '', age: '', weight: '', height: '', city: '', pincode: '', address: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.age || !form.weight || !form.height || !form.city) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await updateProfile.mutateAsync({
        name: form.name,
        age: parseInt(form.age),
        weight: parseFloat(form.weight),
        height: parseFloat(form.height),
        city: form.city,
        pincode: form.pincode,
        address: form.address,
      });
      navigate('/quiz');
    } catch {
      toast({ title: 'Failed to save profile', variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
            <User className="w-6 h-6 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-1 text-sm">Help us personalize your experience</p>
        </div>

        <div className="bg-card rounded-2xl shadow-card p-6 space-y-4 animate-slide-up">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Full Name *</label>
            <Input placeholder="Your name" value={form.name} onChange={e => handleChange('name', e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Age *</label>
              <Input type="number" placeholder="20" value={form.age} onChange={e => handleChange('age', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Weight (kg) *</label>
              <Input type="number" placeholder="65" value={form.weight} onChange={e => handleChange('weight', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Height (cm) *</label>
              <Input type="number" placeholder="170" value={form.height} onChange={e => handleChange('height', e.target.value)} />
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
              <MapPin className="w-4 h-4" /> Location Details
            </div>
            <div className="space-y-3">
              <Input placeholder="City *" value={form.city} onChange={e => handleChange('city', e.target.value)} />
              <Input placeholder="Pincode" value={form.pincode} onChange={e => handleChange('pincode', e.target.value)} />
              <Input placeholder="Full Address" value={form.address} onChange={e => handleChange('address', e.target.value)} />
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full gradient-primary text-primary-foreground mt-2">
            {loading ? 'Saving...' : 'Continue to Health Quiz'}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
