import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  organizationName: string;
  inviterName?: string;
  role: string;
  token: string;
  appUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, organizationName, inviterName, role, token, appUrl }: InvitationEmailRequest = await req.json();

    if (!email || !organizationName || !token || !appUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const inviteUrl = `${appUrl}/accept-invitation?token=${token}`;
    const roleArabic = role === 'admin' ? 'مدير' : role === 'volunteer' ? 'متطوع' : 'مستخدم';

    console.log(`Sending invitation email to ${email} for organization ${organizationName}`);

    const emailResponse = await resend.emails.send({
      from: "Yateem Care <onboarding@resend.dev>",
      to: [email],
      subject: `دعوة للانضمام إلى ${organizationName}`,
      html: `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">دعوة للانضمام</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                مرحباً،
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                تمت دعوتك للانضمام إلى منظمة <strong style="color: #1a365d;">${organizationName}</strong> بدور <strong style="color: #2563eb;">${roleArabic}</strong>.
              </p>
              
              ${inviterName ? `
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">
                الدعوة من: <span style="color: #374151;">${inviterName}</span>
              </p>
              ` : ''}
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                  قبول الدعوة
                </a>
              </div>
              
              <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 24px 0 0;">
                هذا الرابط صالح لمدة 7 أيام
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                إذا لم تتوقع هذه الرسالة، يمكنك تجاهلها بأمان.
              </p>
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 8px 0 0;">
                Yateem Care Connect
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
