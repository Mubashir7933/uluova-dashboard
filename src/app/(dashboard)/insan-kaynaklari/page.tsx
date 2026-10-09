import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";


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

    // Read every permitted site, including Yeniköy and inactive sites.
    const { data: sites, error: sitesError } = await supabase
    .from("sites")
    .select("id, name, is_active, slug")
    .order("name");

  // Count current personnel without downloading employee records.
  const siteSummaries = await Promise.all(
    (sites ?? []).map(async (site) => {
      const { count, error: countError } = await supabase
        .from("personnel")
        .select("id", { count: "exact", head: true })
        .eq("current_site_id", site.id)
        .neq("status", "ayrildi");

      return {
        ...site,
        personnelCount: countError ? null : count,
      };
    })
  );

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

      <section className="mt-8" aria-labelledby="sites-heading">
        <h2
          id="sites-heading"
          className="text-lg font-semibold text-slate-900"
        >
          Sahalar
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Güncel saha atamalarına göre personel dağılımı. İşten ayrılanlar
          sayılara dahil değildir.
        </p>

        {sitesError ? (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            Saha bilgileri yüklenemedi. Lütfen sayfayı yenileyin.
          </p>
        ) : siteSummaries.length === 0 ? (
          <p className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-600">
            Görüntülenebilen saha bulunamadı.
          </p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {siteSummaries.map((site) => (
             <Link
             key={site.id}
             href={`/insan-kaynaklari/sahalar/${encodeURIComponent(site.slug)}`}
             className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-blue-600"
           >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-[#064786]">
                    {site.name}
                  </h3>

                  {!site.is_active && (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      Pasif saha
                    </span>
                  )}
                </div>

                {site.personnelCount === null ? (
                  <p role="alert" className="mt-4 text-sm text-red-700">
                    Personel sayısı yüklenemedi.
                  </p>
                ) : (
                  <>
                    <p className="mt-4 text-3xl font-bold text-slate-900">
                      {site.personnelCount}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Mevcut personel
                    </p>

                    {site.personnelCount === 0 && (
                      <p className="mt-3 text-sm text-slate-500">
                        Bu sahada mevcut personel kaydı bulunmuyor.
                      </p>
                    )}
                  </>
                )}
               <p className="mt-4 text-sm font-semibold text-[#0b68b2]">
    Personelleri görüntüle →
  </p>
</Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}