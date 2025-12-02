"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SelectRolePage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function setPlayerRole() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Automatically set user_type to 'player'
        const { error } = await supabase
          .from("profiles")
          .update({ user_type: "player" })
          .eq("id", user.id);

        if (error) {
          console.error("Error updating user type:", error);
          setLoading(false);
          return;
        }

        // Redirect to complete profile
        router.push("/complete-profile");
      } catch (error) {
        console.error("Error setting player role:", error);
        setLoading(false);
      }
    }

    setPlayerRole();
  }, [router, supabase]);

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
            Configurando tu cuenta...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-full rounded-lg border-2 border-primary p-6 text-left bg-primary/5">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

