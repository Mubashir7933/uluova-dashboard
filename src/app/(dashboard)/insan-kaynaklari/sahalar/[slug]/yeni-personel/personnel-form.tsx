"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createPersonnel } from "./actions";

export function PersonnelForm({ siteSlug, siteName }: { siteSlug: string; siteName: string }) {
  const [state, formAction, pending] = useActionState(
    createPersonnel.bind(null, siteSlug), { error: "" }
  );
  // Controlled values preserve the user's input after a rejected submission.
  const [values, setValues] = useState({ fullName: "", employeeNo: "", position: "" });
  const fields = [
    { name: "fullName", label: "Ad Soyad", maxLength: 150, required: true },
    { name: "employeeNo", label: "Personel No (isteğe bağlı)", maxLength: 50, required: false },
    { name: "position", label: "Görevi (isteğe bağlı)", maxLength: 100, required: false },
  ] as const;

  return (
    <form action={formAction} className="mt-6 max-w-2xl rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
      <p className="mb-5 rounded-xl bg-blue-50 p-4 text-sm text-[#064786]">Saha: {siteName}</p>
      {state.error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{state.error}</p>}
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-70">
        <legend className="sr-only">Personel bilgileri</legend>
        {fields.map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="mb-2 block text-sm font-medium text-slate-700">{field.label}</label>
            <input
              id={field.name} name={field.name} type="text"
              required={field.required} maxLength={field.maxLength}
              value={values[field.name]}
              onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-3 text-base text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        ))}
        <p className="text-sm text-slate-500">Yeni personel Aktif durumunda kaydedilir.</p>
        <button type="submit" className="w-full rounded-lg bg-[#064786] px-5 py-3 font-medium text-white disabled:cursor-wait sm:w-auto">
          {pending ? "Kaydediliyor…" : "Personeli Kaydet"}
        </button>
      </fieldset>
      {!pending && <Link href={`/insan-kaynaklari/sahalar/${encodeURIComponent(siteSlug)}`} className="mt-4 inline-block text-sm text-[#0b68b2] hover:underline">İptal — personel listesine dön</Link>}
    </form>
  );
}
