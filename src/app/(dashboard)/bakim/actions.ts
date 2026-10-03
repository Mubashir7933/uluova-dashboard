"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ProcessStatus = "in_progress" | "resolved";

const allowedStatuses: ProcessStatus[] = [
  "in_progress",
  "resolved",
];

export async function updateEquipmentFault(
  formData: FormData
) {
  const supabase = await createClient();

  /*
   * Formdan gelen değerleri okuyoruz.
   */
  const faultId = Number(formData.get("faultId"));
  const status = String(
    formData.get("status") ?? ""
  ) as ProcessStatus;

  const maintenanceNote = String(
    formData.get("maintenanceNote") ?? ""
  ).trim();

  /*
   * Temel veri doğrulaması.
   */
  if (!Number.isInteger(faultId) || faultId <= 0) {
    throw new Error("Geçersiz arıza kaydı.");
  }

  if (!allowedStatuses.includes(status)) {
    throw new Error("Geçersiz arıza durumu.");
  }

  if (maintenanceNote.length > 2000) {
    throw new Error(
      "Bakım notu 2000 karakterden uzun olamaz."
    );
  }

  /*
   * Giriş yapan kullanıcıyı öğreniyoruz.
   */
  const { data: claimsData } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  /*
   * Kullanıcının Bakım yöneticisi veya master
   * olduğunu sunucu tarafında kontrol ediyoruz.
   */
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", userId)
    .single();

  if (
    !profile ||
    !profile.is_active ||
    !["maintenance_manager", "master"].includes(
      profile.role
    )
  ) {
    throw new Error(
      "Bu işlem için yetkiniz bulunmamaktadır."
    );
  }

  const currentTime = new Date().toISOString();

  /*
   * Arıza kaydını güncelliyoruz.
   */
  const { error } = await supabase
    .from("equipment_faults")
    .update({
      status,
      maintenance_note: maintenanceNote || null,
      processed_by: userId,
      processed_at: currentTime,
      updated_at: currentTime,
    })
    .eq("id", faultId);

  if (error) {
    console.error(
      "Arıza güncelleme hatası:",
      error
    );

    throw new Error(
      "Arıza kaydı güncellenemedi."
    );
  }

  /*
   * Bakım sayfasındaki verileri tekrar getiriyoruz.
   */
  revalidatePath("/bakim");
  redirect("/bakim");

}