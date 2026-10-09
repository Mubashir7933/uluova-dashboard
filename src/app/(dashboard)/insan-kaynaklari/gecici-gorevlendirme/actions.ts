"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assignmentFields, isUuid, type AssignmentValues } from "./fields";

export async function saveAssignment(
  personnelId: string,
  formId: string | null,
  expectedUpdatedAt: string | null,
  _previousState: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) redirect("/login");
  const { data: profile, error: profileError } = await supabase.from("profiles")
    .select("role, is_active").eq("id", userId).single();
  if (profileError || !profile?.is_active || !["hr_manager", "master"].includes(profile.role)) {
    return { error: "Bu işlem için yetkiniz yok veya profiliniz doğrulanamadı." };
  }
  if (!isUuid(personnelId) || (formId !== null && !isUuid(formId))) {
    return { error: "Geçersiz kayıt bilgisi." };
  }

  // Validate every field again on the server.
  const values = {} as AssignmentValues;
  for (const field of assignmentFields) {
    const raw = formData.get(field.key);
    const value = typeof raw === "string" ? raw.trim() : "";
    if (field.required && !value) return { error: `${field.label} alanını doldurun.` };
    if (value.length > field.max) return { error: `${field.label}: en fazla ${field.max} karakter kullanın.` };
    values[field.key] = value;
  }
  const validDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  if (!validDate(values.start_date) || (values.end_date && !validDate(values.end_date))) {
    return { error: "Geçerli başlangıç ve bitiş tarihleri girin." };
  }
  if (values.end_date && values.end_date < values.start_date) {
    return { error: "Bitiş tarihi başlangıç tarihinden önce olamaz." };
  }
  const payload = { ...values, end_date: values.end_date || null };
  let savedId: string;

  if (formId) {
    if (!expectedUpdatedAt) return { error: "Form sürümü doğrulanamadı. Sayfayı yenileyin." };
    // Match the loaded version to prevent overwriting another HR user's edits.
    const result = await supabase.from("temporary_assignment_forms")
      .update(payload).eq("id", formId).eq("personnel_id", personnelId)
      .eq("updated_at", expectedUpdatedAt).eq("template_key", "tr_ur").eq("template_version", 1)
      .select("id").maybeSingle();
    if (result.error) return { error: "Form güncellenemedi. Lütfen tekrar deneyin." };
    if (!result.data) return { error: "Form değişmiş veya artık erişilemiyor. Girdiğiniz bilgileri kopyalayıp sayfayı yenileyin." };
    savedId = result.data.id;
  } else {
    // The employee's origin comes from the database, never from the form inputs.
    const employeeResult = await supabase.from("personnel")
      .select("id, current_site_id, status").eq("id", personnelId).maybeSingle();
    const employee = employeeResult.data;
    if (employeeResult.error || !employee || employee.status === "ayrildi") {
      return { error: "Personel doğrulanamadı veya işten ayrılmış." };
    }
    const siteResult = await supabase.from("sites").select("id, name")
      .eq("id", employee.current_site_id).single();
    if (siteResult.error || !siteResult.data) return { error: "Gönderen saha doğrulanamadı." };
    const result = await supabase.from("temporary_assignment_forms").insert({
      ...payload,
      personnel_id: employee.id,
      from_site_id: siteResult.data.id,
      from_site_name: siteResult.data.name,
      template_key: "tr_ur",
      template_version: 1,
    }).select("id").single();
    if (result.error || !result.data) return { error: "Form kaydedilemedi. Personelin sahasını ve yetkilerinizi kontrol edin." };
    savedId = result.data.id;
  }
  revalidatePath("/insan-kaynaklari/gecici-gorevlendirme");
  redirect(`/insan-kaynaklari/gecici-gorevlendirme?form=${savedId}&saved=1`);
}
