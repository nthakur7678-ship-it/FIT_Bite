# FitBite Student Buddy

FitBite is a Vite + React + Supabase app for student meal planning. This version is prepared for Vercel deployment, uses Supabase authentication, includes a demo subscription payment flow, and generates receipts in Supabase.

## Local setup

1. Copy `.env.example` to `.env`.
2. Add your Supabase project URL and publishable key.
3. Create a demo auth user in Supabase Auth that matches `VITE_DEMO_EMAIL` and `VITE_DEMO_PASSWORD`.
4. Apply the SQL migrations in the `supabase/migrations` folder.
5. Run `npm install` and `npm run dev`.

## Vercel deployment

Set these environment variables in Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_DEMO_EMAIL`
- `VITE_DEMO_PASSWORD`

`vercel.json` includes an SPA rewrite so React Router works on direct page loads.

## Supabase features

- Email/password authentication
- Auto-created student profile and trial subscription
- Quiz answers stored in Supabase
- Meal-plan generation stored in Supabase
- Demo payment records and receipt generation

## Demo payment flow

The `/subscribe` page uses a demo gateway. It does not charge a real card. Instead it:

- saves a payment row
- creates a receipt row with a receipt number
- activates the selected subscription
- lets the user download a receipt file
