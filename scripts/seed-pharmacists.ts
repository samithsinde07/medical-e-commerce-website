import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const pharmacists = [
  { 
    name: "Dr. Ramesh Kumar", 
    email: "ramesh.pharma@example.com", 
    password: "test123"
  },
  { 
    name: "Dr. Sneha Patel", 
    email: "sneha.pharma@example.com", 
    password: "test123"
  },
  { 
    name: "Dr. Arjun Mehta", 
    email: "arjun.pharma@example.com", 
    password: "test123"
  }
];

async function seedPharmacists() {
  console.log("Starting pharmacist seeding...");
  
  for (const pharmacist of pharmacists) {
    try {
      // Sign up the pharmacist
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: pharmacist.email,
        password: pharmacist.password,
        options: {
          data: {
            full_name: pharmacist.name
          }
        }
      });

      if (signUpError) {
        console.error(`Error creating ${pharmacist.name}:`, signUpError.message);
        continue;
      }

      if (!authData.user) {
        console.error(`No user data for ${pharmacist.name}`);
        continue;
      }

      console.log(`✓ Created auth user for ${pharmacist.name}`);

      // Note: The profile is created automatically via the handle_new_user trigger
      // We just need to add the pharmacist role

      // Wait a bit for the trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add pharmacist role (requires admin access or service role key)
      // This would need to be done via the Supabase dashboard or with service role key
      console.log(`⚠ Please manually assign 'pharmacist' role to ${pharmacist.email} in the database`);
      
    } catch (error) {
      console.error(`Unexpected error for ${pharmacist.name}:`, error);
    }
  }

  console.log("\nSeeding complete!");
  console.log("\nIMPORTANT: You need to manually run this SQL to assign pharmacist roles:");
  console.log(`
-- Run this in your Supabase SQL Editor:
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'pharmacist'::app_role
FROM auth.users
WHERE email IN (
  'ramesh.pharma@example.com',
  'sneha.pharma@example.com',
  'arjun.pharma@example.com'
)
ON CONFLICT (user_id, role) DO NOTHING;
  `);
}

seedPharmacists();
