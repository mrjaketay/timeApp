# Where to Find Your Seeded Data in Supabase

## ✅ Accounts Created (Check the `User` table)

The seed script created these accounts in the **`User`** table:

1. **Admin Account:**
   - Email: `admin@timetrack.com`
   - Password: `admin123`
   - Role: `ADMIN`

2. **Employer Account:**
   - Email: `employer@acme.com`
   - Password: `employer123`
   - Role: `EMPLOYER`

3. **Employee Accounts:**
   - `alice@acme.com` / `employee123`
   - `bob@acme.com` / `employee123`
   - `charlie@acme.com` / `employee123`

## 📊 Tables with Data

### User Table
- Contains all user accounts (admin, employer, employees)
- **Click on "User" in the table list to see your accounts**

### Company Table
- Contains: "Acme Corporation"
- Slug: "acme-corp"

### CompanyMembership Table
- Links users to companies
- Shows employer and employee memberships

### EmployeeProfile Table
- Contains profiles for Alice, Bob, and Charlie
- Employee IDs: EMP001, EMP002, EMP003

### NFCCard Table
- Contains 3 NFC cards assigned to employees

### AttendanceEvent Table
- Contains sample clock-in/clock-out events for the past few days

### Timesheet Table
- Contains sample timesheets for employees

## 🔴 About the Red Indicators

### "RLS disabled" (Row Level Security)
- **What it means:** Your tables don't have row-level security policies enabled
- **Is it a problem?** Not for development, but you should enable it for production
- **How to enable:** Click the "RLS disabled" button and set up policies

### "UNRESTRICTED" Badges
- **What it means:** Tables are accessible without restrictions
- **Is it a problem?** Normal for development databases
- **For production:** You'll want to set up proper access policies

## 🎯 How to View Your Accounts

1. In the Supabase Table Editor, look at the left sidebar
2. Find and click on the **"User"** table (not Payment)
3. You should see 5 users:
   - Admin User (admin@timetrack.com)
   - John Employer (employer@acme.com)
   - Alice Johnson (alice@acme.com)
   - Bob Smith (bob@acme.com)
   - Charlie Brown (charlie@acme.com)

## 🔐 Testing Your Accounts

You can now log into your app at `http://localhost:3000/login` with:
- Admin: `admin@timetrack.com` / `admin123`
- Employer: `employer@acme.com` / `employer123`
- Employee: `alice@acme.com` / `employee123`
