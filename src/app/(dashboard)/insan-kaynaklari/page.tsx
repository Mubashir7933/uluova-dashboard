import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HumanResourcesPage() {
  // Verify the signed-in user's identity.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || !userId) {
    redirect("/login");
  }

  // Load the current role and account status from the database.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role, is_active")
    .eq("id", userId)
    .single();

  if (profileError || !profile || !profile.is_active) {
    redirect("/login?error=profile");
  }

  // Protect this page even when its URL is entered directly.
  if (!["hr_manager", "master"].includes(profile.role)) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <header>
        <p className="text-sm font-medium text-[#0b68b2]">
          ULUOVA İnşaat A.Ş. / İnsan Kaynakları
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Genel Bakış
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Hoş geldiniz, {profile.full_name || "İnsan Kaynakları Sorumlusu"}.
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          İnsan Kaynakları Yönetimi
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Tüm sahaların personel kayıtları ve personel transfer talepleri
          bu bölümden yönetilecek.
        </p>

        <div className="mt-5 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-[#064786]">
          Personel kayıt ve transfer işlemleri henüz kullanıma açılmadı.
        </div>
      </section>
    </div>
  );
}