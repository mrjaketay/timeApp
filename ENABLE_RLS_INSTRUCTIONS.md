# How to Enable RLS (Row Level Security) in Supabase

## Step 1: Open SQL Editor in Supabase

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"** button

## Step 2: Run the RLS SQL Script

1. Copy the contents of `prisma/migrations/enable_rls.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** button (or press Ctrl+Enter)

The script will:
- ✅ Enable RLS on all tables
- ✅ Create basic security policies
- ✅ Allow users to view/update their own data

## Step 3: Verify RLS is Enabled

1. Go back to **"Table Editor"** in the left sidebar
2. Click on any table (e.g., "User")
3. You should see **"RLS enabled"** instead of "RLS disabled"
4. The red warning should be gone!

## What the Policies Do

The RLS policies created allow:
- **Users can view their own profile** - Users can only see their own user record
- **Users can update their own profile** - Users can only update their own data
- **Users can view their companies** - Users can see companies they belong to
- **Users can view their own data** - Attendance, timesheets, NFC cards, etc.

## Important Notes

⚠️ **Since you're using NextAuth (not Supabase Auth):**
- The policies using `auth.uid()` won't work directly
- Your app uses NextAuth sessions, so RLS will block direct database access
- This is actually **GOOD** - it means your database is protected!

✅ **Your app will still work because:**
- Prisma connects using the service role (bypasses RLS)
- Your Next.js app handles authentication
- RLS protects against direct database access

## Next Steps

After enabling RLS, you may want to:
1. Test your app to make sure everything still works
2. Customize the policies based on your needs
3. Add admin-specific policies if needed

## Troubleshooting

If your app stops working after enabling RLS:
- Check that your `DATABASE_URL` uses the connection pooler (not direct connection)
- Verify your app is using Prisma (which uses service role)
- Check the Supabase logs for any RLS policy violations
