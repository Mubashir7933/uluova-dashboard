import { createClient } from "@/lib/supabase/server";
import { createAssignmentPdf } from "@/lib/pdf/temporary-assignment";
import { isUuid } from "../../fields";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const failure = (message: string, status: number) => Response.json(
  { error: message }, { status, headers: { "Cache-Control": "private, no-store" } }
);

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) return failure("Lütfen yeniden giriş yapın.", 401);
  const profile = await supabase.from("profiles").select("role, is_active").eq("id", userId).single();
  if (profile.error || !profile.data?.is_active || !["hr_manager", "master"].includes(profile.data.role)) {
    return failure("Bu işlem için yetkiniz bulunmuyor.", 403);
  }
  const { id } = await context.params;
  if (!isUuid(id)) return failure("Form bulunamadı.", 404);
  // The session client also enforces the existing table's RLS policies.
  const result = await supabase.from("temporary_assignment_forms").select("*").eq("id", id).maybeSingle();
  if (result.error) return failure("Form yüklenemedi.", 500);
  const record = result.data;
  if (!record) return failure("Form bulunamadı.", 404);
  const expectedVersion = new URL(request.url).searchParams.get("version");
  if (expectedVersion && expectedVersion !== record.updated_at) {
    return failure("Form başka bir oturumda değiştirildi. Sayfayı yenileyin.", 409);
  }
  if (record.template_key !== "tr_ur" || record.template_version !== 1) {
    return failure("Bu şablon sürümü henüz desteklenmiyor.", 422);
  }
  try {
    const bytes = await createAssignmentPdf(record);
    return new Response(new Uint8Array(bytes), { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="gecici-gorevlendirme-${id}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
} catch (error) {
    console.error("Temporary assignment PDF generation failed:", error);
    return failure("PDF oluşturulamadı. Lütfen tekrar deneyin.", 500);
  }
}
