"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PersonnelFormState = { error: string };

export async function createPersonnel(
  siteSlug: string,
  _previousState: PersonnelFormState,
  formData: FormData
): Promise<PersonnelFormState> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login");

  // Recheck authorization on every submission.
  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("role, is_active").eq("id", userId).single();
  if (profileError || !profile?.is_active || !["hr_manager", "master"].includes(profile.role)) {
    return { error: "Bu işlem için yetkiniz bulunmuyor veya profiliniz doğrulanamadı." };
  }

  const readText = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value.trim() : "";
  };
  const fullName = readText("fullName");
  const employeeNo = readText("employeeNo");
  const position = readText("position");
  if (!fullName) return { error: "Ad soyad alanını doldurun." };
  if (fullName.length > 150 || employeeNo.length > 50 || position.length > 100) {
    return { error: "Ad soyad en fazla 150, personel no 50, görev 100 karakter olabilir." };
  }

  // Resolve the site on the server instead of trusting a submitted site ID.
  const { data: site, error: siteError } = await supabase
    .from("sites").select("id, slug").eq("slug", siteSlug).maybeSingle();
  if (siteError || !site) return { error: "Saha doğrulanamadı. Lütfen tekrar deneyin." };

  const { error: insertError } = await supabase.from("personnel").insert({
    full_name: fullName,
    employee_no: employeeNo || null,
    position: position || null,
    current_site_id: site.id,
    status: "aktif",
  });
  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "Bu personel numarası zaten kayıtlı. Lütfen kontrol edin." };
    }
    console.error("Personnel creation failed", { code: insertError.code });
    return { error: "Personel kaydedilemedi. Lütfen tekrar deneyin." };
  }

  const sitePath = `/insan-kaynaklari/sahalar/${encodeURIComponent(site.slug)}`;
  revalidatePath("/insan-kaynaklari");
  revalidatePath(sitePath);
  redirect(`${sitePath}?success=created`);
}
