"use client";

import { createClient } from "@/lib/supabase/client";
import type { TournamentSummary } from "@/types/database";
import { useQuery } from "@tanstack/react-query";
import { QUERY_STALE_TIME } from "@/lib/constants";

export const tournamentKeys = {
  all: ["tournaments"] as const,
  lists: () => [...tournamentKeys.all, "list"] as const,
  list: (filters: string) => [...tournamentKeys.lists(), { filters }] as const,
  details: () => [...tournamentKeys.all, "detail"] as const,
  detail: (id: string) => [...tournamentKeys.details(), id] as const,
  byClub: (clubId: string) =>
    [...tournamentKeys.all, "by-club", clubId] as const,
};

async function fetchTournaments(): Promise<TournamentSummary[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("tournament_summary")
    .select("*")
    .in("status", ["open", "in_progress"])
    .order("start_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

async function fetchTournament(id: string): Promise<TournamentSummary | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("tournament_summary")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(error.message);
  }

  return data;
}

async function fetchTournamentsByClub(
  clubId: string
): Promise<TournamentSummary[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("tournament_summary")
    .select("*")
    .eq("club_id", clubId)
    .order("start_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export function useTournaments() {
  return useQuery({
    queryKey: tournamentKeys.lists(),
    queryFn: fetchTournaments,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useTournament(id: string) {
  return useQuery({
    queryKey: tournamentKeys.detail(id),
    queryFn: () => fetchTournament(id),
    staleTime: QUERY_STALE_TIME,
    enabled: Boolean(id),
  });
}

export function useTournamentsByClub(clubId: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.byClub(clubId || ""),
    queryFn: () => fetchTournamentsByClub(clubId!),
    staleTime: QUERY_STALE_TIME,
    enabled: Boolean(clubId),
  });
}

