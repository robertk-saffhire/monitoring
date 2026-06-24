# SaffHire Monitoring — REST Login Fix

This is a controlled file-replacement ZIP.

## What it changes

This removes the tRPC dependency from the login/setup screen and adds plain REST auth endpoints.

## Files to upload/replace

- `client/src/pages/Login.tsx`
- `client/src/contexts/LocalAuthContext.tsx`
- `client/src/main.tsx`
- `server/authApiHelpers.ts`
- `api/auth/setup-status.ts`
- `api/auth/setup-admin.ts`
- `api/auth/login.ts`
- `api/auth/me.ts`
- `api/auth/logout.ts`
- `api/[...path].ts`
- `api/trpc/[...trpc].ts`

## After upload

Redeploy Vercel. Then test:

1. `/api/auth/setup-status`
   - Expected JSON: `{ "status": "ok", "hasAdmin": false }` if no admin exists.
2. Login page `/login`
   - Should create the first admin without the old JSON error.

## Supabase changes needed

No new SQL is required if the foundation schema and import SQL were already run.

## Vercel environment changes needed

No new environment variables are required.

Existing required envs still apply:

- `DATABASE_URL`
- `JWT_SECRET` or the app's existing cookie secret env, depending on your current setup
