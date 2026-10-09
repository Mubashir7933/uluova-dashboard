import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PersonnelForm } from "./personnel-form";

export default async function NewPersonnelPage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("role, is_active").eq("id", userId).single();
  if (profileError || !profile?.is_active) redirect("/login?error=profile");
  if (!["hr_manager", "master"].includes(profile.role)) notFound();

  const { slug } = await params;
  const { data: site, error: siteError } = await supabase
    .from("sites").select("id, name, slug").eq("slug", slug).maybeSingle();
  if (siteError) return <p role="alert" className="p-6 text-red-700">Saha bilgileri yüklenemedi. Lütfen sayfayı yenileyin.</p>;
  if (!site) notFound();

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <Link href={`/insan-kaynaklari/sahalar/${encodeURIComponent(site.slug)}`} className="text-sm font-medium text-[#0b68b2] hover:underline">← Personel listesine dön</Link>
      <p className="mt-6 text-sm font-medium text-[#0b68b2]">İnsan Kaynakları / {site.name}</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Yeni Personel Ekle</h1>
      <PersonnelForm siteSlug={site.slug} siteName={site.name} />
    </div>
  );
}
