"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { PlayerCategory } from "@/types/database";
import {
  CATEGORIES,
  CATEGORY_ELO_MAP,
  CATEGORY_LABELS,
} from "@/types/database";
import { Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import type { PlayerPosition, SelectedPlayer } from "./types";

interface GhostPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: PlayerPosition | null;
  onPlayerCreated: (player: SelectedPlayer, position: PlayerPosition) => void;
  onError: (error: string) => void;
}

export function GhostPlayerDialog({
  open,
  onOpenChange,
  position,
  onPlayerCreated,
  onError,
}: GhostPlayerDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<PlayerCategory>("8va");
  const [creating, setCreating] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    category?: string;
  }>({});

  const supabase = createClient();

  const resetForm = () => {
    setName("");
    setCategory("8va");
    setFormErrors({});
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleCreate = async () => {
    // Validate all fields
    const errors: { name?: string; category?: string } = {};

    if (!name.trim()) {
      errors.name = "El nombre es requerido";
    }

    if (!category) {
      errors.category = "La categoría es requerida";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (!position) return;

    setFormErrors({});
    setCreating(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      onError("No estás autenticado");
      setCreating(false);
      return;
    }

    const initialElo = CATEGORY_ELO_MAP[category];

    const { data: newPlayer, error } = await supabase
      .from("players")
      .insert({
        display_name: name.trim(),
        is_ghost: true,
        created_by_user_id: user.id,
        elo_score: initialElo,
        category_label: category,
      })
      .select(
        "id, display_name, is_ghost, elo_score, category_label, profile_id, matches_played"
      )
      .single();

    if (error || !newPlayer) {
      onError("Error al crear el jugador");
      setCreating(false);
      return;
    }

    // Notify parent of the new player
    onPlayerCreated(newPlayer as SelectedPlayer, position);

    // Reset and close dialog
    resetForm();
    setCreating(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Jugador Invitado</DialogTitle>
          <DialogDescription>
            Creá un perfil para un amigo que no tiene cuenta
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="ghost-name">Nombre *</Label>
            <Input
              id="ghost-name"
              placeholder="Nombre del jugador"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (formErrors.name) {
                  setFormErrors((prev) => ({
                    ...prev,
                    name: undefined,
                  }));
                }
              }}
              className={formErrors.name ? "border-destructive" : ""}
            />
            {formErrors.name && (
              <p className="text-sm text-destructive">{formErrors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ghost-category">Categoría Estimada *</Label>
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v as PlayerCategory);
                if (formErrors.category) {
                  setFormErrors((prev) => ({
                    ...prev,
                    category: undefined,
                  }));
                }
              }}
            >
              <SelectTrigger
                id="ghost-category"
                className={formErrors.category ? "border-destructive" : ""}
              >
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]} ({CATEGORY_ELO_MAP[cat]} pts)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.category && (
              <p className="text-sm text-destructive">{formErrors.category}</p>
            )}
          </div>
          <Button
            variant="outline"
            className="w-full text-secondary hover:text-secondary hover:bg-muted"
            onClick={handleCreate}
            disabled={!name.trim() || !category || creating}
          >
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <UserPlus className="mr-2 h-4 w-4" />
            Crear Jugador
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

