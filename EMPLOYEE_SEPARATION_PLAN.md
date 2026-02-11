# Employee Separation Plan

## Current State
- Employees are in the `User` table with `role="EMPLOYEE"`
- Employees log in to access the clock page
- Employees use NFC cards or manual codes to clock in/out

## Desired State
- `User` table: Only ADMIN and EMPLOYER (people who can log in to manage)
- `Employee` table: Separate table for employees (no login required)
- Clock functionality: Works without login, identifies employees by NFC card or employee code

## Implementation Steps

### Phase 1: Schema Changes
1. Create new `Employee` table (standalone, not linked to User)
2. Migrate employee data from User to Employee
3. Update relationships (NFCCard, AttendanceEvent, etc. to point to Employee)

### Phase 2: Code Changes
1. Update clock page to work without authentication
2. Update employee identification (by NFC card or employee code)
3. Update all queries that reference employees
4. Update admin/employer views to show employees from Employee table

### Phase 3: Data Migration
1. Move existing employee User records to Employee table
2. Update all foreign key relationships
3. Clean up User table (remove employee records)

## Questions to Consider
1. Should employees be able to view their own timesheets? (Would need some form of access)
2. Should employees have email addresses? (Currently they do in User table)
3. How should employee invitations work? (Currently creates User records)
