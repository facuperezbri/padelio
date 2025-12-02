"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCountries, getProvincesByCountry } from "@/lib/countries";
import { createClient } from "@/lib/supabase/client";
import {
  Building2,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CreateClubPage() {
  const [formData, setFormData] = useState({
    clubName: "",
    clubSlug: "",
    clubDescription: "",
    clubCity: "",
    clubProvince: "",
    clubCountry: "Argentina",
    clubPhone: "",
    clubEmail: "",
    clubWebsite: "",
    clubInstagram: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasOAuthEmail, setHasOAuthEmail] = useState(false);
  const [hasOAuthPhone, setHasOAuthPhone] = useState(false);
  const [availableProvinces, setAvailableProvinces] = useState<
    Array<{ code: string; name: string }>
  >([]);
  const router = useRouter();
  const supabase = createClient();
  const countries = getCountries();

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (formData.clubCountry) {
      const provinces = getProvincesByCountry(formData.clubCountry);
      setAvailableProvinces(provinces);
      // Reset province if country changes
      setFormData((prev) => {
        if (
          prev.clubProvince &&
          !provinces.find(
            (p) => p.code === prev.clubProvince || p.name === prev.clubProvince
          )
        ) {
          return { ...prev, clubProvince: "" };
        }
        return prev;
      });
    } else {
      setAvailableProvinces([]);
      setFormData((prev) => ({ ...prev, clubProvince: "" }));
    }
  }, [formData.clubCountry]);

  // Generate slug from club name
  useEffect(() => {
    if (formData.clubName) {
      const slug = formData.clubName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, clubSlug: slug }));
    }
  }, [formData.clubName]);

  async function loadUserData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Check if user already has a club
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type, email, phone")
        .eq("id", user.id)
        .single();

      if (!profile || profile.user_type !== "club") {
        router.push("/select-role");
        return;
      }

      if (user.email) {
        setHasOAuthEmail(true);
        setFormData((prev) => ({ ...prev, clubEmail: user.email || "" }));
      }

      if (profile.phone) {
        setHasOAuthPhone(true);
        setFormData((prev) => ({ ...prev, clubPhone: profile.phone || "" }));
      }

      setLoading(false);
    } catch (err) {
      console.error("Error loading user data:", err);
      setError("Error al cargar los datos del usuario");
      setLoading(false);
    }
  }

  async function handleCreateClub(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Validate required fields
      if (!formData.clubName || !formData.clubSlug) {
        setError("El nombre del club y el slug son requeridos");
        setSaving(false);
        return;
      }

      // Validate slug format
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(formData.clubSlug)) {
        setError(
          "El slug solo puede contener letras minúsculas, números y guiones"
        );
        setSaving(false);
        return;
      }

      // Check if slug is already taken
      const { data: existingClubs, error: checkError } = await supabase
        .from("clubs")
        .select("id")
        .eq("slug", formData.clubSlug)
        .limit(1);

      // If checkError exists and it's not a "no rows" error, something went wrong
      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error checking slug:", checkError);
        // Continue anyway, the RPC function will catch duplicates
      }

      if (existingClubs && existingClubs.length > 0) {
        setError("Ya existe un club con ese slug. Por favor elegí otro.");
        setSaving(false);
        return;
      }

      // Create club using the function
      const { data: clubId, error: clubError } = await supabase.rpc(
        "create_club_account",
        {
          p_name: formData.clubName,
          p_slug: formData.clubSlug,
          p_description: formData.clubDescription || null,
          p_city: formData.clubCity || null,
          p_province: formData.clubProvince || null,
          p_country: formData.clubCountry || "Argentina",
          p_phone: formData.clubPhone || null,
          p_email: formData.clubEmail || user.email || null,
          p_website: formData.clubWebsite || null,
          p_instagram: formData.clubInstagram || null,
          p_is_public: true,
        }
      );

      if (clubError) {
        // Handle unique constraint violation
        if (clubError.message.includes("unique") || clubError.message.includes("duplicate")) {
          setError("Ya existe un club con ese nombre o slug. Por favor elegí otro.");
        } else {
          setError(clubError.message || "Error al crear el club");
        }
        setSaving(false);
        return;
      }

      // Redirect to club dashboard
      router.push("/club/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al crear el club");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            Cargando...
          </p>
        </div>
      </div>
    );
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
          <CardTitle className="text-xl">Crear tu Club</CardTitle>
          <CardDescription>
            Completá la información básica de tu club
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateClub} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="clubName">Nombre del Club *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="clubName"
                  type="text"
                  placeholder="Club de Padel Ejemplo"
                  value={formData.clubName}
                  onChange={(e) =>
                    setFormData({ ...formData, clubName: e.target.value })
                  }
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clubSlug">Slug (URL) *</Label>
              <Input
                id="clubSlug"
                type="text"
                placeholder="club-de-padel-ejemplo"
                value={formData.clubSlug}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    clubSlug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "-")
                      .replace(/-+/g, "-")
                      .replace(/(^-|-$)/g, ""),
                  })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Se usará en la URL de tu club (ej: vibo.app/clubs/{formData.clubSlug || "tu-club"})
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clubDescription">Descripción</Label>
              <Textarea
                id="clubDescription"
                placeholder="Descripción del club..."
                value={formData.clubDescription}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    clubDescription: e.target.value,
                  })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Select
                  value={formData.clubCountry}
                  onValueChange={(value) =>
                    setFormData({ ...formData, clubCountry: value })
                  }
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Selecciona el país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.clubCountry && availableProvinces.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="province">Provincia</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Select
                    value={formData.clubProvince}
                    onValueChange={(value) =>
                      setFormData({ ...formData, clubProvince: value })
                    }
                  >
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Selecciona la provincia" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProvinces.map((province) => (
                        <SelectItem key={province.code} value={province.name}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="clubCity">Ciudad</Label>
              <Input
                id="clubCity"
                type="text"
                placeholder="Buenos Aires"
                value={formData.clubCity}
                onChange={(e) =>
                  setFormData({ ...formData, clubCity: e.target.value })
                }
              />
            </div>

            {!hasOAuthEmail && (
              <div className="space-y-2">
                <Label htmlFor="clubEmail">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="clubEmail"
                    type="email"
                    placeholder="club@email.com"
                    value={formData.clubEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, clubEmail: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            {!hasOAuthPhone && (
              <div className="space-y-2">
                <Label htmlFor="clubPhone">Teléfono</Label>
                <PhoneInput
                  id="clubPhone"
                  placeholder="+54 9 11 1234-5678"
                  value={formData.clubPhone || undefined}
                  onChange={(value: string | undefined) =>
                    setFormData({ ...formData, clubPhone: value || "" })
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="clubWebsite">Sitio Web</Label>
              <Input
                id="clubWebsite"
                type="url"
                placeholder="https://ejemplo.com"
                value={formData.clubWebsite}
                onChange={(e) =>
                  setFormData({ ...formData, clubWebsite: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clubInstagram">Instagram</Label>
              <Input
                id="clubInstagram"
                type="text"
                placeholder="@clubpadel"
                value={formData.clubInstagram}
                onChange={(e) =>
                  setFormData({ ...formData, clubInstagram: e.target.value })
                }
              />
            </div>

            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Club
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

