import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

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

    const results = [];

    for (const pharmacist of pharmacists) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUsers?.users.some(u => u.email === pharmacist.email);

      let userId;

      if (userExists) {
        const existingUser = existingUsers?.users.find(u => u.email === pharmacist.email);
        userId = existingUser?.id;
        results.push({ email: pharmacist.email, status: "already_exists", id: userId });
      } else {
        // Create user
        const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
          email: pharmacist.email,
          password: pharmacist.password,
          email_confirm: true,
          user_metadata: {
            full_name: pharmacist.name
          }
        });

        if (userError) {
          console.error(`Error creating user ${pharmacist.email}:`, userError);
          results.push({ email: pharmacist.email, status: "error", error: userError.message });
          continue;
        }

        userId = newUser.user.id;

        // Insert into profiles
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .upsert({
            id: userId,
            full_name: pharmacist.name
          });

        if (profileError) {
          console.error(`Error creating profile for ${pharmacist.email}:`, profileError);
        }

        // Assign pharmacist role
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .upsert({
            user_id: userId,
            role: "pharmacist"
          });

        if (roleError) {
          console.error(`Error assigning role to ${pharmacist.email}:`, roleError);
        }

        results.push({ email: pharmacist.email, status: "created", id: userId });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: "Pharmacist accounts seeded successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error seeding pharmacists:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});