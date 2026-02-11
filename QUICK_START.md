# Quick Start Guide - Fix Internal Server Error

## Step 1: Create .env File

Create a file named `.env` in the root directory (same folder as `package.json`).

**PowerShell command to create it:**
```powershell
New-Item -Path .env -ItemType File
```

Then open `.env` and add this content:

```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="PASTE_YOUR_SECRET_HERE"
DATABASE_URL="postgresql://user:password@localhost:5432/timetrack?schema=public"
```

## Step 2: Generate NEXTAUTH_SECRET

**In PowerShell, run:**
```powershell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString() + (New-Guid).ToString()))
```

**Copy the output** and paste it as the value for `NEXTAUTH_SECRET` in your `.env` file (replace `PASTE_YOUR_SECRET_HERE`).

## Step 3: Update DATABASE_URL

Replace `user`, `password`, and `localhost:5432` in `DATABASE_URL` with your actual PostgreSQL credentials.

**Example:**
```env
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/timetrack?schema=public"
```

## Step 4: Generate Prisma Client

```powershell
npm run db:generate
```

If you get a permission error (OneDrive issue), try:
```powershell
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
npm run db:generate
```

## Step 5: Restart Dev Server

1. Stop the server (Ctrl+C if running)
2. Start it again:
   ```powershell
   npm run dev
   ```

## Step 6: Check Status

Visit these URLs to verify:

1. **Health Check**: http://localhost:3000/health-check
   - Should show green checkmarks if everything is configured

2. **Test API**: http://localhost:3000/api/test
   - Should return JSON with status "ok"

3. **Home Page**: http://localhost:3000
   - Should redirect to login or health-check

## Troubleshooting

**If you still see errors:**
- Check the terminal output for specific error messages
- Make sure `.env` is in the root directory
- Make sure you restarted the server after creating `.env`
- Verify PostgreSQL is running
- Check that `DATABASE_URL` is correct

**If Prisma generation fails:**
- Try moving the project outside OneDrive folder
- Or pause OneDrive sync temporarily
