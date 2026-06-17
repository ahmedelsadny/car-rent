# CarAdmin - Complete Setup & Installation Guide

## Project Structure

This is a full-stack car rental admin dashboard built with:
- **Frontend**: Next.js 16 + React 19 (Admin Dashboard UI)
- **Backend**: NestJS (REST API)
- **Database**: Neon PostgreSQL with Better Auth for authentication
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **ORM**: Drizzle ORM

---

## Installation & Setup

### 1. Prerequisites

- Node.js 18+
- PostgreSQL database (via Neon)
- Environment variables configured

### 2. Directory Structure

```
/vercel/share/v0-project/
├── admin-dashboard/          # Next.js Admin Dashboard
│   ├── app/
│   │   ├── api/auth/        # Better Auth endpoints
│   │   ├── sign-in/         # Authentication page
│   │   ├── page.tsx         # Protected dashboard
│   │   ├── cars/            # Cars management
│   │   ├── dealers/         # Dealers management
│   │   ├── users/           # Users management
│   │   ├── bookings/        # Bookings monitoring
│   │   ├── finance/         # Finance dashboard
│   │   ├── analytics/       # Analytics page
│   │   ├── notifications/   # Notifications center
│   │   ├── logs/            # Audit logs
│   │   └── settings/        # System settings
│   ├── components/
│   │   ├── sidebar.tsx      # Navigation sidebar
│   │   ├── header.tsx       # Top header with logout
│   │   ├── auth-form.tsx    # Login/signup form
│   │   ├── kpi-card.tsx     # KPI card component
│   │   ├── charts.tsx       # Chart components
│   │   └── dashboard-layout.tsx
│   ├── lib/
│   │   ├── auth.ts          # Better Auth config
│   │   ├── auth-client.ts   # Client-side auth
│   │   └── db/              # Database setup
│   │       ├── index.ts     # Drizzle client
│   │       └── schema.ts    # Database schema
│   └── scripts/
│       └── seed.ts          # Database seeding
└── [backend NestJS code]
```

### 3. Installation Steps

#### Step 1: Navigate to Admin Dashboard

```bash
cd /vercel/share/v0-project/admin-dashboard
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Environment Variables

Make sure these environment variables are set in your `.env.local`:

```env
# Database
DATABASE_URL=your_neon_connection_string

# Better Auth
BETTER_AUTH_SECRET=your_secret_key_here (must be 32+ chars)
```

**Generate BETTER_AUTH_SECRET:**

```bash
openssl rand -base64 32
```

#### Step 4: Database Schema

Tables are already created in Neon:
- `user` - Admin users
- `session` - User sessions  
- `account` - OAuth accounts
- `verification` - Email verification

#### Step 5: Seed Admin User

The admin user is created automatically on first sign-up attempt with the credentials:

```
Email: admin@admin.com
Password: admincarrentadmin123456789
```

To manually create the admin user:

```bash
curl http://localhost:3000/api/seed
```

---

## Running the Application

### Development Mode

```bash
npm run dev
```

The dashboard will be available at: **http://localhost:3000**

### Production Build

```bash
npm run build
npm run start
```

---

## Authentication Flow

### Sign In

1. Visit `/sign-in`
2. Enter credentials:
   - **Email**: admin@admin.com
   - **Password**: admincarrentadmin123456789
3. Click "Sign In"
4. You're redirected to `/` (protected dashboard)

### Session Management

- Sessions stored in database via Better Auth
- Cookies automatically managed
- Auto-logout on expiration
- Logout button in top-right corner

---

## Dashboard Features

### Pages & Functionality

#### Dashboard (/)
- KPI cards with trend indicators
- Revenue trends chart
- Booking status overview
- Top cars performance chart

#### Cars (/cars)
- Complete inventory management
- Status tracking (Available/Rented)
- Revenue analytics per car
- Bulk actions (View, Edit, Delete)

#### Dealers (/dealers)
- Dealer performance metrics
- Active rentals tracking
- Revenue and profit metrics
- Status management (Active/Suspended)

#### Users (/users)
- User list with verification status
- Booking history view
- Spending analytics
- Direct messaging capability

#### Bookings (/bookings)
- Real-time booking monitoring
- Status filtering (All, Pending, Active, Completed, Cancelled, Rejected)
- Date range selection
- Detailed booking information

#### Finance (/finance)
- Revenue metrics (today, weekly)
- Platform profit tracking
- Commission configuration
- Transaction history

#### Notifications (/notifications)
- Send targeted notifications to users/dealers
- Notification history tracking
- Recipient management

#### Audit Logs (/logs)
- Timeline view of system actions
- Entity type filtering
- Detailed action information

#### Analytics (/analytics)
- Weekly occupancy rates
- Monthly cancellation trends
- Top dealers by bookings
- Customer retention metrics

#### Settings (/settings)
- Commission rules configuration
- Booking duration limits
- Platform fee management
- Admin role permissions

---

## API Integration

### Backend Connection

The dashboard uses mock data currently. To connect to your NestJS backend:

1. Install SWR for data fetching:
   ```bash
   npm install swr
   ```

2. Update components to fetch from API:
   ```typescript
   import useSWR from 'swr'

   export default function Cars() {
     const { data: cars } = useSWR('/api/cars', fetcher)
     // Use cars instead of mock data
   }
   ```

3. Update API base URL in `lib/api.ts` (create if needed):
   ```typescript
   export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
   ```

### Example Endpoints to Connect

- `GET /api/cars` - Get all cars
- `GET /api/dealers` - Get all dealers
- `GET /api/users` - Get all users
- `GET /api/bookings` - Get all bookings
- `GET /api/analytics/revenue` - Get revenue data
- `POST /api/notifications/send` - Send notification

---

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

```bash
vercel deploy
```

### Environment Variables for Production

Make sure to set in Vercel:
- `DATABASE_URL` - Neon connection string
- `BETTER_AUTH_SECRET` - Auth secret (32+ chars)
- `NEXT_PUBLIC_API_URL` - Your API URL (optional)

---

## Troubleshooting

### Issue: Cannot connect to database

**Solution**: Verify `DATABASE_URL` is correct in environment variables

### Issue: Auth not working / Always redirects to sign-in

**Solution**: Check if `BETTER_AUTH_SECRET` is set (must be 32+ characters)

### Issue: Charts not displaying

**Solution**: Ensure Recharts is installed:
```bash
npm install recharts
```

### Issue: Tailwind styles not applying

**Solution**: Clear cache and rebuild:
```bash
rm -rf .next
npm run build
```

### Issue: Cannot find module errors

**Solution**: Make sure all dependencies are installed:
```bash
npm install
```

---

## Performance Optimization

- Server Components for faster initial load
- Client hydration only where needed
- Lazy loading for heavy components
- CSS-in-JS with Tailwind for minimal bundle
- Chart rendering optimization with Recharts

---

## Security Best Practices

- All dashboard pages require authentication
- Session-based authentication via Better Auth
- Password hashing handled by Better Auth
- No secrets exposed in client code
- CSRF protection via Better Auth

---

## Tech Stack Details

### Frontend Stack
- **Next.js 16** - React framework with App Router
- **React 19.2** - UI library
- **Tailwind CSS 4** - Utility-first CSS framework
- **Recharts 3.8** - Chart visualization library
- **Lucide React** - Icon library
- **TypeScript** - Type safety

### Backend Integration
- **Neon PostgreSQL** - Database
- **Drizzle ORM** - Type-safe ORM
- **Better Auth** - Authentication library
- **pg** - PostgreSQL client

---

## File Structure Explained

```
app/                     # Next.js App Router pages
├── page.tsx            # Protected dashboard home
├── sign-in/page.tsx    # Login page
├── api/
│   ├── auth/[...all]/  # Better Auth endpoints
│   └── seed/route.ts   # Seed database endpoint
└── [page]/page.tsx     # Other dashboard pages

components/             # React components
├── sidebar.tsx         # Navigation (client)
├── header.tsx          # Top bar with logout
├── auth-form.tsx       # Login form
├── kpi-card.tsx        # KPI card display
└── charts.tsx          # Chart components

lib/                    # Utilities and config
├── auth.ts            # Better Auth server config
├── auth-client.ts     # Better Auth client
├── utils.ts           # Helper functions
└── db/
    ├── index.ts       # Drizzle database instance
    └── schema.ts      # Database schema

public/                # Static assets
scripts/               # Build/seed scripts
```

---

## Next Steps

1. ✅ Installation complete
2. ✅ Database set up
3. ✅ Authentication working
4. Next: Connect to NestJS backend
5. Next: Configure real data fetching
6. Next: Customize styling/branding
7. Next: Add real-time updates with WebSockets

---

## Support & Documentation

For more information:
- Next.js Docs: https://nextjs.org/docs
- Drizzle ORM: https://orm.drizzle.team
- Better Auth: https://www.better-auth.com
- Tailwind CSS: https://tailwindcss.com

---

**Dashboard is now ready for full-stack integration!**
