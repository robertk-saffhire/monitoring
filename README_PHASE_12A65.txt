Phase 12A-65 - Supabase Keepalive Cron

Files:
- api/index.ts
- vercel.json

Vercel ENV required:
- CRON_SECRET

Use a long random value for CRON_SECRET.

The cron runs daily at 11:00 UTC, which is 6:00 AM Central during standard time and 5:00 AM Central during daylight time.

Manual test after deploy:
https://YOUR-DOMAIN/api/index?path=keepalive&secret=YOUR_CRON_SECRET

Expected response:
{"status":"ok","keepalive":true,"db":true,...}
