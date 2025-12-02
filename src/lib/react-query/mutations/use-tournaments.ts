"use client";

import { createClient } from "@/lib/supabase/client";
import type { TournamentInsert } from "@/types/database";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tournamentKeys } from "../hooks/use-tournaments";

interface CreateTournamentParams {
  clubId: string | null;
  name: string;
  slug: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  registrationDeadline: string | null;
  format: TournamentInsert["format"];
  maxTeams: number | null;
  minTeams: number;
  categoryLabel: TournamentInsert["category_label"];
  gender: TournamentInsert["gender"];
  entryFee: number | null;
  prizePool: string | null;
  rules: string | null;
}

async function createTournament(params: CreateTournamentParams) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const tournamentData: TournamentInsert = {
    club_id: params.clubId,
    name: params.name,
    slug: params.slug,
    description: params.description,
    start_date: params.startDate,
    end_date: params.endDate,
    registration_deadline: params.registrationDeadline,
    format: params.format,
    max_teams: params.maxTeams,
    min_teams: params.minTeams,
    category_label: params.categoryLabel,
    gender: params.gender,
    entry_fee: params.entryFee,
    prize_pool: params.prizePool,
    rules: params.rules,
    status: "draft",
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from("tournaments")
    .insert(tournamentData)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export function useCreateTournament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTournament,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tournamentKeys.all });
    },
  });
}

