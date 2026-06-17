# CarAdmin Dashboard - Quick Start Guide

## Accessing the Dashboard

### URL
```
http://localhost:3000
```

### Demo Login Credentials
```
Email:    admin@admin.com
Password: admincarrentadmin123456789
```

---

## Navigation Guide

### Sidebar Menu (Left Side)

The sidebar contains all navigation options:

```
🏠 Dashboard          → Main dashboard with KPIs and charts
🚗 Cars               → Manage vehicle inventory
🏢 Dealers            → Manage dealer accounts
👥 Users              → Manage platform users
📅 Bookings           → Monitor all bookings
💰 Finance            → Revenue and commission management
🔔 Notifications      → Send and manage notifications
📋 Logs               → View audit logs and system activity
📊 Analytics          → View analytics and insights
⚙️  Settings          → Configure system settings
```

### Top Header (Right Side)

```
🔍 Search             → Search functionality
🔔 Notifications      → Notification bell icon
⚙️  Settings          → Settings gear icon
👤 User Profile       → Click to view options
  └─ Sign Out         → Logout option
```

---

## Dashboard Pages

### 1. Dashboard (Home)
**Path:** `/`

**Features:**
- 8 KPI cards showing key metrics
- Revenue trend chart
- Booking status pie chart
- Top cars performance chart
- All data is mock and ready to connect to backend

**Key Metrics Displayed:**
- Total Users: 2,543
- Total Cars: 1,203
- Total Dealers: 87
- Available Cars: 645
- Rented Cars: 558
- Total Revenue: $524,890
- Platform Profit: $52,489
- Active Bookings: 234

---

### 2. Cars Management
**Path:** `/cars`

**Features:**
- Table showing all cars
- Columns: Car Name, Dealer, Status, Revenue, Occupancy Rate
- Filter by status (Available/Rented)
- Search functionality
- Action buttons (View, Edit, Delete)
- Add new car button

---

### 3. Dealers Management
**Path:** `/dealers`

**Features:**
- Dealer list with performance metrics
- Columns: Dealer Name, Active Rentals, Revenue, Profit, Status
- Filter by status (Active/Suspended)
- Commission tracking
- Ban/Unban functionality

---

### 4. Users Management
**Path:** `/users`

**Features:**
- User list with account details
- Columns: Name, Email, Verified, Bookings, Spending, Last Active
- Filter by verification status
- Search by email or name
- User actions (View Profile, Message, Ban)

---

### 5. Bookings Monitoring
**Path:** `/bookings`

**Features:**
- Real-time booking list
- Status filter buttons:
  - All
  - Pending
  - Active
  - Completed
  - Cancelled
  - Rejected
- Columns: Booking ID, Customer, Car, Check-in, Check-out, Status, Price
- Search by booking ID
- Sort by date or price

---

### 6. Finance Dashboard
**Path:** `/finance`

**Features:**
- Revenue metrics cards
- Commission calculator
- Transaction history
- Profit breakdown
- Daily revenue tracker
- Fee configuration

**Commission Rules:**
- Short-term rental: 5%
- Long-term rental: 3%

---

### 7. Analytics
**Path:** `/analytics`

**Features:**
- Weekly occupancy rate chart
- Monthly cancellation rate trends
- Top 5 dealers by bookings
- Key performance indicators
- Customer retention rate
- Average booking value

---

### 8. Notifications
**Path:** `/notifications`

**Features:**
- Send notifications to users/dealers
- Notification type selector
- Message template selection
- Recipient selection
- Notification history table
- View past notifications

---

### 9. Audit Logs
**Path:** `/logs`

**Features:**
- Timeline of all system actions
- Filter by entity type:
  - User actions
  - Admin actions
  - Dealer actions
- Detailed action information
- Performer tracking
- Timestamps

---

### 10. Settings
**Path:** `/settings`

**Features:**
- Commission rate configuration
- Booking duration settings
- Platform fee management
- Admin role permissions
- System configuration
- API integration settings

---

## Authentication Flow

### 1. First Visit
```
User visits http://localhost:3000
    ↓
Check: Is user authenticated?
    ↓
NO → Redirect to /sign-in
    ↓
Sign-in page loads
```

### 2. Sign In Process
```
1. Enter Email: admin@admin.com
2. Enter Password: admincarrentadmin123456789
3. Click "Sign in" button
4. Better Auth validates credentials
5. Session created in database
6. Redirect to dashboard (/)
7. Session cookie set in browser
```

### 3. Dashboard Access
```
User visits http://localhost:3000
    ↓
Check: Is user authenticated?
    ↓
YES (session cookie found) → Load dashboard
    ↓
Dashboard displays all pages and data
```

### 4. Sign Out
```
Click user profile in top-right
    ↓
Select "Sign Out"
    ↓
Session cleared from database
    ↓
Session cookie deleted
    ↓
Redirect to /sign-in
```

---

## Theme & Styling

### Color Scheme

```
Primary:     #3b82f6 (Blue)           → Buttons, active states
Secondary:   #1e293b (Dark Slate)     → Backgrounds
Accent:      #06b6d4 (Cyan)           → Highlights
Background:  #0f172a (Very Dark)      → Main background
Foreground:  #f1f5f9 (Light Slate)    → Text color
Muted:       #64748b (Gray)           → Muted text
```

### Status Colors

```
Success:     #10b981 (Green)          → Active, completed
Warning:     #f59e0b (Amber)          → Pending
Danger:      #ef4444 (Red)            → Cancelled, error
Info:        #0ea5e9 (Sky Blue)       → Information
```

---

## Common Tasks

### How to...

#### 1. Change a KPI card value
- Edit the component in `components/kpi-card.tsx`
- Update the `value` prop
- The dashboard will hot-reload

#### 2. Add a new page
- Create folder in `app/[page-name]/`
- Create `page.tsx` file
- Add page component with `DashboardLayout` wrapper
- Add navigation item in `components/sidebar.tsx`

#### 3. Connect to backend API
- See "Integration with NestJS Backend" in IMPLEMENTATION_SUMMARY.md
- Install SWR: `npm install swr`
- Replace mock data with API calls
- Update API_URL environment variable

#### 4. Deploy to production
- Push code to GitHub
- Connect to Vercel
- Set environment variables
- Deploy with `vercel deploy`

#### 5. Customize colors
- Edit `app/globals.css` CSS variables
- Update color hex values
- All components automatically update

---

## Keyboard Shortcuts

```
Tab                 → Navigate through form fields
Enter               → Submit form or confirm action
Escape              → Close modal or dropdown
Ctrl+K (or Cmd+K)   → Open search (if implemented)
```

---

## Responsive Behavior

### Desktop (1920px+)
- Full sidebar always visible
- Expanded tables with all columns
- All charts displayed in grid

### Tablet (768-1919px)
- Collapsible sidebar
- Click menu icon to toggle
- Responsive grid layouts
- Adjusted spacing

### Mobile (<768px)
- Sidebar hidden by default
- Hamburger menu in top-left
- Single column layouts
- Touch-friendly buttons
- Scrollable tables

---

## Mobile Access

On mobile devices:
1. Click hamburger menu icon (☰) in top-left
2. Sidebar slides in from left
3. Click menu item to navigate
4. Click outside or hamburger to close sidebar
5. All functionality works the same as desktop

---

## Features Ready to Connect

These features are currently using mock data and ready to be connected to your backend:

```
✓ All data tables
✓ All charts and graphs
✓ KPI cards
✓ Filter and search
✓ Notifications
✓ Audit logs
✓ Analytics
✓ Finance metrics
```

Just replace mock data with API calls using SWR!

---

## Tips & Tricks

1. **Live Reload**: Changes to code automatically hot-reload
2. **Console**: Open browser console (F12) to see debug info
3. **Network Tab**: Monitor API calls when connected to backend
4. **Dark Mode**: Built-in dark theme (no toggle needed)
5. **Copy Credentials**: Demo credentials displayed on login page

---

## Support

For detailed information:
- Setup Guide: `admin-dashboard/SETUP.md`
- Full Documentation: `admin-dashboard/README.md`
- Implementation Summary: `IMPLEMENTATION_SUMMARY.md`

---

**Ready to use!** 🚀
Start the dev server with `npm run dev` and visit http://localhost:3000
