import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/";

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        errorDescription || "Error de autenticación"
      )}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code
    );

    if (exchangeError) {
      console.error("Error exchanging code:", exchangeError);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(
          exchangeError.message || "Error al iniciar sesión"
        )}`
      );
    }

    // Wait a bit for triggers to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if user needs to complete profile (OAuth signup)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Error getting user:", userError);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(
          "Error al obtener información del usuario"
        )}`
      );
    }

    if (user) {
      // Try to get profile, create if it doesn't exist
      let { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_type, category_label, country, province, email, phone, gender")
        .eq("id", user.id)
        .single();

      // If profile doesn't exist, try to create it
      if (profileError || !profile) {
        const metadata = user.user_metadata || {};
        const username = (
          metadata.username ||
          metadata.preferred_username ||
          metadata.email?.split("@")[0] ||
          `user_${user.id.slice(0, 8)}`
        )
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "");
        const fullName =
          metadata.full_name ||
          metadata.name ||
          metadata.display_name ||
          username;

        const { error: createError } = await supabase.from("profiles").insert({
          id: user.id,
          username: username,
          full_name: fullName,
          avatar_url: metadata.avatar_url || null,
          elo_score: 1400,
          category_label: "8va",
          email: user.email || null,
          phone: metadata.phone || metadata.phone_number || null,
          // user_type will be NULL by default, which triggers role selection
        });

        if (createError) {
          console.error("Error creating profile:", createError);
          // Still redirect to select-role to let user choose
        }

        // New user - redirect to role selection
        return NextResponse.redirect(`${origin}/select-role`);
      }

      // Check if user_type is set
      if (!profile.user_type) {
        // User hasn't selected a role yet
        return NextResponse.redirect(`${origin}/select-role`);
      }

      // Handle based on user type
      if (profile.user_type === "club") {
        // Check if club exists
        const { data: club } = await supabase
          .from("clubs")
          .select("id")
          .eq("created_by", user.id)
          .single();

        if (!club) {
          // Club type but no club created yet
          return NextResponse.redirect(`${origin}/create-club`);
        }

        // Club exists, proceed normally
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Player type - check if profile is complete
      const hasRequiredFields =
        profile.category_label &&
        profile.country &&
        profile.province &&
        (profile.email || user.email) &&
        profile.phone &&
        profile.gender;

      if (!hasRequiredFields) {
        return NextResponse.redirect(`${origin}/complete-profile`);
      }
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  // No code provided
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      "Código de autenticación no encontrado"
    )}`
  );
}
