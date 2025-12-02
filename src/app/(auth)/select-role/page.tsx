"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UserType } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

export default function SelectRolePage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleRoleSelection(userType: UserType) {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Update profile with user_type
      const { error } = await supabase
        .from("profiles")
        .update({ user_type: userType })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating user type:", error);
        setLoading(false);
        return;
      }

      // Redirect based on user type
      if (userType === "player") {
        router.push("/complete-profile");
      } else {
        router.push("/create-club");
      }
    } catch (error) {
      console.error("Error selecting role:", error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      {/* Logo/Brand */}
      <div className="mb-6 flex flex-col items-center">
        <Image
          src="/icon-192.png"
          alt="Vibo"
          width={64}
          height={64}
          className="rounded-xl"
        />
      </div>

      <Card className="w-full max-w-md border-0 bg-card/50 backdrop-blur">
        <CardHeader className="space-y-1 pb-4 text-center">
          <CardTitle className="text-xl">Bienvenido a Vibo</CardTitle>
          <CardDescription>
            Para empezar, contanos quién sos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <button
            type="button"
            onClick={() => handleRoleSelection("player")}
            disabled={loading}
            className="w-full rounded-lg border-2 border-border p-6 text-left transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Soy Jugador</h3>
                <p className="text-sm text-muted-foreground">
                  Registrá partidos y competí con otros jugadores
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelection("club")}
            disabled={loading}
            className="w-full rounded-lg border-2 border-border p-6 text-left transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Soy Club</h3>
                <p className="text-sm text-muted-foreground">
                  Gestioná torneos y organizá eventos
                </p>
              </div>
            </div>
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

