# TimeTrack - NFC Time Tracking Application

A modern, full-stack time tracking web application with NFC card-based clock in/out, mandatory location tracking, and comprehensive attendance management.

## Features

- **NFC Card-Based Clocking**: Employees can clock in/out using NFC cards (Web NFC API) or manual code entry
- **Mandatory Location Tracking**: Every clock event requires GPS coordinates with reverse geocoded addresses
- **Role-Based Access Control**: Three user roles (Admin, Employer, Employee) with appropriate permissions
- **Real-Time Dashboard**: KPI cards showing employees count, today's check-ins, late arrivals, and hours worked
- **Attendance Management**: View attendance logs with location details and map visualization
- **Reports & Exports**: Generate attendance reports with CSV/Excel export including location data
- **NFC Card Management**: Register and manage NFC cards for employees
- **Map Integration**: View employee locations on interactive maps (Mapbox or OpenStreetMap)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js with email/password
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form with Zod validation
- **Maps**: Mapbox (or OpenStreetMap fallback)
- **NFC**: Web NFC API (Android Chrome)
- **Charts**: Recharts
- **Tables**: TanStack Table

## Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- (Optional) Mapbox API token for enhanced map features

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TimeApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/timetrack?schema=public"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"

   # Mapbox (optional, for enhanced maps)
   NEXT_PUBLIC_MAPBOX_TOKEN="your-mapbox-token-here"
   ```

   Generate a NextAuth secret:
   ```bash
   openssl rand -base64 32
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   npm run db:generate

   # Push schema to database
   npm run db:push

   # Seed the database
   npm run db:seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Seeded Data

The seed script creates:

- **Admin User**: `admin@timetrack.com` / `admin123`
- **Employer User**: `employer@acme.com` / `employer123`
- **Employee Users**: 
  - `alice@acme.com` / `employee123`
  - `bob@acme.com` / `employee123`
  - `charlie@acme.com` / `employee123`
- **Company**: Acme Corporation
- **NFC Cards**: 3 registered NFC cards (UIDs: ABC123456789, XYZ987654321, DEF456789123)
- **Sample Attendance Events**: Clock in/out events across multiple days with location data

## Geolocation Requirements

### Browser Permissions
- Location services must be enabled in the browser
- Users must grant location permission when prompted
- For best accuracy, use a device with GPS (mobile devices)

### HTTPS Requirement
- Geolocation API requires HTTPS (or localhost for development)
- Web NFC API also requires HTTPS

## NFC Requirements

### Supported Devices
- **Web NFC API**: Android devices with Chrome 89+
- **Manual Fallback**: All devices can use clock codes entered manually

### Testing NFC
1. Use an Android device with Chrome
2. Navigate to the clock page (`/clock`)
3. Tap "Scan NFC Card" and hold an NFC card near the device
4. For devices without NFC, use the manual code entry field

### Registering NFC Cards
1. Log in as an Employer
2. Navigate to "NFC Cards" in the sidebar
3. Click "Register Card"
4. Scan the NFC card or enter the UID manually
5. Assign the card to an employee

## Project Structure

```
TimeApp/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Employer dashboard pages
│   ├── admin/             # Admin dashboard pages
│   ├── clock/             # Employee clock in/out page
│   └── (auth)/            # Authentication pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components (Sidebar, Topbar)
│   └── ...               # Feature components
├── lib/                  # Utility functions and configurations
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Utility functions
├── prisma/               # Prisma schema and migrations
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script
└── types/                # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:seed` - Seed the database
- `npm run db:studio` - Open Prisma Studio

## Key Features Implementation

### Mandatory Location Tracking
- Server-side validation ensures every clock event includes coordinates
- Client-side checks prevent clocking without location permission
- Reverse geocoding converts coordinates to human-readable addresses

### NFC Clock Flow
1. Employee scans NFC card or enters code
2. System validates NFC card and employee
3. Location is captured immediately after scan
4. Clock event is created with location data
5. Timesheet is updated automatically

### Role-Based Access
- **Admin**: System-wide access, view all companies and users
- **Employer**: Company management, employees, attendance, reports
- **Employee**: Clock in/out, view personal timesheets

## Database Schema

Key entities:
- **User**: Authentication and user data
- **Company**: Organization data
- **EmployeeProfile**: Employee-specific information
- **NFCCard**: NFC card bindings
- **AttendanceEvent**: Clock in/out events with location
- **Timesheet**: Daily summaries
- **Report**: Report generation jobs

## Deployment

### Environment Variables
Ensure all environment variables are set in your production environment.

### Database
1. Set up a PostgreSQL database (e.g., on Railway, Supabase, or AWS RDS)
2. Update `DATABASE_URL` in environment variables
3. Run migrations: `npm run db:push`

### Build
```bash
npm run build
npm run start
```

## Troubleshooting

### Location Not Working
- Ensure HTTPS is enabled (or using localhost)
- Check browser permissions for location access
- Verify device has GPS/location services enabled

### NFC Not Working
- Verify device supports Web NFC (Android Chrome 89+)
- Ensure HTTPS is enabled
- Check NFC is enabled in device settings
- Use manual code entry as fallback

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check network/firewall settings

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
