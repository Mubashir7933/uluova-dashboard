import Link from "next/link";
import { notFound } from "next/navigation";
import {
  departments,
  getDepartmentBySlug,
} from "@/data/departments";
import {
  getSiteBySlug,
  sites,
} from "@/data/sites";
import { requireSiteAccess } from "@/lib/auth/require-site-access";

type DepartmentPageProps = {
  params: Promise<{
    slug: string;
    department: string;
  }>;
};

export function generateStaticParams() {
  return sites.flatMap((site) =>
    departments.map((department) => ({
      slug: site.slug,
      department: department.slug,
    }))
  );
}

export default async function DepartmentPage({
  params,
}: DepartmentPageProps) {
  const { slug, department: departmentSlug } =
    await params;

  await requireSiteAccess(slug);

  const site = getSiteBySlug(slug);
  const department =
    getDepartmentBySlug(departmentSlug);

  if (!site || !department) {
    notFound();
  }

  return (
    <div className="p-6 lg:p-10">
      <Link
        href={`/sahalar/${site.slug}`}
        className="text-sm font-medium text-[#0b68b2] hover:underline"
      >
        ← {site.name} birimlerine dön
      </Link>

      <div className="mt-6">
        <p className="text-sm font-medium text-[#0b68b2]">
          {site.name}
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          {department.name}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {department.description}
        </p>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">
          İşlemler
        </h2>

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {department.operations.map((operation) => {
            const isEquipmentFault =
              department.slug === "bakim" &&
              operation === "Ekipman Arıza Bildirimi";

            return (
              <article
                key={operation}
                className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-[#064786]">
                  {operation.charAt(0)}
                </div>

                <h3 className="mt-5 font-semibold text-slate-900">
                  {operation}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Yeni kayıt oluşturmak ve mevcut kayıtları
                  görüntülemek için bu alanı kullanabilirsiniz.
                </p>

                {isEquipmentFault ? (
                  <Link
                    href={`/sahalar/${site.slug}/${department.slug}/ariza-bildirimi`}
                    className="mt-5 inline-block rounded-lg bg-[#064786] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#053b70]"
                  >
                    Yeni Bildirim Oluştur
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="mt-5 cursor-not-allowed rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400"
                  >
                    Sonraki adımlarda oluşturulacak
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}