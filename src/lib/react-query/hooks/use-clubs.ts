"use client";

import { createClient } from "@/lib/supabase/client";
import type { ClubSummary } from "@/types/database";
import { useQuery } from "@tanstack/react-query";
import { QUERY_STALE_TIME } from "@/lib/constants";

export const clubKeys = {
  all: ["clubs"] as const,
  lists: () => [...clubKeys.all, "list"] as const,
  list: (filters: string) => [...clubKeys.lists(), { filters }] as const,
  details: () => [...clubKeys.all, "detail"] as const,
  detail: (slug: string) => [...clubKeys.details(), slug] as const,
  myClubs: (userId: string) => [...clubKeys.all, "my-clubs", userId] as const,
};

async function fetchClubs(): Promise<ClubSummary[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("club_summary")
    .select("*")
    .order("member_count", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

async function fetchClub(slug: string): Promise<ClubSummary | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("club_summary")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(error.message);
  }

  return data;
}

async function fetchMyClubs(userId: string): Promise<ClubSummary[]> {
  const supabase = createClient();

  // Get clubs where user is a member
  const { data: memberships, error: membershipError } = await supabase
    .from("club_memberships")
    .select("club_id")
    .eq("profile_id", userId)
    .eq("is_active", true);

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  if (!memberships || memberships.length === 0) {
    return [];
  }

  const clubIds = memberships.map((m) => m.club_id);

  const { data: clubs, error: clubsError } = await supabase
    .from("club_summary")
    .select("*")
    .in("id", clubIds)
    .order("name");

  if (clubsError) {
    throw new Error(clubsError.message);
  }

  return clubs || [];
}

export function useClubs() {
  return useQuery({
    queryKey: clubKeys.lists(),
    queryFn: fetchClubs,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useClub(slug: string) {
  return useQuery({
    queryKey: clubKeys.detail(slug),
    queryFn: () => fetchClub(slug),
    staleTime: QUERY_STALE_TIME,
    enabled: Boolean(slug),
  });
}

export function useMyClubs(userId: string | undefined) {
  return useQuery({
    queryKey: clubKeys.myClubs(userId || ""),
    queryFn: () => fetchMyClubs(userId!),
    staleTime: QUERY_STALE_TIME,
    enabled: Boolean(userId),
  });
}

async function fetchMyClubAsOwner(userId: string): Promise<ClubSummary | null> {
  const supabase = createClient();

  // Get club where user is owner
  const { data: membership, error: membershipError } = await supabase
    .from("club_memberships")
    .select("club_id")
    .eq("profile_id", userId)
    .eq("role", "owner")
    .eq("is_active", true)
    .single();

  if (membershipError || !membership) {
    return null;
  }

  const { data: club, error: clubError } = await supabase
    .from("club_summary")
    .select("*")
    .eq("id", membership.club_id)
    .single();

  if (clubError) {
    throw new Error(clubError.message);
  }

  return club;
}

export function useMyClubAsOwner(userId: string | undefined) {
  return useQuery({
    queryKey: [...clubKeys.all, "my-club-as-owner", userId || ""],
    queryFn: () => fetchMyClubAsOwner(userId!),
    staleTime: QUERY_STALE_TIME,
    enabled: Boolean(userId),
  });
}

