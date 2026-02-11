# Supabase Setup Guide - Step by Step

## ✅ Step 1: Get Your Supabase Connection String

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **Settings** (gear icon) in the left sidebar
4. Click **Database** under Project Settings
5. Scroll down to **Connection string**
6. Select the **URI** tab
7. Copy the connection string - it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

**Important:** Replace `[YOUR-PASSWORD]` with your actual database password (the one you set when creating the project).

If you forgot your password:
- In the same Database settings page, click **Reset database password**
- Copy the new password and update your connection string

---

## ✅ Step 2: Update Your .env File

1. Open your `.env` file in the project root
2. Find the `DATABASE_URL` line (or add it if it doesn't exist)
3. Replace it with your Supabase connection string:

```env
DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
```

**Make sure to:**
- Keep the quotes around the connection string
- Replace `YOUR_ACTUAL_PASSWORD` with your real password
- Don't include the `[YOUR-PASSWORD]` brackets - use the actual password

---

## ✅ Step 3: Generate Prisma Client

Run this command to generate the Prisma client for PostgreSQL:

```powershell
npm run db:generate
```

---

## ✅ Step 4: Push Schema to Supabase

This will create all your tables in Supabase:

```powershell
npm run db:push
```

You should see output like:
```
✔ Generated Prisma Client
✔ Pushed database schema to Supabase
```

---

## ✅ Step 5: Seed Your Database (Optional)

If you want to add sample data (admin account, test companies, etc.):

```powershell
npm run db:seed
```

**Note:** This will create:
- Admin account: `admin@timetrack.com` / `admin123`
- Sample employer: `employer@acme.com` / `employer123`
- Sample employee: `alice@acme.com` / `employee123`

---

## ✅ Step 6: Verify Connection

1. Restart your development server:
   ```powershell
   npm run dev
   ```

2. Try logging in or accessing the app
3. Check your Supabase dashboard → **Table Editor** to see your tables

---

## 🎉 Done!

Your app is now connected to Supabase! 

### What Changed:
- ✅ Database provider: SQLite → PostgreSQL
- ✅ Database location: Local file → Cloud (Supabase)
- ✅ Better performance and scalability
- ✅ Production-ready database

### Next Steps:
- Your existing data in SQLite won't automatically transfer
- If you need to migrate data, we can create a migration script
- All new data will be stored in Supabase

---

## 🔧 Troubleshooting

### Error: "Connection refused" or "Cannot connect"
- Check your connection string is correct
- Verify your Supabase project is active
- Make sure you replaced `[YOUR-PASSWORD]` with the actual password

### Error: "Schema validation failed"
- Make sure you ran `npm run db:generate` first
- Try deleting `node_modules/.prisma` and running `npm run db:generate` again

### Error: "Table already exists"
- This means the schema was partially pushed
- You can either:
  - Delete tables in Supabase dashboard and run `npm run db:push` again
  - Or use migrations: `npm run db:migrate`

---

## 📊 View Your Data

You can view and manage your data in Supabase:
1. Go to your Supabase project dashboard
2. Click **Table Editor** in the left sidebar
3. Browse your tables and data

---

## 🔐 Security Note

Never commit your `.env` file to git! It contains your database password.
Make sure `.env` is in your `.gitignore` file.
