import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

const statusLabels: Record<string, string> = {
  aktif: "Aktif",
  izinli: "İzinli",
  transfer_asamasinda: "Transfer Aşamasında",
  ayrildi: "İşten Ayrıldı",
};

export default async function SitePersonnelPage({ params, searchParams }: PageProps) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || !userId) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", userId)
    .single();

  if (profileError || !profile || !profile.is_active) {
    redirect("/login?error=profile");
  }
  if (!["hr_manager", "master"].includes(profile.role)) notFound();

  // Resolve the selected site from the URL.
  const { slug } = await params;
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (siteError) {
    return <p role="alert" className="p-6 text-red-700">Saha bilgileri yüklenemedi. Lütfen sayfayı yenileyin.</p>;
  }
  if (!site) notFound();

  // Load 50 employees per page in a stable order.
  const { page: pageValue } = await searchParams;
  const parsedPage = typeof pageValue === "string" ? Number(pageValue) : 1;
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 && parsedPage <= 100000
    ? parsedPage : 1;
  const pageSize = 50;
  const start = (page - 1) * pageSize;
  const sitePath = `/insan-kaynaklari/sahalar/${encodeURIComponent(site.slug)}`;

  const { data: employees, error: employeesError, count } = await supabase
    .from("personnel")
    .select("id, employee_no, full_name, position, status", { count: "exact" })
    .eq("current_site_id", site.id)
    .neq("status", "ayrildi")
    .order("full_name")
    .order("id")
    .range(start, start + pageSize - 1);

  if (!employeesError && page > 1 && start >= (count ?? 0)) {
    redirect(sitePath);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <Link href="/insan-kaynaklari" className="text-sm font-medium text-[#0b68b2] hover:underline">
        ← Tüm sahalara dön
      </Link>
      <header className="mt-6">
        <p className="text-sm font-medium text-[#0b68b2]">İnsan Kaynakları / {site.name}</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Saha Personeli</h1>
        {!employeesError && (
          <p className="mt-2 text-sm text-slate-600">Mevcut personel: {count ?? 0}</p>
        )}
      </header>

      {employeesError ? (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          Personel listesi yüklenemedi. Lütfen sayfayı yenileyin.
        </p>
      ) : !employees?.length ? (
        <p className="mt-6 rounded-2xl border border-blue-100 bg-white p-6 text-sm text-slate-600">
          Bu sahada mevcut personel kaydı bulunmuyor.
        </p>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-blue-100 bg-white">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{site.name} mevcut personel listesi</caption>
              <thead className="bg-blue-50 text-[#064786]">
                <tr>
                  {["Personel No", "Ad Soyad", "Görevi", "Durum"].map((label) => (
                    <th key={label} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((employee) => (
                  <tr key={employee.id} className="text-slate-700">
                    <td className="px-4 py-4">{employee.employee_no || "—"}</td>
                    <td className="min-w-44 px-4 py-4 font-medium">{employee.full_name}</td>
                    <td className="px-4 py-4">{employee.position || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-4">{statusLabels[employee.status] ?? employee.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav aria-label="Personel sayfaları" className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            {page > 1 && <Link href={`${sitePath}?page=${page - 1}`} className="text-[#0b68b2] hover:underline">← Önceki</Link>}
            <span className="text-slate-600">Sayfa {page} / {Math.ceil((count ?? 0) / pageSize)}</span>
            {start + pageSize < (count ?? 0) && <Link href={`${sitePath}?page=${page + 1}`} className="text-[#0b68b2] hover:underline">Sonraki →</Link>}
          </nav>
        </>
      )}
    </div>
  );
}
