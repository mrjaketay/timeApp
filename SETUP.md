# Quick Setup Guide

## Step 1: Create Environment File

Create a `.env` file in the root directory with the following content:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/timetrack?schema=public"

# NextAuth - REQUIRED
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Mapbox (optional, for enhanced maps)
NEXT_PUBLIC_MAPBOX_TOKEN="your-mapbox-token-here"
```

### Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
# On Windows PowerShell:
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString() + (New-Guid).ToString()))

# On Mac/Linux:
openssl rand -base64 32
```

Or use any random string generator - the secret just needs to be a random string.

### Setup PostgreSQL Database

1. Install PostgreSQL if you haven't already
2. Create a database:
   ```sql
   CREATE DATABASE timetrack;
   ```
3. Update the `DATABASE_URL` in your `.env` file with your PostgreSQL credentials

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Setup Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed
```

## Step 4: Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Test Accounts

After seeding, you can login with:

- **Admin**: `admin@timetrack.com` / `admin123`
- **Employer**: `employer@acme.com` / `employer123`
- **Employee**: `alice@acme.com` / `employee123`

## Troubleshooting

### NextAuth Secret Error
If you see `[next-auth][error][NO_SECRET]`, make sure:
1. You have a `.env` file in the root directory
2. `NEXTAUTH_SECRET` is set in the `.env` file
3. Restart the dev server after creating/updating `.env`

### Database Connection Error
If you see database errors:
1. Verify PostgreSQL is running
2. Check your `DATABASE_URL` in `.env` is correct
3. Ensure the database exists
4. Verify your database user has proper permissions
