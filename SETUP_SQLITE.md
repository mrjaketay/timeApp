# Quick Setup: SQLite (No Database Server Needed)

This is the fastest way to get started - no external database required!

## Steps:

1. **Update Prisma Schema**
   - Open `prisma/schema.prisma`
   - Change line 10 from:
     ```prisma
     provider = "postgresql"
     ```
   - To:
     ```prisma
     provider = "sqlite"
     ```

2. **Update .env file**
   - Open `.env`
   - Change `DATABASE_URL` to:
     ```env
     DATABASE_URL="file:./dev.db"
     ```

3. **Update Schema for SQLite compatibility**
   - SQLite doesn't support some PostgreSQL features
   - We need to remove `@db.Text` and `@db.Date` annotations

4. **Push Schema**
   ```powershell
   npm run db:push
   ```

5. **Seed Data**
   ```powershell
   npm run db:seed
   ```

6. **Restart Server**
   ```powershell
   npm run dev
   ```

That's it! The database file (`dev.db`) will be created automatically in your project root.
