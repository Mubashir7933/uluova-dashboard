"use client";

import { useActionState, useState } from "react";
import { assignmentFields, type AssignmentField, type AssignmentValues } from "./fields";
import { saveAssignment } from "./actions";
import { PdfDownloadButton } from "./pdf-download-button";

type Props = {
  personnelId: string;
  formId: string | null;
  updatedAt: string | null;
  initialValues: AssignmentValues;
  origin: string;
};

export function AssignmentForm({ personnelId, formId, updatedAt, initialValues, origin }: Props) {
  const [values, setValues] = useState(initialValues);
  const [state, action, pending] = useActionState(
    saveAssignment.bind(null, personnelId, formId, updatedAt), { error: "" }
  );
  return (
    <form action={action} className="mt-6 rounded-2xl border border-blue-100 bg-white p-5 sm:p-6">
      <p className="mb-5 rounded-xl bg-blue-50 p-4 text-sm text-[#064786]">
        Gönderen saha: {origin} · Şablon: Türkçe / Urduca — sürüm 1
      </p>
      {state.error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{state.error}</p>}
      <fieldset disabled={pending} className="grid gap-5 md:grid-cols-2 disabled:opacity-70">
        <legend className="sr-only">Geçici görevlendirme bilgileri</legend>
        {assignmentFields.map((field) => {
          const props = {
            id: field.key, name: field.key, required: field.required,
            maxLength: field.max, value: values[field.key],
            className: "mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-base text-slate-900 focus:outline-blue-500",
          };
          return (
            <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
              <label htmlFor={field.key} className="text-sm font-medium text-slate-700">
                {field.label}{field.required ? " *" : " (isteğe bağlı)"}
              </label>
              {field.type === "textarea" ? (
                <textarea {...props} rows={4} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} />
              ) : (
                <input {...props} type={field.type} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} />
              )}
            </div>
          );
        })}
        <p className="text-sm text-slate-500 md:col-span-2">
          Taslak kaydı saha değişikliği veya onay oluşturmaz. İmzalar ayrıca alınır.
        </p>
        <button type="submit" className="rounded-lg bg-[#064786] px-5 py-3 font-medium text-white disabled:cursor-wait md:col-span-2">
          {pending ? "Kaydediliyor…" : formId ? "Değişiklikleri Kaydet" : "Taslağı Kaydet"}
        </button>
      </fieldset>
      <PdfDownloadButton
  formId={formId}
  updatedAt={updatedAt}
  disabled={
    pending ||
    assignmentFields.some(
      (field: AssignmentField) => values[field.key] !== initialValues[field.key]
    )
  }
/>
    </form>
  );
}
