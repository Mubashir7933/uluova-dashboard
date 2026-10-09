import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AssignmentForm } from "@/app/(dashboard)/insan-kaynaklari/gecici-gorevlendirme/assignment-form";
import { assignmentFields, isUuid, type AssignmentValues } from "@/app/(dashboard)/insan-kaynaklari/gecici-gorevlendirme/fields";

type Props = {
  searchParams: Promise<{ personnel?: string | string[]; form?: string | string[]; saved?: string | string[] }>;
};
const showError = (message: string) => (
  <div className="p-6"><Link href="/insan-kaynaklari" className="text-blue-700">← Genel Bakış</Link>
    <p role="alert" className="mt-4 text-red-700">{message}</p></div>
);

export default async function AssignmentPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) redirect("/login");
  const profileResult = await supabase.from("profiles").select("role, is_active").eq("id", userId).single();
  if (profileResult.error || !profileResult.data?.is_active) redirect("/login?error=profile");
  if (!["hr_manager", "master"].includes(profileResult.data.role)) notFound();

  const query = await searchParams;
  const formId = typeof query.form === "string" ? query.form : null;
  if (query.form !== undefined && (!formId || !isUuid(formId))) notFound();
  const savedResult = formId
    ? await supabase.from("temporary_assignment_forms").select("*").eq("id", formId).maybeSingle()
    : null;
  if (savedResult?.error) return showError("Form yüklenemedi. Lütfen sayfayı yenileyin.");
  const savedForm = savedResult?.data;
  if (formId && !savedForm) notFound();
  if (savedForm && (savedForm.template_key !== "tr_ur" || savedForm.template_version !== 1)) {
    return showError("Bu şablon sürümü henüz desteklenmiyor.");
  }

  const personnelId = savedForm?.personnel_id ?? (typeof query.personnel === "string" ? query.personnel : "");
  if (!isUuid(personnelId)) notFound();
  const employeeResult = await supabase.from("personnel")
    .select("id, full_name, position, current_site_id, status").eq("id", personnelId).maybeSingle();
  if (employeeResult.error) return showError("Personel bilgileri yüklenemedi.");
  const employee = employeeResult.data;
  if (!employee) notFound();
  if (!savedForm && employee.status === "ayrildi") return showError("İşten ayrılan personel için yeni form oluşturulamaz.");

  const siteResult = await supabase.from("sites").select("name, slug")
    .eq("id", savedForm?.from_site_id ?? employee.current_site_id).single();
  if (siteResult.error || !siteResult.data) return showError("Saha bilgileri yüklenemedi.");
  const site = siteResult.data;
  const initialValues = Object.fromEntries(assignmentFields.map((field) => [field.key, savedForm?.[field.key] ?? ""])) as AssignmentValues;
  if (!savedForm) {
    initialValues.employee_full_name = employee.full_name;
    initialValues.employee_position = employee.position ?? "";
  }

  const history = await supabase.from("temporary_assignment_forms")
    .select("id, destination_name, start_date").eq("personnel_id", personnelId)
    .order("created_at", { ascending: false }).order("id").limit(20);
  const basePath = "/insan-kaynaklari/gecici-gorevlendirme";
  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <Link href={`/insan-kaynaklari/sahalar/${encodeURIComponent(site.slug)}`} className="text-sm text-[#0b68b2] hover:underline">← Saha personeline dön</Link>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">Geçici Görevlendirme Formu</h1>
      <p className="mt-2 text-sm text-slate-600">{employee.full_name} — {savedForm ? "Kayıtlı taslağı düzenle" : "Yeni taslak"}</p>
      {query.saved === "1" && savedForm && <p role="status" className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-800">Form kaydedildi.</p>}
      <AssignmentForm
        key={savedForm ? `${savedForm.id}:${savedForm.updated_at}` : employee.id}
        personnelId={personnelId} formId={formId} updatedAt={savedForm?.updated_at ?? null}
        initialValues={initialValues} origin={savedForm?.from_site_name ?? site.name}
      />
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Bu Personelin Son 20 Formu</h2>
        {savedForm && employee.status !== "ayrildi" && <Link href={`${basePath}?personnel=${personnelId}`} className="mt-3 inline-block text-sm text-[#0b68b2] hover:underline">Yeni görevlendirme formu oluştur</Link>}
        {history.error ? <p role="alert" className="mt-3 text-sm text-red-700">Form geçmişi yüklenemedi.</p>
          : !history.data?.length ? <p className="mt-3 text-sm text-slate-500">Henüz kayıtlı form yok.</p>
          : <ul className="mt-3 space-y-2">{history.data.map((item) => (
            <li key={item.id}><Link href={`${basePath}?form=${item.id}`} className="block rounded-xl border border-blue-100 bg-white p-4 text-sm text-[#064786] hover:bg-blue-50">
              {item.start_date.split("-").reverse().join(".")} — {item.destination_name} — Düzenle
            </Link></li>
          ))}</ul>}
      </section>
    </div>
  );
}
