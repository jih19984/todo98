# Todo98 Deployment

Hosting: Vercel Hobby

Database/Auth: Supabase Free

## Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Supabase

Run `supabase/schema.sql` in the Supabase SQL editor before testing real task persistence.

Auth providers:

- Google enabled
- Kakao enabled
- Apple excluded

## Local URL

Use `http://127.0.0.1:3002` in this workspace because ports `3000` and `3001` were already occupied.

## Production Checks

- Landing page loads over HTTPS.
- Google login works.
- Kakao login works.
- Tasks persist per user.
- Custom domain resolves through Vercel.
