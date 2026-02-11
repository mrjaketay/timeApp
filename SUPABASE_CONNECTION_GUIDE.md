# Finding Database Connection String in Updated Supabase Interface

## Method 1: Project Settings → Database

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **Settings** (gear icon) in the left sidebar
4. Click **Database** under Project Settings
5. Look for **Connection string** or **Connection info** section
6. You should see options like:
   - **URI** (this is what we need)
   - **JDBC**
   - **Connection pooling**

## Method 2: Connect Button

1. In your project dashboard, look for a **"Connect"** button (usually at the top)
2. Click it to open a modal/dialog
3. Select **"Database"** tab
4. Look for connection string options

## Method 3: API Settings

1. Go to **Settings** → **API**
2. Look for database connection information
3. Sometimes it's shown alongside API keys

## Method 4: Direct Database URL

If you can't find the connection string, we can construct it manually. I need:
- Your project reference (looks like: `cocqvtunshxcvkucguzx`)
- Your database password (you already provided: `.Vm#d.qc6ER!?_H`)

The format should be:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

## What to Look For

In the updated interface, you might see:
- **Connection string** (with a copy button)
- **Database URL**
- **PostgreSQL connection string**
- **Connection info** (expandable section)

If you see any of these, click to expand or copy the **URI** format.
