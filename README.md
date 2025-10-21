# MedEase - Online Pharmacy Platform

A comprehensive online pharmacy platform built with React, TypeScript, Tailwind CSS, and Lovable Cloud backend.

## 🌟 Features

### For Customers
- **Browse Products**: View medicines, health supplements, and wellness products
- **Product Categories**: Filter by OTC medicines, prescription drugs, supplements, and personal care
- **Prescription Upload**: Upload prescriptions for prescription-required medicines
- **Shopping Cart**: Add, update, and remove items
- **Secure Checkout**: Payment processing with Razorpay integration
- **Order Tracking**: Track order status from pending to delivered
- **User Profile**: Manage personal information and delivery addresses

### For Pharmacists
- **Prescription Queue**: View and manage all pending prescriptions
- **Prescription Review**: 
  - View uploaded prescription files (PDF, JPG, PNG)
  - Approve prescriptions with optional comments
  - Reject prescriptions with mandatory reasons
- **Order Management**: Update order status through workflow stages
- **Inventory Control**: Monitor and update product stock levels
- **Performance Dashboard**: View metrics on prescriptions and orders

### For Admins
- **Product Management**: Add, edit, and delete products
- **Inventory Management**: Update stock quantities
- **User Management**: View and manage user roles
- **Order Oversight**: Monitor all orders and their statuses
- **Analytics Dashboard**: View business metrics and statistics

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for fast builds and HMR
- **Tailwind CSS** for styling with custom design system
- **shadcn/ui** components
- **React Router** for navigation
- **React Query** for data fetching
- **Lucide React** for icons

### Backend (Lovable Cloud)
- **Database**: PostgreSQL with Row-Level Security (RLS)
- **Authentication**: Email/password authentication with JWT
- **Storage**: File storage for prescriptions and product images
- **Edge Functions**: Serverless functions for email notifications
- **Real-time**: Support for real-time updates

## 📊 Database Schema

### Tables

#### `profiles`
Stores user profile information
- `id` (uuid, primary key)
- `full_name` (text)
- `phone` (text, nullable)
- `address` (text, nullable)
- `created_at`, `updated_at` (timestamps)

#### `user_roles`
Manages user roles and permissions
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to auth.users)
- `role` (enum: 'user', 'pharmacist', 'admin')
- `created_at` (timestamp)

#### `products`
Product catalog
- `id` (uuid, primary key)
- `name` (text)
- `description` (text)
- `price` (numeric)
- `category` (text)
- `brand` (text)
- `image_url` (text)
- `stock_quantity` (integer)
- `requires_prescription` (boolean)
- `created_at`, `updated_at` (timestamps)

#### `prescriptions`
Prescription uploads and approvals
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `file_url` (text) - path to stored prescription file
- `status` (enum: 'pending', 'approved', 'rejected')
- `pharmacist_id` (uuid, foreign key) - **auto-assigned on upload**
- `approval_comments` (text)
- `rejection_reason` (text)
- `reviewed_at` (timestamp)
- `created_at` (timestamp)

#### `orders`
Customer orders
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `total_amount` (numeric)
- `delivery_address` (text)
- `status` (enum: 'pending', 'approved', 'processing', 'shipped', 'delivered', 'cancelled')
- `payment_status` (text)
- `payment_method` (text)
- `razorpay_order_id` (text)
- `razorpay_payment_id` (text)
- `prescription_id` (uuid, nullable)
- `created_at`, `updated_at` (timestamps)

#### `order_items`
Individual items in orders
- `id` (uuid, primary key)
- `order_id` (uuid, foreign key)
- `product_id` (uuid, foreign key)
- `quantity` (integer)
- `price` (numeric)
- `created_at` (timestamp)

#### `cart_items`
Shopping cart items
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `product_id` (uuid, foreign key)
- `quantity` (integer)
- `created_at`, `updated_at` (timestamps)

## 🔐 Security

### Row-Level Security (RLS)
All tables have RLS policies enforcing:
- Users can only access their own data
- Pharmacists can view and manage prescriptions and orders
- Admins have full access to products and inventory
- Public can view products (read-only)

### Authentication
- Email/password authentication
- JWT-based session management
- Auto-confirm email signups (for testing)
- Role-based access control via `user_roles` table

### Database Functions
- `has_role(_user_id, _role)`: Security definer function to check user roles
- `auto_assign_prescription()`: Automatically assigns new prescriptions to first available pharmacist
- `handle_new_user()`: Trigger function to create profile and assign default role on signup
- `update_updated_at_column()`: Trigger function to update timestamps

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Git

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd medease
```

2. Install dependencies
```bash
npm install
# or
bun install
```

3. Start development server
```bash
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:5173`

## 👥 User Roles & Access

### Creating Test Accounts

#### Regular User
1. Navigate to the signup page
2. Register with any email and password
3. Default role: `user`

#### Pharmacist
See `README-PHARMACISTS.md` for detailed pharmacist setup instructions.

Test pharmacist credentials:
- Email: `ramesh.pharma@example.com`
- Password: `test123`

#### Admin
Admins must be manually created via SQL:
```sql
-- After creating a user account, assign admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('<user-id>', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

## 📧 Email Notifications

The platform sends email notifications using Resend for:
- Prescription approval (with pharmacist comments)
- Prescription rejection (with rejection reason)

### Email Configuration
- Edge function: `notify-prescription-update`
- Required secret: `RESEND_API_KEY`
- Default sender: `onboarding@resend.dev` (for testing)
- For production: Verify custom domain at https://resend.com/domains

## 🔄 Order Workflow

1. **Customer adds items to cart**
   - Products can be OTC or prescription-required
   - Cart persists across sessions

2. **Checkout process**
   - If cart contains prescription items → Upload prescription required
   - Prescription uploaded to secure storage
   - **Prescription auto-assigned to first available pharmacist**
   - Enter delivery address
   - Select payment method (COD or Razorpay)

3. **Pharmacist reviews prescription**
   - Views prescription file
   - Approves or rejects with comments
   - Email sent to customer

4. **Order processing**
   - Status: pending → approved → processing → shipped → delivered
   - Customer can track order status
   - Pharmacist can update order status

## 💳 Payment Integration

### Razorpay
- Test mode enabled by default
- Payment gateway for online payments
- COD (Cash on Delivery) also available
- Payment status tracked in orders table

### Test Cards (Razorpay)
```
Card Number: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
```

## 📁 File Storage

### Storage Buckets

#### `prescriptions` (Private)
- Stores uploaded prescription files
- Access via signed URLs (2-minute expiry)
- Only accessible by pharmacists and prescription owner
- Supported formats: PDF, JPG, PNG

#### `product-images` (Public)
- Stores product images
- Publicly accessible
- Used for product catalog display

## 🎨 Design System

### Color Tokens (HSL)
Defined in `src/index.css`:
- `--primary`: Main brand color
- `--secondary`: Secondary actions
- `--accent`: Highlights and CTAs
- `--background`: Page background
- `--foreground`: Text color
- `--muted`: Subtle backgrounds
- `--destructive`: Error states

### Components
Using shadcn/ui with custom variants:
- Buttons (default, destructive, outline, secondary, ghost, link)
- Cards, Dialogs, Dropdowns
- Forms with react-hook-form
- Tables with sorting and filtering
- Toast notifications

## 🛠️ Edge Functions

### `notify-prescription-update`
Sends email notifications when prescriptions are approved/rejected.

**Environment variables required:**
- `RESEND_API_KEY`: Resend API key for sending emails
- `SUPABASE_URL`: Auto-provided
- `SUPABASE_SERVICE_ROLE_KEY`: Auto-provided

**Triggers:**
Called from pharmacist dashboard when updating prescription status.

## 📱 Key Pages

### Public Pages
- `/` - Landing page with features showcase
- `/products` - Product catalog with filtering
- `/auth` - Login/signup

### Authenticated Pages
- `/profile` - User profile management
- `/cart` - Shopping cart
- `/checkout` - Order placement
- `/dashboard` - Customer dashboard with orders

### Pharmacist Pages
- `/pharmacist-dashboard` - Prescription and order management

### Admin Pages
- `/admin-dashboard` - Product and inventory management

## 🧪 Testing

### Test Flow
1. **Create user account** → Login
2. **Browse products** → Add prescription medicine to cart
3. **Checkout** → Upload prescription (auto-assigned to pharmacist)
4. **Login as pharmacist** → Review prescription
5. **Approve/reject** → Check email notification
6. **Complete order** → Track order status

## 🔧 Development

### Project Structure
```
src/
├── components/       # Reusable components
│   ├── ui/          # shadcn/ui components
│   └── ...          # Custom components
├── contexts/        # React contexts (Auth, Cart)
├── hooks/           # Custom hooks
├── integrations/    # Supabase client (auto-generated)
├── lib/            # Utilities
├── pages/          # Route pages
└── main.tsx        # App entry point

supabase/
├── functions/      # Edge functions
└── config.toml     # Supabase configuration
```

### Key Files
- `src/contexts/AuthContext.tsx` - Authentication state management
- `src/contexts/CartContext.tsx` - Shopping cart state
- `src/integrations/supabase/client.ts` - Supabase client (auto-generated)
- `tailwind.config.ts` - Tailwind configuration with design tokens

## 🚢 Deployment

### Build
```bash
npm run build
# or
bun run build
```

### Deploy
Click the "Publish" button in Lovable to deploy to production.

### Custom Domain
Configure custom domain in Project Settings → Domains.

## 📝 Environment Variables

All Supabase environment variables are auto-configured:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

**Do not edit `.env` manually** - it's auto-generated.

## 🐛 Troubleshooting

### Prescription Upload Issues
- Check file format (PDF, JPG, PNG only)
- Ensure prescriptions bucket exists
- Verify RLS policies on prescriptions table

### Email Not Sending
- Verify `RESEND_API_KEY` is set in backend secrets
- Check edge function logs for errors
- Ensure domain is verified (for production)

### Payment Errors
- Verify Razorpay credentials (if using online payment)
- Check payment status in orders table
- COD always available as fallback

### Auto-Assignment Not Working
- Ensure at least one user has 'pharmacist' role
- Check `auto_assign_prescription()` trigger exists
- Verify trigger is enabled on prescriptions table

## 📚 Additional Documentation

- **Pharmacist Setup**: See `README-PHARMACISTS.md`
- **Lovable Docs**: https://docs.lovable.dev/

## 🤝 Support

For issues or questions:
1. Check troubleshooting section above
2. Review backend logs via Lovable Cloud dashboard
3. Check browser console for frontend errors

## 📄 License

This project is built with Lovable and uses open-source technologies.

---

**Built with ❤️ using Lovable**
