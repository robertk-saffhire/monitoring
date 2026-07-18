# Phase 12A-119 — FMCSA Applicant Signature PDF Fix

Upload only:

- `api/index.ts`

## What changed

- The applicant electronic signature now prints on the FMCSA PDF in a cursive-style font.
- The applicant signing timestamp now prints beside the signature as an electronic signature stamp.
- The applicant Date field is filled only with the actual applicant signature date.
- The PDF no longer draws the applicant date twice, which was causing the date to look like it was written over another date.

## SQL / ENV

- SQL migration: No
- Vercel ENV changes: No

## Checks

- `npm run build` passed.
- `npx tsc --noEmit` passed.
