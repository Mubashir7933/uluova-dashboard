"use client";

import { useState } from "react";

export function PdfDownloadButton({ formId, updatedAt, disabled }: {
  formId: string | null; updatedAt: string | null; disabled: boolean;
}) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    if (!formId || disabled || downloading) return;
    setDownloading(true); setError("");
    try {
      const response = await fetch(`/insan-kaynaklari/gecici-gorevlendirme/${formId}/pdf?version=${encodeURIComponent(updatedAt ?? "")}`, { cache: "no-store" });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "PDF indirilemedi.");
      }
      if (!response.headers.get("content-type")?.includes("application/pdf")) {
        throw new Error("Oturumunuzu kontrol edip tekrar deneyin.");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url; link.download = `gecici-gorevlendirme-${formId}.pdf`;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "PDF indirilemedi.");
    } finally { setDownloading(false); }
  }

  return <div className="mt-4">
    <button type="button" onClick={download} disabled={!formId || disabled || downloading}
      className="rounded-lg border border-[#064786] px-5 py-3 font-medium text-[#064786] disabled:cursor-not-allowed disabled:opacity-50">
   {downloading ? "PDF hazırlanıyor…" : "PDF İndir"}
    </button>
    {(!formId || disabled) && <p className="mt-2 text-sm text-slate-500">PDF indirmek için önce formu kaydedin.</p>}
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </div>;
}
