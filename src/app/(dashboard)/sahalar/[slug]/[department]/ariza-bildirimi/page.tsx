import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSiteAccess } from "@/lib/auth/require-site-access";
import { createEquipmentFault } from "./actions";

type FaultFormPageProps = {
  params: Promise<{
    slug: string;
    department: string;
  }>;

  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  missing: "Lütfen bütün zorunlu alanları doldurun.",
  length: "Girilen bilgiler izin verilen uzunluğu aşıyor.",
  priority: "Geçerli bir öncelik seviyesi seçin.",
  date: "Geçerli bir arıza tarihi ve saati seçin.",
  database: "Bildirim kaydedilemedi. Lütfen tekrar deneyin.",
};

export default async function FaultFormPage({
  params,
  searchParams,
}: FaultFormPageProps) {
  const { slug, department } = await params;
  const query = await searchParams;

  if (department !== "bakim") {
    notFound();
  }

  const { site } = await requireSiteAccess(slug);

  const createFaultForSite =
    createEquipmentFault.bind(
      null,
      site.slug,
      department
    );

  const errorMessage = query.error
    ? errorMessages[query.error] ??
      "Beklenmeyen bir hata oluştu."
    : null;

  return (
    <div className="p-6 lg:p-10">
      <Link
        href={`/sahalar/${site.slug}/bakim`}
        className="text-sm font-medium text-[#0b68b2] hover:underline"
      >
        ← Bakım işlemlerine dön
      </Link>

      <div className="mt-6">
        <p className="text-sm font-medium text-[#0b68b2]">
          {site.name} / Bakım
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Ekipman Arıza Bildirimi
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Arızalı ekipmanın bilgilerini bakım birimine bildirin.
        </p>
      </div>

      <div className="mt-8 max-w-3xl rounded-2xl border border-blue-100 bg-white p-6 shadow-sm lg:p-8">
        {query.success === "created" && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            Arıza bildirimi başarıyla oluşturuldu ve bakım
            birimine gönderildi.
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errorMessage}
          </div>
        )}

        <form
          action={createFaultForSite}
          className="space-y-6"
        >
          <div>
            <label
              htmlFor="equipmentCode"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Ekipman Kodu
            </label>

            <input
              id="equipmentCode"
              name="equipmentCode"
              type="text"
              required
              maxLength={50}
              placeholder="Örn. EXC-01"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0b68b2] focus:ring-4 focus:ring-blue-100" />
          </div>

          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Arıza Başlığı
            </label>

            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={150}
              placeholder="Örn. Hidrolik yağ kaçağı"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0b68b2] focus:ring-4 focus:ring-blue-100"        />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="priority"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Öncelik
              </label>

              <select
                id="priority"
                name="priority"
                required
                defaultValue="medium"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0b68b2] focus:ring-4 focus:ring-blue-100">
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
                <option value="critical">Kritik</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="occurredAt"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Arıza Tarihi ve Saati
              </label>

              <input
                id="occurredAt"
                name="occurredAt"
                type="datetime-local"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 [color-scheme:light] outline-none transition focus:border-[#0b68b2] focus:ring-4 focus:ring-blue-100"/>
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Arıza Açıklaması
            </label>

            <textarea
              id="description"
              name="description"
              required
              maxLength={2000}
              rows={6}
              placeholder="Arızanın belirtilerini ve mevcut durumu açıklayın."
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0b68b2] focus:ring-4 focus:ring-blue-100"   />
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-6">
            <button
              type="submit"
              className="rounded-xl bg-[#064786] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#053b70] focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              Bildirimi Gönder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}