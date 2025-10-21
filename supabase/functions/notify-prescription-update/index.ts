import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  prescriptionId: string;
  status: string;
  pharmacistName: string;
  comments?: string;
  rejectionReason?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status:200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { prescriptionId, status, pharmacistName, comments, rejectionReason }: NotificationRequest = await req.json();

    // Get prescription and user details
    const { data: prescription, error: prescriptionError } = await supabaseClient
      .from("prescriptions")
      .select("user_id")
      .eq("id", prescriptionId)
      .single();

    if (prescriptionError || !prescription) {
      throw new Error("Prescription not found");
    }

    // Get user email and profile
    const { data: { user }, error: userError } = await supabaseClient.auth.admin.getUserById(
      prescription.user_id
    );

    if (userError || !user?.email) {
      throw new Error("User not found");
    }

    // Get user profile
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("id", prescription.user_id)
      .single();

    const statusText = status === "approved" ? "Approved" : "Rejected";
    const statusColor = status === "approved" ? "#22c55e" : "#ef4444";

    let emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Prescription ${statusText}</h2>
        <p>Dear ${profile?.full_name || "User"},</p>
        <p>Your prescription has been <strong style="color: ${statusColor};">${statusText.toLowerCase()}</strong> by ${pharmacistName}.</p>
    `;

    if (status === "approved" && comments) {
      emailBody += `
        <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1e40af;">Pharmacist Comments:</h3>
          <p style="margin: 0;">${comments}</p>
        </div>
      `;
    }

    if (status === "rejected" && rejectionReason) {
      emailBody += `
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #b91c1c;">Rejection Reason:</h3>
          <p style="margin: 0;">${rejectionReason}</p>
        </div>
      `;
    }

    emailBody += `
        <p>You can view your prescription details in your dashboard.</p>
        <p style="margin-top: 30px;">Best regards,<br>MedStore Pharmacy Team</p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "MedStore <onboarding@resend.dev>",
      to: [user.email],
      subject: `Prescription ${statusText} - MedStore`,
      html: emailBody,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});