import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FaultProcessForm } from "./components/fault-process-form";
import Link from "next/link";

type FaultPriority = "low" | "medium" | "high" | "critical";

type FaultStatus =
  | "open"
  | "in_progress"
  | "resolved";
  
type EquipmentFault = {
  id: number;
  site_id: number;
  equipment_code: string;
  title: string;
  description: string;
  priority: FaultPriority;
  status: FaultStatus;
  occurred_at: string;
  created_at: string;
  maintenance_note: string | null;
};

type Site = {
  id: number;
  name: string;
  slug: string;
};

const priorityLabels: Record<FaultPriority, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  critical: "Kritik",
};

const priorityStyles: Record<FaultPriority, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const statusLabels: Record<FaultStatus, string> = {
  open: "Açık",
  in_progress: "İşleme Alındı",
  resolved: "Çözüldü",
};

const statusStyles: Record<FaultStatus, string> = {
  open: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-emerald-100 text-emerald-800",
};

const statusOrder: FaultStatus[] = [
  "open",
  "in_progress",
  "resolved",
];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(date));
}
type MaintenancePageProps = {
  searchParams: Promise<{
    status?: string | string[];
    site?: string | string[];
  }>;
};

export default async function MaintenancePage({
  searchParams,
}: MaintenancePageProps) {
  const { status: requestedStatus, site: requestedSite } = await searchParams;

  const selectedStatus = statusOrder.find(
    (status) => status === requestedStatus
  );

  const visibleStatuses = selectedStatus
    ? [selectedStatus]
    : statusOrder;
  const supabase = await createClient();

  /*
   * 1. Giriş yapan kullanıcının kimliğini öğreniyoruz.
   */
  const { data: claimsData } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  /*
   * 2. Kullanıcının Bakım yöneticisi veya master
   *    olup olmadığını kontrol ediyoruz.
   */
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", userId)
    .single();

  if (
    !profile ||
    !["maintenance_manager", "master"].includes(profile.role)
  ) {
    redirect("/");
  }

  /*
   * 3. Bütün sahalardan gönderilmiş arıza
   *    kayıtlarını getiriyoruz.
   */
  const {
    data: faultsData,
    error: faultsError,
  } = await supabase
    .from("equipment_faults")
    .select(`
      id,
      site_id,
      equipment_code,
      title,
      description,
      priority,
      status,
      occurred_at,
      created_at,
      maintenance_note
    `)
    .order("created_at", { ascending: false });

  /*
   * 4. site_id değerlerini saha isimlerine
   *    çevirebilmek için sahaları getiriyoruz.
   */
  const {
    data: sitesData,
    error: sitesError,
  } = await supabase
    .from("sites")
    .select("id, name, slug");

  if (faultsError || sitesError) {
    console.error("Arıza sorgu hatası:", faultsError);
    console.error("Saha sorgu hatası:", sitesError);

    return (
      <div className="p-6 lg:p-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="font-semibold text-red-800">
            Arıza kayıtları yüklenemedi
          </h1>

          <p className="mt-2 text-sm text-red-700">
            Veritabanı sorgusu sırasında bir hata oluştu.
            Terminaldeki hata mesajını kontrol edin.
          </p>
        </div>
      </div>
    );
  }

  const faults = (faultsData ?? []) as EquipmentFault[];
  const sites = (sitesData ?? []) as Site[];

  const overviewSites = sites.filter(
    (site) => site.slug !== "yenikoy"
  );
  
  const overviewSiteIds = new Set(
    overviewSites.map((site) => site.id)
  );
  
  const overviewFaults = faults.filter(
    (fault) => overviewSiteIds.has(fault.site_id)
  );
  
  const selectedSite = overviewSites.find(
    (site) => String(site.id) === requestedSite
  );
  
  const visibleFaults = selectedSite
    ? faults.filter(
        (fault) => fault.site_id === selectedSite.id
      )
    : faults;
  
  const overviewCards = [
    {
      label: "Toplam Bildirim",
      count: overviewFaults.length,
      href: "/bakim?status=all",
      style: "bg-slate-100 text-slate-800",
    },
    ...statusOrder.map((status) => ({
      label: statusLabels[status],
      count: overviewFaults.filter(
        (fault) => fault.status === status
      ).length,
      href: `/bakim?status=${status}`,
      style: statusStyles[status],
    })),
  ];
  
  const siteSummaries = overviewSites.map((site) => {
    const siteFaults = overviewFaults.filter(
      (fault) => fault.site_id === site.id
    );
  
    return {
      ...site,
      total: siteFaults.length,
      counts: {
        open: siteFaults.filter(
          (fault) => fault.status === "open"
        ).length,
        in_progress: siteFaults.filter(
          (fault) => fault.status === "in_progress"
        ).length,
        resolved: siteFaults.filter(
          (fault) => fault.status === "resolved"
        ).length,
      },
    };
  });
  
  const showOverview = requestedStatus === undefined;

  /*
   * Map sayesinde site_id üzerinden hızlı şekilde
   * saha adını bulabiliriz.
   */
  const siteNames = new Map(
    sites.map((site) => [site.id, site.name])
  );
  if (showOverview) {
    return (
      <div className="p-6 lg:p-10">
        <p className="text-sm font-medium text-[#0b68b2]">
          ULUOVA İnşaat A.Ş.
        </p>
  
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Bakım Genel Bakış
        </h1>
  
        <p className="mt-2 text-sm text-slate-500">
          Sahaların arıza bildirimleri ve mevcut bakım durumu.
        </p>
  
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${card.style}`}
              >
                {card.label}
              </span>
  
              <p className="mt-4 text-3xl font-bold text-slate-900">
                {card.count}
              </p>
  
              <p className="mt-3 text-xs text-slate-500">
                Kayıtları görüntüle →
              </p>
            </Link>
          ))}
        </div>
  
        <section className="mt-8 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Sahalara Göre Arıza Özeti
              </h2>
  
              <p className="mt-1 text-sm text-slate-500">
                Detayları görmek için kayıt sayısına tıklayın.
              </p>
            </div>
  
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[#064786]">
              Tüm zamanlar
            </span>
          </div>
  
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th scope="col" className="px-5 py-4">
                    Saha
                  </th>
  
                  <th
                    scope="col"
                    className="px-5 py-4 text-center"
                  >
                    Toplam Bildirim
                  </th>
  
                  {statusOrder.map((status) => (
                    <th
                      key={status}
                      scope="col"
                      className="px-5 py-4 text-center"
                    >
                      {statusLabels[status]}
                    </th>
                  ))}
                </tr>
              </thead>
  
              <tbody className="divide-y divide-slate-100">
                {siteSummaries.map((site) => (
                  <tr
                    key={site.id}
                    className="hover:bg-slate-50"
                  >
                    <th
                      scope="row"
                      className="px-5 py-4 font-semibold text-slate-900"
                    >
                      {site.name}
                    </th>
  
                    <td className="px-5 py-4 text-center">
                      <Link
                        href={`/bakim?status=all&site=${site.id}`}
                        aria-label={`${site.name}: tüm arıza bildirimlerini görüntüle`}
                        className="inline-block rounded-lg px-3 py-2 font-semibold text-[#064786] hover:bg-blue-50"
                      >
                        {site.total}
                      </Link>
                    </td>
  
                    {statusOrder.map((status) => (
                      <td
                        key={status}
                        className="px-5 py-4 text-center"
                      >
                        <Link
                          href={`/bakim?status=${status}&site=${site.id}`}
                          aria-label={`${site.name}: ${statusLabels[status]} arızaları görüntüle`}
                          className={`inline-block min-w-10 rounded-lg px-3 py-2 font-semibold ${statusStyles[status]} hover:underline`}
                        >
                          {site.counts[status]}
                        </Link>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
  
          {siteSummaries.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-slate-500">
              Gösterilecek saha bulunamadı.
            </p>
          )}
        </section>
      </div>
    );
  }
  return (
    <div className="p-6 lg:p-10">
      <div>
        <p className="text-sm font-medium text-[#0b68b2]">
          ULUOVA İnşaat A.Ş.
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
        {selectedSite
  ? `${selectedSite.name} — Arıza Bildirimleri`
  : "Bakım Yönetimi"}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Tüm sahalardan gönderilen ekipman arızalarını yönetin.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-blue-100 bg-white px-5 py-4 shadow-sm">
        <p className="text-sm text-slate-500">
          Giriş yapan kullanıcı
        </p>

        <p className="mt-1 font-semibold text-slate-900">
          {profile.full_name}
        </p>
      </div>

      <section className="mt-8">
  <div>
    <h2 className="text-xl font-semibold text-slate-900">
      Arıza Bildirimleri
    </h2>

    <p className="mt-1 text-sm text-slate-500">
    {selectedStatus
  ? `${statusLabels[selectedStatus]}: ${
      visibleFaults.filter(
        (fault) => fault.status === selectedStatus
      ).length
    } arıza kaydı`
  : `Toplam ${faults.length} arıza kaydı`}
    </p>
  </div>

  <div className="mt-6 space-y-8">
    {visibleStatuses.map((status) => {
     const groupedFaults = visibleFaults.filter(
      (fault) => fault.status === status
    );

      return (
        <section
          key={status}
          aria-labelledby={`fault-group-${status}`}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
            <h3
              id={`fault-group-${status}`}
              className="font-semibold text-slate-900"
            >
              {statusLabels[status]}
            </h3>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
            >
              {groupedFaults.length} kayıt
            </span>
          </div>

          {groupedFaults.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">
              Bu durumda arıza kaydı bulunmuyor.
            </p>
          ) : (
            <div className="grid gap-4 p-4 sm:p-5">
              {groupedFaults.map((fault) => {
                const siteName =
                  siteNames.get(fault.site_id) ??
                  `Saha #${fault.site_id}`;

                return (
                  <article
                    key={fault.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#064786]">
                            {siteName}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityStyles[fault.priority]}`}
                          >
                            {priorityLabels[fault.priority]}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[fault.status]}`}
                          >
                            {statusLabels[fault.status]}
                          </span>
                        </div>

                        <h4 className="mt-4 text-lg font-semibold text-slate-900">
                          {fault.title}
                        </h4>

                        <p className="mt-1 text-sm font-medium text-slate-600">
                          Ekipman: {fault.equipment_code}
                        </p>
                      </div>

                      <div className="text-sm text-slate-500">
                        <p>Arıza zamanı</p>

                        <p className="mt-1 font-medium text-slate-700">
                          {formatDate(fault.occurred_at)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-5 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">
                      {fault.description}
                    </p>

                    {fault.maintenance_note && (
                      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#064786]">
                          Bakım açıklaması
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {fault.maintenance_note}
                        </p>
                      </div>
                    )}

                    <FaultProcessForm
                      faultId={fault.id}
                      currentStatus={fault.status}
                      currentNote={fault.maintenance_note}
                    />

                    <p className="mt-4 text-xs text-slate-500">
                      Bildirim oluşturulma zamanı:{" "}
                      {formatDate(fault.created_at)}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      );
    })}
  </div>
</section>
    </div>
  );
}