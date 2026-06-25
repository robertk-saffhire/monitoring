# SaffHire Monitoring - Clean Supabase Rebuild

This is a clean rebuild of the Manus monitoring app flow. Google Sheets and Manus/tRPC auth were removed.

## Required Vercel ENV

- `DATABASE_URL`
- `JWT_SECRET`

## First setup

1. Run `supabase/schema.sql` in Supabase SQL Editor.
2. Deploy to Vercel.
3. Open `/login`.
4. Create the first admin username and password.

## Current Phase 1 Features

- Clean username/password login
- First admin setup
- Company selector
- Dashboard cards
- Monitoring table from Supabase
- Update monitor status, med expiration, and notes
- Audit log on applicant updates
- Safety Performance page shell
- Settings page shell

## No Google Sheets

This app does not read from or write to Google Sheets.
