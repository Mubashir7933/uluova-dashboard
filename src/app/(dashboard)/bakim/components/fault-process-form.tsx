import { updateEquipmentFault } from "../actions";

type FaultStatus =
  | "open"
  | "in_progress"
  | "resolved";

type FaultProcessFormProps = {
  faultId: number;
  currentStatus: FaultStatus;
  currentNote: string | null;
};

export function FaultProcessForm({
  faultId,
  currentStatus,
  currentNote,
}: FaultProcessFormProps) {
    const defaultProcessStatus =
  currentStatus === "resolved"
    ? "resolved"
    : "in_progress";
  return (
    <form
      action={updateEquipmentFault}
      className="mt-6 space-y-5 border-t border-slate-100 pt-6"
    >
      <input
        type="hidden"
        name="faultId"
        value={faultId}
      />

      <div>
        <label
          htmlFor={`status-${faultId}`}
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Arıza Durumu
        </label>

        <select
          id={`status-${faultId}`}
          name="status"
          defaultValue={defaultProcessStatus}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0b68b2] focus:ring-4 focus:ring-blue-100"
        >

          <option value="in_progress">
            İşleme Alındı
          </option>

          <option value="resolved">
            Çözüldü
          </option>
        </select>
      </div>

      <div>
        <label
          htmlFor={`maintenance-note-${faultId}`}
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Bakım Notu
        </label>

        <textarea
          id={`maintenance-note-${faultId}`}
          name="maintenanceNote"
          defaultValue={currentNote ?? ""}
          maxLength={2000}
          rows={4}
          placeholder="Yapılan kontrolü, işlemi veya çözümü yazın."
          className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0b68b2] focus:ring-4 focus:ring-blue-100"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-xl bg-[#064786] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#053b70] focus:outline-none focus:ring-4 focus:ring-blue-200"
        >
          İşlemi Kaydet
        </button>
      </div>
    </form>
  );
}