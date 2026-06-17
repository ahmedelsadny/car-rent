# CarAdmin Dashboard

A modern, responsive admin dashboard UI for a Car Rental Platform built with Next.js 16, React 19, Tailwind CSS, and Recharts.

## Overview

CarAdmin is a professional SaaS-style admin dashboard designed specifically for car rental platform administrators. It provides complete system control with a clean, modern interface inspired by platforms like Stripe and Uber.

### Key Features

✨ **Modern Design**
- Dark/light theme support with professional color scheme
- SaaS-inspired interface with smooth transitions
- Responsive layout optimized for desktop, tablet, and mobile
- Clean typography with semantic spacing

📊 **Comprehensive Dashboards**
- Real-time KPI cards with trend indicators
- Interactive charts (line, bar, pie)
- Data visualization with Recharts
- Custom charts for revenue, bookings, and performance metrics

🎯 **Admin Functionality**
- Full system oversight and management
- Role-based permissions
- Commission and finance management
- User and dealer management
- Comprehensive audit logs
- Notification system
- Advanced analytics

🔧 **Technical Excellence**
- Server Components with Next.js App Router
- Client-side interactivity with React hooks
- Optimized performance with Tailwind CSS
- Lucide icons for consistent iconography
- Type-safe with TypeScript

## Project Structure

```
admin-dashboard/
├── app/
│   ├── page.tsx              # Dashboard home page
│   ├── cars/page.tsx         # Cars management
│   ├── dealers/page.tsx      # Dealers management
│   ├── users/page.tsx        # Users management
│   ├── bookings/page.tsx     # Bookings monitoring
│   ├── finance/page.tsx      # Finance & revenue
│   ├── notifications/page.tsx # Notification center
│   ├── logs/page.tsx         # Audit logs
│   ├── analytics/page.tsx    # Analytics & insights
│   ├── settings/page.tsx     # System settings
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles & theme
├── components/
│   ├── sidebar.tsx           # Navigation sidebar
│   ├── header.tsx            # Top header
│   ├── dashboard-layout.tsx  # Layout wrapper
│   ├── kpi-card.tsx          # KPI card component
│   └── charts.tsx            # Chart components
├── lib/
│   └── utils.ts              # Utility functions
└── package.json
```

## Pages & Features

### Dashboard Home
- 8 KPI cards showing key metrics (users, cars, dealers, revenue, bookings, etc.)
- Revenue trends chart
- Booking status pie chart
- Top rented cars bar chart

### Cars Management
- Complete inventory table with dealer names (admin only)
- Car status (Available/Rented)
- Revenue tracking per car
- Occupancy rate visualization
- Quick actions (view, edit, delete)

### Dealers
- Dealer performance overview
- Active rentals tracking
- Revenue and profit metrics
- Status management (Active/Suspended)
- Ban/Unban functionality

### Users
- User list with verification status
- Booking history and spending
- User activity tracking
- Direct messaging capability

### Bookings
- Real-time booking monitoring
- Status filtering (All, Pending, Active, Completed, Cancelled, Rejected)
- Detailed booking information
- Date range visibility

### Finance
- Revenue metrics (today, weekly)
- Platform and dealer profit tracking
- Commission rules configuration (5% short-term, 3% long-term)
- Transaction history with status

### Notifications
- Send targeted notifications to users/dealers
- Notification history
- Recipient tracking
- Delete capability

### Audit Logs
- Timeline view of all system actions
- Entity type filtering (User, Admin, Dealer)
- Detailed action information
- Timestamp and performer tracking

### Analytics
- Weekly occupancy rate chart
- Monthly cancellation rate trends
- Top dealers by bookings
- Key performance metrics
- Customer retention rate
- Average booking value

### Settings
- Commission configuration (short/long-term)
- Booking duration limits
- Platform fee management
- Admin role permissions
- System configuration

## Theme & Colors

**Primary Color System:**
- Background: `#0f172a` (dark slate)
- Foreground: `#f1f5f9` (light slate)
- Primary: `#3b82f6` (blue)
- Secondary: `#1e293b` (dark slate secondary)
- Accent: `#06b6d4` (cyan)

**Status Colors:**
- Success: `#10b981` (green)
- Warning: `#f59e0b` (amber)
- Danger: `#ef4444` (red)
- Info: `#0ea5e9` (sky blue)

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Navigate to the admin dashboard directory
cd admin-dashboard

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The dashboard will be available at `http://localhost:3000`

## Usage

### Navigating the Dashboard
1. Use the sidebar for main navigation
2. Click on any nav item to switch sections
3. Use the search bar in the header to find content
4. Access settings via the gear icon in the top right

### Key Interactions
- **KPI Cards**: Click to drill down into details
- **Tables**: Use action buttons for view/edit/delete operations
- **Charts**: Hover for detailed data points
- **Status Filters**: Click filter buttons to narrow data
- **Forms**: Fill inputs and click save/send buttons

## Responsive Design

The dashboard is fully responsive:
- **Desktop** (1920px+): Full sidebar, expanded tables
- **Tablet** (768px-1919px): Collapsible sidebar, responsive grids
- **Mobile** (< 768px): Mobile sidebar toggle, stacked layouts

## Component Architecture

### Layout Components
- `DashboardLayout`: Main wrapper providing sidebar + header + content area
- `Sidebar`: Collapsible navigation with badges
- `Header`: Top bar with search, notifications, and user menu

### Data Components
- `KPICard`: Metric cards with trend indicators
- `RevenueChart`: Line chart for financial data
- `BookingStatusChart`: Pie chart for status distribution
- `TopCarsChart`: Bar chart for performance metrics

### Styling
All components use Tailwind CSS with semantic design tokens defined in `globals.css`. Custom colors are applied via CSS variables that can be easily modified.

## Integration with Backend

The dashboard is currently populated with mock data. To integrate with the NestJS backend:

1. Install data fetching library (SWR recommended):
   ```bash
   npm install swr
   ```

2. Replace mock data with API calls to your NestJS endpoints
3. Update component state management as needed
4. Add authentication integration with the backend auth system

Example:
```typescript
import useSWR from 'swr'

export default function CarsPage() {
  const { data: cars } = useSWR('/api/cars', fetcher)
  // Use `cars` instead of mock data
}
```

## Performance Optimization

- Server Components for fast initial load
- Client hydration only where needed
- Lazy loading for heavy components
- Optimized chart rendering with Recharts
- CSS-in-JS with Tailwind for minimal bundle size

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

- Real-time data updates with WebSockets
- Advanced filtering and search
- Custom report generation
- Multi-language support
- Dark/light mode toggle
- Data export (CSV, PDF)
- Advanced user permissions system
- Mobile app companion

## Contributing

This dashboard is part of the car rental platform. Follow the main project's contribution guidelines.

## License

Same as the main car rental platform project.

---

**Built with** ❤️ using Next.js, React, Tailwind CSS, and Recharts
