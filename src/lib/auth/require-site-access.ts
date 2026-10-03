import "server-only";

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type AllowedSiteRole = "master" | "site_chief";

export async function requireSiteAccess(siteSlug: string) {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login");
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("id, full_name, role, site_id, is_active")
      .eq("id", userId)
      .single();

  if (
    profileError ||
    !profile ||
    !profile.is_active
  ) {
    redirect("/login?error=profile");
  }

  const role = profile.role as AllowedSiteRole;

  if (!["master", "site_chief"].includes(role)) {
    notFound();
  }

  const { data: site, error: siteError } =
    await supabase
      .from("sites")
      .select("id, name, slug")
      .eq("slug", siteSlug)
      .single();

  if (siteError || !site) {
    notFound();
  }

  if (
    role === "site_chief" &&
    profile.site_id !== site.id
  ) {
    notFound();
  }

  return {
    supabase,
    profile,
    site,
  };
}