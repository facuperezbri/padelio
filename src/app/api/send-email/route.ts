import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Resend API integration
// Install: npm install resend
// Get API key from: https://resend.com/api-keys

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { to, subject, html, text } = body;

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if Resend is configured
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    // Dynamic import to avoid issues if package not installed
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Vibo <noreply@vibo.app>",
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || text,
      text: text || html?.replace(/<[^>]*>/g, ""),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}

