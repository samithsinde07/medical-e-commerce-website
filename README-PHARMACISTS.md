# Pharmacist Accounts Setup

## Dummy Pharmacist Credentials

Three pharmacist accounts have been created for testing:

1. **Dr. Ramesh Kumar**
   - Email: `ramesh.pharma@example.com`
   - Password: `test123`

2. **Dr. Sneha Patel**
   - Email: `sneha.pharma@example.com`
   - Password: `test123`

3. **Dr. Arjun Mehta**
   - Email: `arjun.pharma@example.com`
   - Password: `test123`

## Setup Instructions

### Option 1: Manual Registration (Recommended)
1. Go to the auth page and register each pharmacist using the credentials above
2. After registration, run this SQL in your Supabase SQL Editor to assign pharmacist roles:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'pharmacist'::app_role
FROM auth.users
WHERE email IN (
  'ramesh.pharma@example.com',
  'sneha.pharma@example.com',
  'arjun.pharma@example.com'
)
ON CONFLICT (user_id, role) DO NOTHING;
```

### Option 2: Using the Seed Script
1. Make sure you have Node.js installed
2. Run: `npm install @supabase/supabase-js`
3. Run: `npx tsx scripts/seed-pharmacists.ts`
4. Follow the SQL instructions printed by the script to assign roles

## Pharmacist Dashboard Features

Once logged in as a pharmacist, you'll have access to:

### 📋 Prescriptions Queue
- View all pending prescriptions
- Preview prescription files
- Approve with optional comments
- Reject with required reason
- Automatic email notifications to users

### 📦 Orders Management
- View all active orders
- Update order status (pending → approved → processing → shipped → delivered)
- View order details, items, and delivery information

### 📊 Inventory Management
- View all products in stock
- Update stock quantities
- Low stock warnings (items < 10)

### 📈 Performance Metrics
- Pending prescriptions count
- Active orders count
- Total approved prescriptions
- Total rejected prescriptions

## Email Notifications

When a pharmacist approves or rejects a prescription:
- User receives an email notification
- Email includes pharmacist name
- Email includes comments/rejection reason
- Email has color-coded status (green for approved, red for rejected)

## Notes
- Make sure you have added your RESEND_API_KEY secret for email notifications to work
- Verify your domain at https://resend.com/domains for production use
- Test email uses the default `onboarding@resend.dev` sender
