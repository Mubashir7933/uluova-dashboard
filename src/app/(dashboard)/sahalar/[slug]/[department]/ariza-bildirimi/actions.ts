"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { requireSiteAccess } from "@/lib/auth/require-site-access";

const allowedPriorities = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

type FaultPriority =
  (typeof allowedPriorities)[number];

export async function createEquipmentFault(
  siteSlug: string,
  departmentSlug: string,
  formData: FormData
) {
  if (departmentSlug !== "bakim") {
    notFound();
  }

  const { supabase, site } =
    await requireSiteAccess(siteSlug);

  const equipmentCode = String(
    formData.get("equipmentCode") ?? ""
  ).trim();

  const title = String(
    formData.get("title") ?? ""
  ).trim();

  const description = String(
    formData.get("description") ?? ""
  ).trim();

  const priority = String(
    formData.get("priority") ?? ""
  ) as FaultPriority;

  const occurredAtValue = String(
    formData.get("occurredAt") ?? ""
  );

  const formPath =
    `/sahalar/${site.slug}/bakim/ariza-bildirimi`;

  if (
    !equipmentCode ||
    !title ||
    !description ||
    !occurredAtValue
  ) {
    redirect(`${formPath}?error=missing`);
  }

  if (
    equipmentCode.length > 50 ||
    title.length > 150 ||
    description.length > 2000
  ) {
    redirect(`${formPath}?error=length`);
  }

  if (!allowedPriorities.includes(priority)) {
    redirect(`${formPath}?error=priority`);
  }

  /*
   * datetime-local does not include a timezone.
   * ULUOVA sites operate in Türkiye time: UTC+03:00.
   */
  const occurredAt = new Date(
    `${occurredAtValue}:00+03:00`
  );

  if (Number.isNaN(occurredAt.getTime())) {
    redirect(`${formPath}?error=date`);
  }

  const { error } = await supabase
    .from("equipment_faults")
    .insert({
      site_id: site.id,
      equipment_code: equipmentCode,
      title,
      description,
      priority,
      occurred_at: occurredAt.toISOString(),
    });

  if (error) {
    console.error(
      "Equipment fault insert failed:",
      error
    );

    redirect(`${formPath}?error=database`);
  }

  revalidatePath(formPath);
  revalidatePath("/bakim");

  redirect(`${formPath}?success=created`);
}