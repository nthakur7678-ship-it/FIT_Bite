import { ReactNode } from 'react';
import { AlertTriangle, Database, ExternalLink } from 'lucide-react';
import { hasSupabaseEnv } from '@/integrations/supabase/client';

interface SupabaseConfigGuardProps {
  children: ReactNode;
}

const SupabaseConfigGuard = ({ children }: SupabaseConfigGuardProps) => {
  if (hasSupabaseEnv) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-2xl mx-auto rounded-3xl border border-border bg-card p-8 shadow-card">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary mb-5">
          <Database className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Supabase setup required</h1>
        <p className="mt-3 text-muted-foreground">
          This app is Vercel-ready, but it needs Supabase environment variables before authentication and
          backend features can work.
        </p>
        <div className="mt-6 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in Vercel or a local
              <code> .env</code> file, then redeploy.
            </p>
          </div>
        </div>
        <div className="mt-6 space-y-2 text-sm text-foreground">
          <p><code>VITE_SUPABASE_URL=...</code></p>
          <p><code>VITE_SUPABASE_PUBLISHABLE_KEY=...</code></p>
          <p><code>VITE_DEMO_EMAIL=demo@fitbite.app</code></p>
          <p><code>VITE_DEMO_PASSWORD=Demo12345!</code></p>
        </div>
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 text-primary hover:text-primary/80"
        >
          Open Supabase dashboard
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default SupabaseConfigGuard;
