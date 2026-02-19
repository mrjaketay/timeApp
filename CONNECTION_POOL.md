# Fix: "max clients reached" / MaxClientsInSessionMode

This error means your app is using the **direct** database connection, which has a low connection limit. In serverless (Vercel, Netlify), each request can open a new connection and you hit the limit quickly.

## Fix (Supabase)

1. **Use the connection pooler (Transaction mode), not the direct URL.**

   In [Supabase](https://supabase.com/dashboard) → your project → **Settings** → **Database**:
   - Under **Connection string**, choose **"URI"**.
   - Select **"Transaction"** mode (not Session).
   - Copy the URI. It should use port **6543** and look like:
     ```txt
     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```

2. **Add `?pgbouncer=true`** (required for Prisma with the pooler):

   ```txt
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

3. **Set this as `DATABASE_URL`** in your host (Vercel / Netlify environment variables). Replace `[PASSWORD]` with your database password.

4. **Redeploy** so the new URL is used.

The app also adds `connection_limit=1` in production so each serverless instance uses a single connection. Together with the pooled URL, this should resolve "max clients reached".

## Other providers

- Use the **pooled** or **transaction-mode** connection string your provider gives for serverless.
- Keep **connection_limit=1** (the app adds it in production for PostgreSQL).
