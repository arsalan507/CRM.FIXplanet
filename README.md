# Fixplanet CRM

iPhone & Apple Device Repair Management System built with Next.js 14, Supabase, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Deployment**: Vercel

## Features

### Phase 1 (Current)
- User authentication with role-based access control
- Dashboard with animated charts
- Leads management with filtering and search
- Webhook API for lead ingestion from landing pages
- Mobile-responsive design
- Black & white minimalist UI

### Roles
- **Super Admin**: Full access to all features
- **Manager**: Access to all features except admin settings
- **Telecaller**: Access to Dashboard and Leads
- **Pickup Agent**: Access to Dashboard, Leads, and Customers

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account
- Vercel account (for deployment)

### 1. Clone and Install

```bash
git clone <repository-url>
cd fixplanet-crm
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema from `supabase/schema.sql`
3. Enable email authentication in **Authentication > Providers**
4. Copy your project credentials from **Settings > API**

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Create First Admin User

1. Go to Supabase **Authentication > Users**
2. Click **Add User** and create a user with email/password
3. Copy the user's UUID
4. Run this SQL in Supabase SQL Editor:

```sql
INSERT INTO staff (auth_user_id, email, full_name, role, is_active)
VALUES (
  'YOUR_AUTH_USER_UUID',
  'your-email@example.com',
  'Admin Name',
  'super_admin',
  true
);
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your admin credentials.

## Project Structure

```
├── app/
│   ├── (auth)/
│   │   └── login/           # Login page
│   ├── (dashboard)/
│   │   ├── dashboard/       # Main dashboard
│   │   ├── leads/           # Leads management
│   │   ├── customers/       # Customer database
│   │   ├── team/            # Team performance
│   │   ├── staff/           # Staff management
│   │   └── opportunities/   # Sales pipeline
│   └── api/
│       └── webhooks/
│           └── new-lead/    # Lead ingestion API
├── components/
│   ├── ui/                  # Shadcn UI components
│   ├── charts/              # Dashboard charts
│   ├── tables/              # Data tables
│   └── layout/              # Layout components
├── lib/
│   ├── supabase/            # Supabase clients
│   ├── config.ts            # App configuration
│   ├── types.ts             # TypeScript types
│   └── utils.ts             # Utility functions
└── supabase/
    └── schema.sql           # Database schema
```

## Webhook API

### Endpoint
`POST /api/webhooks/new-lead`

### Request Body
```json
{
  "customer_name": "John Doe",
  "contact_number": "9876543210",
  "email": "john@example.com",
  "device_type": "iPhone",
  "device_model": "14 Pro Max",
  "issue_reported": "Battery",
  "lead_source": "LP-1"
}
```

### Response
```json
{
  "success": true,
  "message": "Lead created successfully",
  "data": {
    "id": "uuid",
    "customer_name": "John Doe",
    "status": "new",
    "assigned_to": "telecaller-uuid"
  }
}
```

### Supported Values

**Device Types**: iPhone, Apple Watch, MacBook, iPad

**iPhone Issues**: Original Screen, Premium Screen, Touch & Glass, Battery, Charging Port, Ear Speaker, Loud Speaker, Back Glass, Face ID, Logic Board, Other

**Apple Watch Issues**: Screen, Touch & Glass, Battery, Other

**MacBook Issues**: Screen, Battery, Keyboard, Liquid Damage, Not Powering On, Other

**iPad Issues**: Touch & Glass, Screen, Battery, Charging Port, Other

## Deployment

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=https://crm.fixplanet.in
```

## Database Schema

The database includes the following tables:

- **staff**: User accounts with roles
- **leads**: Customer inquiries and repair requests
- **call_notes**: Call history and notes
- **customers**: Converted leads

Row Level Security (RLS) is enabled with policies for:
- Role-based access control
- Service role access for webhooks
- User-specific data access

## Design System

### Colors
- Primary: Black (#000000)
- Background: White (#FFFFFF)
- Hover: Light Gray (#F5F5F5)
- Status badges use semantic colors (Green, Red, Blue, etc.)

### Typography
- Font: Inter / System UI
- Monospace for code elements

### Spacing
- Consistent 16px/24px/32px grid

## License

Private - All rights reserved.
