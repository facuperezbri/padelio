"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMyClubAsOwner } from "@/lib/react-query/hooks/use-clubs";
import { useCreateTournament } from "@/lib/react-query/mutations/use-tournaments";
import {
  CATEGORIES,
  TOURNAMENT_FORMAT_LABELS,
  type PlayerCategory,
  type TournamentFormat,
} from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function CreateTournamentForm() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const { data: club } = useMyClubAsOwner(userId);
  const createTournament = useCreateTournament();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    format: "single_elimination" as TournamentFormat,
    maxTeams: "",
    minTeams: "4",
    categoryLabel: "" as PlayerCategory | "",
    gender: "" as "Masculino" | "Femenino" | "Mixto" | "",
    entryFee: "",
    prizePool: "",
    rules: "",
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getUserId() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    getUserId();
  }, []);

  // Generate slug from name
  useEffect(() => {
    if (formData.name) {
      const slug = formData.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!club) {
      setError("No se encontró tu club");
      return;
    }

    try {
      await createTournament.mutateAsync({
        clubId: club.id,
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        registrationDeadline: formData.registrationDeadline || null,
        format: formData.format,
        maxTeams: formData.maxTeams ? parseInt(formData.maxTeams) : null,
        minTeams: parseInt(formData.minTeams),
        categoryLabel: formData.categoryLabel || null,
        gender: formData.gender || null,
        entryFee: formData.entryFee ? parseFloat(formData.entryFee) : null,
        prizePool: formData.prizePool || null,
        rules: formData.rules || null,
      });

      router.push("/club/tournaments");
    } catch (err: any) {
      setError(err.message || "Error al crear el torneo");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Torneo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="Torneo de Verano 2024"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL) *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              required
              placeholder="torneo-de-verano-2024"
            />
            <p className="text-xs text-muted-foreground">
              Se usará en la URL del torneo
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Información sobre el torneo..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Fecha de Inicio *</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Fecha de Fin</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationDeadline">
              Fecha Límite de Inscripción
            </Label>
            <Input
              id="registrationDeadline"
              type="date"
              value={formData.registrationDeadline}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  registrationDeadline: e.target.value,
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="format">Formato *</Label>
            <Select
              value={formData.format}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  format: value as TournamentFormat,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TOURNAMENT_FORMAT_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minTeams">Mínimo de Equipos *</Label>
              <Input
                id="minTeams"
                type="number"
                min="2"
                value={formData.minTeams}
                onChange={(e) =>
                  setFormData({ ...formData, minTeams: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTeams">Máximo de Equipos</Label>
              <Input
                id="maxTeams"
                type="number"
                min="2"
                value={formData.maxTeams}
                onChange={(e) =>
                  setFormData({ ...formData, maxTeams: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryLabel">Categoría</Label>
            <Select
              value={formData.categoryLabel}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  categoryLabel: value as PlayerCategory,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las categorías</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Género</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  gender: value as "Masculino" | "Femenino" | "Mixto",
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los géneros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los géneros</SelectItem>
                <SelectItem value="Masculino">Masculino</SelectItem>
                <SelectItem value="Femenino">Femenino</SelectItem>
                <SelectItem value="Mixto">Mixto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="entryFee">Precio de Inscripción ($)</Label>
            <Input
              id="entryFee"
              type="number"
              min="0"
              step="0.01"
              value={formData.entryFee}
              onChange={(e) =>
                setFormData({ ...formData, entryFee: e.target.value })
              }
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prizePool">Premios</Label>
            <Textarea
              id="prizePool"
              value={formData.prizePool}
              onChange={(e) =>
                setFormData({ ...formData, prizePool: e.target.value })
              }
              placeholder="Descripción de los premios..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rules">Reglamento</Label>
            <Textarea
              id="rules"
              value={formData.rules}
              onChange={(e) =>
                setFormData({ ...formData, rules: e.target.value })
              }
              placeholder="Reglas específicas del torneo..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={createTournament.isPending}
        >
          {createTournament.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Crear Torneo
        </Button>
      </div>
    </form>
  );
}

