import Link from "next/link";
import { notFound } from "next/navigation";
import { departments } from "@/data/departments";
import { getSiteBySlug, sites } from "@/data/sites";
import { requireSiteAccess } from "@/lib/auth/require-site-access";

type SitePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return sites.map((site) => ({
    slug: site.slug,
  }));
}

export default async function SitePage({
  params,
}: SitePageProps) {
  const { slug } = await params;
  await requireSiteAccess(slug);
  const site = getSiteBySlug(slug);

  if (!site) {
    notFound();
  }

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <p className="text-sm font-medium text-[#0b68b2]">
          ULUOVA İnşaat A.Ş. / Sahalar
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          {site.name}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          İşlem yapmak istediğiniz birimi seçin.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">
          Birimler
        </h2>

        <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {departments.map((department) => (
            <Link
              key={department.slug}
              href={`/sahalar/${site.slug}/${department.slug}`}
              className="group rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-[#064786]">
                {department.name.charAt(0)}
              </div>

              <h3 className="mt-5 text-base font-semibold text-slate-900 group-hover:text-[#064786]">
                {department.name}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {department.description}
              </p>

              <p className="mt-5 text-sm font-semibold text-[#0b68b2]">
                Birime git →
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}