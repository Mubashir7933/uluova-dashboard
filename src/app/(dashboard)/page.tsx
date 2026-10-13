import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Site = {
  id: number;
  name: string;
  slug: string;
};

type ActiveFault = {
  id: string;
  site_id: number;
  equipment_code: string | null;
  title: string;
  priority: string;
  status: string;
  created_at: string;
};

export default async function Home() {
  const supabase = await createClient();

  // Verify the signed-in user and master profile.
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", userId)
    .single();

  if (profileError || !profile || !profile.is_active) {
    redirect("/login?error=profile");
  }

  if (profile.role !== "master") {
    notFound();
  }

  // Load active operational sites, excluding the repair facility.
  const { data: siteData, error: sitesError } = await supabase
    .from("sites")
    .select("id, name, slug")
    .eq("is_active", true)
    .neq("slug", "yenikoy")
    .order("id");

  if (sitesError) {
    throw new Error("Failed to load overview sites.");
  }

  const sites: Site[] = siteData ?? [];
  const siteIds = sites.map((site) => site.id);
  const siteNames = new Map(sites.map((site) => [site.id, site.name]));

  // Fetch active faults in pages to avoid the default response row limit.
  const faults: ActiveFault[] = [];
  const pageSize = 1000;

  if (siteIds.length > 0) {
    let offset = 0;

    while (true) {
      const { data, error } = await supabase
        .from("equipment_faults")
        .select(
          "id, site_id, equipment_code, title, priority, status, created_at"
        )
        .in("site_id", siteIds)
        .in("status", ["open", "in_progress"])
        .order("id")
        .range(offset, offset + pageSize - 1);

      if (error) {
        throw new Error("Failed to load overview faults.");
      }

      const batch = (data ?? []) as ActiveFault[];
      faults.push(...batch);

      if (batch.length < pageSize) {
        break;
      }

      offset += pageSize;
    }
  }

  const openCount = faults.filter((fault) => fault.status === "open").length;
  const inProgressCount = faults.filter(
    (fault) => fault.status === "in_progress"
  ).length;
  const criticalCount = faults.filter(
    (fault) => fault.priority === "critical"
  ).length;

  const siteCounts = new Map<
    number,
    { open: number; inProgress: number }
  >();

  for (const site of sites) {
    siteCounts.set(site.id, { open: 0, inProgress: 0 });
  }

  for (const fault of faults) {
    const counts = siteCounts.get(fault.site_id);

    if (counts) {
      if (fault.status === "open") {
        counts.open += 1;
      } else {
        counts.inProgress += 1;
      }
    }
  }

  const priorityFaults = faults
    .filter(
      (fault) =>
        fault.priority === "critical" || fault.priority === "high"
    )
    .sort((a, b) => {
      const priorityDifference =
        Number(b.priority === "critical") -
        Number(a.priority === "critical");

      return (
        priorityDifference ||
        new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
    })
    .slice(0, 8);

  const summaryCards = [
    {
      label: "Açık Arızalar",
      count: openCount,
      href: "/bakim?status=open",
    },
    {
      label: "İşleme Alınan Arızalar",
      count: inProgressCount,
      href: "/bakim?status=in_progress",
    },
    {
      label: "Kritik Öncelikli Aktif Arızalar",
      count: criticalCount,
      href: "/bakim?status=all",
    },
  ];

  return (
    <div className="min-h-full bg-[#f5f8fc] p-4 sm:p-6 lg:p-10">
      <p className="text-sm font-medium text-[#0b68b2]">
        ULUOVA İnşaat A.Ş.
      </p>

      <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
        Genel Bakış
      </h1>

      <p className="mt-2 text-sm text-slate-500">
        Sahalar genelinde aktif arızalar ve operasyon durumu
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-blue-100 bg-white p-5
              transition hover:border-blue-300 hover:shadow-sm"
          >
            <p className="text-sm font-medium text-slate-600">
              {card.label}
            </p>
            <p className="mt-3 text-3xl font-bold text-[#064786]">
              {card.count}
            </p>
            <p className="mt-3 text-xs text-[#0b68b2]">
              Bakım ekranını aç →
            </p>
          </Link>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">
          Saha Durumu
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Tüm zamanlardaki aktif arızalar. Yeniköy sayımlara dahil değildir.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sites.map((site) => {
            const counts = siteCounts.get(site.id)!;

            return (
              <div
                key={site.id}
                className="rounded-2xl border border-blue-100 bg-white p-5"
              >
                <Link
                  href={`/sahalar/${site.slug}`}
                  className="font-semibold text-[#064786] hover:underline"
                >
                  {site.name}
                </Link>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Link
                    href={`/bakim?status=open&site=${site.id}`}
                    className="rounded-xl bg-blue-50 p-3 hover:bg-blue-100"
                  >
                    <p className="text-xs text-slate-600">Açık</p>
                    <p className="mt-1 text-xl font-bold text-[#064786]">
                      {counts.open}
                    </p>
                  </Link>

                  <Link
                    href={`/bakim?status=in_progress&site=${site.id}`}
                    className="rounded-xl bg-amber-50 p-3 hover:bg-amber-100"
                  >
                    <p className="text-xs text-slate-600">
                      İşleme Alındı
                    </p>
                    <p className="mt-1 text-xl font-bold text-amber-800">
                      {counts.inProgress}
                    </p>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {sites.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">
            Görüntülenebilecek aktif saha bulunamadı.
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">
          Öncelikli Arızalar
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Kritik öncelikli arızalar önce gösterilir. En fazla 8 kayıt listelenir.
        </p>

        <div className="mt-4 space-y-3">
          {priorityFaults.map((fault) => (
            <Link
              key={fault.id}
              href={`/bakim?status=${fault.status}&site=${fault.site_id}`}
              className="block rounded-2xl border border-blue-100
                bg-white p-4 transition hover:border-blue-300"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    fault.priority === "critical"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {fault.priority === "critical" ? "Kritik" : "Yüksek"}
                </span>

                <span className="text-xs text-slate-500">
                  {fault.status === "open" ? "Açık" : "İşleme Alındı"}
                </span>
              </div>

              <p className="mt-2 break-words font-semibold text-slate-900">
                {fault.title}
              </p>

              <p className="mt-1 break-words text-sm text-slate-500">
                {siteNames.get(fault.site_id)} ·{" "}
                {fault.equipment_code || "Ekipman kodu belirtilmedi"} ·{" "}
                {new Intl.DateTimeFormat("tr-TR", {
                  timeZone: "Europe/Istanbul",
                }).format(new Date(fault.created_at))}
              </p>
            </Link>
          ))}

          {priorityFaults.length === 0 && (
            <div className="rounded-2xl border border-blue-100 bg-white p-5">
              <p className="text-sm text-slate-500">
                Kritik veya yüksek öncelikli aktif arıza bulunmuyor.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">
          Merkezi Birimler
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            { label: "Bakım", href: "/bakim" },
            { label: "İnsan Kaynakları", href: "/insan-kaynaklari" },
          ].map((department) => (
            <Link
              key={department.href}
              href={department.href}
              className="rounded-2xl border border-blue-100 bg-white
                p-5 font-semibold text-[#064786]
                transition hover:border-blue-300"
            >
              {department.label} →
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}