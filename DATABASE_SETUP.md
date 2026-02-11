# Database Setup Guide

## Option 1: Supabase (Free PostgreSQL - Recommended) ⭐

Supabase provides a free PostgreSQL database that's perfect for this app.

### Steps:

1. **Create Supabase Account**
   - Go to https://supabase.com
   - Sign up for free
   - Create a new project

2. **Get Database URL**
   - In your Supabase project, go to Settings → Database
   - Find "Connection string" → "URI"
   - Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)

3. **Update .env file**
   - Open your `.env` file
   - Replace `DATABASE_URL` with the Supabase connection string:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
   ```
   - Replace `[YOUR-PASSWORD]` with your actual Supabase database password

4. **Push Schema**
   ```powershell
   npm run db:push
   ```

5. **Seed Data**
   ```powershell
   npm run db:seed
   ```

Done! Your app is now connected to Supabase.

---

## Option 2: SQLite (Local Development - Easiest)

SQLite requires no server setup - perfect for local development.

### Steps:

1. **Update Prisma Schema**
   - Change `provider = "postgresql"` to `provider = "sqlite"` in `prisma/schema.prisma`

2. **Update .env**
   ```env
   DATABASE_URL="file:./dev.db"
   ```

3. **Push Schema**
   ```powershell
   npm run db:push
   ```

4. **Seed Data**
   ```powershell
   npm run db:seed
   ```

Note: SQLite has some limitations but works great for development.

---

## Option 3: Other Free PostgreSQL Services

- **Neon** (https://neon.tech) - Serverless PostgreSQL
- **Railway** (https://railway.app) - Easy deployment
- **Render** (https://render.com) - Free PostgreSQL tier

All work the same way - just get the connection string and update `.env`.

---

## Option 4: Firebase (Not Recommended)

Firebase uses Firestore (NoSQL), which is incompatible with Prisma's SQL-based approach. Switching would require:
- Rewriting all database queries
- Changing the entire data model
- Replacing Prisma with Firebase SDK
- Significant code refactoring

**Recommendation:** Use Supabase (Option 1) - it's free, easy, and works perfectly with this app.
