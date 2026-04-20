import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, format } from 'date-fns';
import { ArrowLeft, CreditCard, Download, FileText, Leaf, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';

const plans = [
  { id: 'daily', label: 'Daily', price: 29, durationDays: 1, description: 'One day meal-plan access' },
  { id: 'weekly', label: 'Weekly', price: 149, durationDays: 7, description: 'Best for trying the full flow' },
  { id: 'monthly', label: 'Monthly', price: 399, durationDays: 30, description: 'Best value for steady use' },
] as const;

const buildReceiptText = (receiptNumber: string, planLabel: string, amount: number, createdAt: string) => [
  'FitBite Student Receipt',
  `Receipt No: ${receiptNumber}`,
  `Plan: ${planLabel}`,
  `Amount: INR ${amount}`,
  'Status: Paid (Demo Gateway)',
  `Issued At: ${format(new Date(createdAt), 'dd MMM yyyy, hh:mm a')}`,
].join('\n');

const SubscribePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<typeof plans[number]['id']>('weekly');
  const [isPaying, setIsPaying] = useState(false);
  const [latestReceipt, setLatestReceipt] = useState<{ number: string; content: string } | null>(null);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? plans[1],
    [selectedPlanId],
  );

  const handleDemoPayment = async () => {
    if (!user) return;

    setIsPaying(true);
    try {
      const paidAt = new Date();
      const validUntil = addDays(paidAt, selectedPlan.durationDays);

      const paymentPayload: TablesInsert<'payments'> = {
        amount_inr: selectedPlan.price,
        currency: 'INR',
        gateway: 'demo',
        gateway_reference: `DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        plan_type: selectedPlan.id,
        status: 'paid',
        user_id: user.id,
      };

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert(paymentPayload)
        .select()
        .single();

      if (paymentError || !payment) {
        throw paymentError ?? new Error('Unable to save payment');
      }

      const { data: receipt, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          amount_inr: selectedPlan.price,
          payment_id: payment.id,
          plan_type: selectedPlan.id,
          receipt_payload: {
            plan_label: selectedPlan.label,
            purchased_at: paidAt.toISOString(),
            valid_until: validUntil.toISOString(),
          },
          user_id: user.id,
        })
        .select()
        .single();

      if (receiptError || !receipt) {
        throw receiptError ?? new Error('Unable to create receipt');
      }

      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .upsert(
          {
            user_id: user.id,
            plan_type: selectedPlan.id,
            status: 'active',
            is_trial: false,
            subscription_start_date: paidAt.toISOString(),
            subscription_end_date: validUntil.toISOString(),
            trial_end_date: paidAt.toISOString(),
          },
          { onConflict: 'user_id' },
        );

      if (subscriptionError) throw subscriptionError;

      const receiptContent = buildReceiptText(receipt.receipt_number, selectedPlan.label, selectedPlan.price, receipt.created_at);
      setLatestReceipt({ number: receipt.receipt_number, content: receiptContent });

      toast({
        title: 'Demo payment successful',
        description: `${selectedPlan.label} access is now active and your receipt is ready.`,
      });
    } catch (error) {
      toast({
        title: 'Payment failed',
        description: error instanceof Error ? error.message : 'Failed to complete demo payment',
        variant: 'destructive',
      });
    } finally {
      setIsPaying(false);
    }
  };

  const downloadReceipt = () => {
    if (!latestReceipt) return;

    const blob = new Blob([latestReceipt.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${latestReceipt.number}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Leaf className="w-4 h-4 text-primary" />
            Demo gateway enabled
          </div>
        </div>

        <div className="rounded-3xl gradient-hero p-8 text-primary-foreground shadow-elevated">
          <p className="text-sm uppercase tracking-[0.2em] text-primary-foreground/70">Subscriptions</p>
          <h1 className="mt-3 text-4xl font-heading font-bold">Upgrade with a safe demo payment flow</h1>
          <p className="mt-3 max-w-2xl text-primary-foreground/85">
            This page uses a demo gateway so you can test subscription activation and receipt generation
            end-to-end without a real processor.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`rounded-2xl border p-5 text-left transition-all ${
                selectedPlan.id === plan.id
                  ? 'border-primary bg-accent shadow-card'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-foreground">{plan.label}</p>
                <Sparkles className={`w-4 h-4 ${selectedPlan.id === plan.id ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <p className="mt-3 text-3xl font-heading font-bold text-foreground">INR {plan.price}</p>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-2xl font-heading font-bold text-foreground">Payment summary</h2>
            <div className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Selected plan</span>
                <span className="font-medium text-foreground">{selectedPlan.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Gateway</span>
                <span className="font-medium text-foreground">Demo Payment Gateway</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Receipt</span>
                <span className="font-medium text-foreground">Auto-generated</span>
              </div>
              <div className="border-t border-border pt-4 flex items-center justify-between">
                <span className="text-base font-medium text-foreground">Total</span>
                <span className="text-2xl font-heading font-bold text-foreground">INR {selectedPlan.price}</span>
              </div>
            </div>
            <Button onClick={handleDemoPayment} disabled={isPaying} className="mt-6 w-full gradient-warm text-primary-foreground">
              <CreditCard className="mr-2 w-4 h-4" />
              {isPaying ? 'Processing demo payment...' : 'Pay with Demo Gateway'}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center gap-2 text-foreground">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">What this does</h2>
              </div>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p>Stores a payment row in Supabase.</p>
                <p>Creates a receipt with a unique receipt number.</p>
                <p>Activates the selected subscription plan for the signed-in user.</p>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center gap-2 text-foreground">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Latest receipt</h2>
              </div>
              {latestReceipt ? (
                <>
                  <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-muted p-4 text-xs text-foreground">{latestReceipt.content}</pre>
                  <Button variant="outline" onClick={downloadReceipt} className="mt-4 w-full">
                    <Download className="mr-2 w-4 h-4" />
                    Download receipt
                  </Button>
                </>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Complete a demo payment to generate and download a receipt.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscribePage;
