"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EloBadge } from "@/components/ui/elo-badge";
import { GhostPlayerBadge } from "@/components/ui/ghost-player-badge";
import { NewPlayerBadge } from "@/components/ui/new-player-badge";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { fuzzySearch } from "@/lib/utils";
import { Plus, UserPlus, X } from "lucide-react";
import { useState } from "react";
import type { PlayerPosition, SelectedPlayer } from "./types";
import type { PlayerCategory } from "@/types/database";

export interface PlayerSlotProps {
  player: SelectedPlayer | null;
  position: PlayerPosition;
  availablePlayers: SelectedPlayer[];
  onSelect: (player: SelectedPlayer, position: PlayerPosition) => void;
  onRemove: (position: PlayerPosition) => void;
  onCreateGhost: (position: PlayerPosition) => void;
  label?: string;
}

export function PlayerSlot({
  player,
  position,
  availablePlayers,
  onSelect,
  onRemove,
  onCreateGhost,
  label,
}: PlayerSlotProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Use fuzzy search to find similar players
  const searchResults = fuzzySearch(
    availablePlayers,
    search,
    (p) => p.display_name,
    30
  );

  const filteredPlayers = searchResults.map((result) => result.item);
  const hasExactMatches = searchResults.some(
    (r) => r.matchType === "exact" || r.matchType === "starts-with"
  );
  const hasFuzzyMatches = searchResults.some((r) => r.matchType === "fuzzy");

  // Create a map for quick access to search result by ID
  const resultMap = new Map(searchResults.map((r) => [r.item.id, r]));

  if (player) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
        <PlayerAvatar
          name={player.display_name}
          avatarUrl={player.avatar_url}
          isGhost={player.is_ghost}
          size="md"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium">{player.display_name}</p>
            {player.is_ghost && <GhostPlayerBadge />}
            <NewPlayerBadge matchesPlayed={player.matches_played || 0} />
          </div>
          {label && <p className="text-xs text-muted-foreground">{label}</p>}
        </div>
        <EloBadge
          elo={player.elo_score}
          category={(player.category_label as PlayerCategory) || undefined}
          size="sm"
        />
        <Button variant="ghost" size="icon" onClick={() => onRemove(position)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-auto w-full justify-start gap-3 border-dashed p-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Plus className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 text-left">
            <span className="text-muted-foreground">
              {label ? `${label} - ` : ""}Seleccionar jugador
            </span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Seleccionar Jugador</DialogTitle>
        </DialogHeader>
        <Command className="rounded-none border-0">
          <CommandInput
            placeholder="Buscar jugador..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[50vh]">
            {filteredPlayers.length === 0 ? (
              <CommandEmpty>
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No se encontraron jugadores
                  </p>
                  <Button
                    variant="link"
                    className="mt-2 text-secondary"
                    onClick={() => {
                      setOpen(false);
                      onCreateGhost(position);
                    }}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Crear jugador invitado
                  </Button>
                </div>
              </CommandEmpty>
            ) : (
              <>
                {hasFuzzyMatches && !hasExactMatches && search.trim() && (
                  <div className="px-4 py-2 text-xs text-muted-foreground border-b">
                    Mostrando sugerencias similares
                  </div>
                )}
                <CommandGroup>
                  {filteredPlayers.map((p) => {
                    const result = resultMap.get(p.id);
                    const isFuzzyMatch = result?.matchType === "fuzzy";

                    return (
                      <CommandItem
                        key={p.id}
                        value={p.display_name}
                        onSelect={() => {
                          onSelect(p, position);
                          setOpen(false);
                        }}
                        className="flex items-center gap-3 p-3"
                      >
                        <PlayerAvatar
                          name={p.display_name}
                          avatarUrl={p.avatar_url}
                          isGhost={p.is_ghost}
                          size="sm"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p
                              className={`font-medium ${
                                isFuzzyMatch ? "opacity-90" : ""
                              }`}
                            >
                              {p.display_name}
                            </p>
                            {isFuzzyMatch && (
                              <span className="text-xs text-muted-foreground italic">
                                (similar)
                              </span>
                            )}
                            {p.is_ghost && <GhostPlayerBadge />}
                            <NewPlayerBadge
                              matchesPlayed={p.matches_played || 0}
                            />
                          </div>
                        </div>
                        <EloBadge
                          elo={p.elo_score}
                          category={(p.category_label as PlayerCategory) || undefined}
                          size="sm"
                        />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
            <div className="border-t p-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-secondary"
                onClick={() => {
                  setOpen(false);
                  onCreateGhost(position);
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Crear jugador invitado
              </Button>
            </div>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

