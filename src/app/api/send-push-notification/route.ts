import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import webpush from "web-push";

// Web Push configuration
// Generate VAPID keys: npx web-push generate-vapid-keys
// Set in .env.local:
// VAPID_PUBLIC_KEY=your_public_key
// VAPID_PRIVATE_KEY=your_private_key
// VAPID_SUBJECT=mailto:your-email@example.com

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
    const { userId, title, body: notificationBody, url, data } = body;

    if (!userId || !title || !notificationBody) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Configure web-push with VAPID keys
    const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
    const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:noreply@vibo.app";

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error("VAPID keys not configured");
      return NextResponse.json(
        { error: "Push notifications not configured" },
        { status: 500 }
      );
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    // Get all push subscriptions for the user
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (subError || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: "No push subscriptions found for user",
      });
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title,
      body: notificationBody,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      url: url || "/",
      data: data || {},
    });

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(subscription, payload);
          return { success: true, endpoint: sub.endpoint };
        } catch (error: any) {
          // If subscription is invalid, remove it
          if (error.statusCode === 410 || error.statusCode === 404) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
          }
          return { success: false, endpoint: sub.endpoint, error: error.message };
        }
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled" && r.value.success).length;

    // Create notification record
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "match_invite", // or other types
      title,
      body: notificationBody,
      data: data || {},
    });

    return NextResponse.json({
      success: true,
      sent: successful,
      total: subscriptions.length,
    });
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send push notification" },
      { status: 500 }
    );
  }
}

