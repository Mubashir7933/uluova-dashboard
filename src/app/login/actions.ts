"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError || !authData.user) {
    redirect("/login?error=invalid");
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("role, site_id, is_active")
      .eq("id", authData.user.id)
      .single();

  if (profileError || !profile || !profile.is_active) {
    await supabase.auth.signOut();
    redirect("/login?error=profile");
  }

  if (profile.role === "site_chief") {
    const { data: site, error: siteError } =
      await supabase
        .from("sites")
        .select("slug")
        .eq("id", profile.site_id)
        .single();

    if (siteError || !site) {
      await supabase.auth.signOut();
      redirect("/login?error=site");
    }

    redirect(`/sahalar/${site.slug}`);
  }

  if (profile.role === "maintenance_manager") {
    redirect("/bakim");
  }

  if (profile.role === "hr_manager") {
    redirect("/insan-kaynaklari");
  }

  if (profile.role === "safety_manager") {
    redirect("/isg");
  }

  if (profile.role === "master") {
    redirect("/");
  }

  await supabase.auth.signOut();
  redirect("/login?error=role");
}