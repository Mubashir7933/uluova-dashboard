export const assignmentFields = [
    { key: "employee_full_name", label: "Ad Soyad", type: "text", max: 150, required: true },
    { key: "employee_identity_no", label: "T.C. / Yabancı Kimlik No", type: "text", max: 30, required: false },
    { key: "employee_position", label: "Görevi", type: "text", max: 100, required: false },
    { key: "employee_phone", label: "Telefonu", type: "tel", max: 30, required: false },
    { key: "destination_name", label: "Geçici Görev Yeri", type: "text", max: 200, required: true },
    { key: "start_date", label: "Başlangıç Tarihi", type: "date", max: 10, required: true },
    { key: "end_date", label: "Bitiş Tarihi", type: "date", max: 10, required: false },
    { key: "work_description", label: "Yapacağı İş", type: "textarea", max: 2000, required: false },
    { key: "sender_approver_name", label: "Gönderen Saha Yetkilisi — Ad Soyad", type: "text", max: 150, required: false },
    { key: "sender_approver_position", label: "Gönderen Saha Yetkilisi — Görevi", type: "text", max: 100, required: false },
    { key: "receiver_approver_name", label: "Çalışacağı Saha Yetkilisi — Ad Soyad", type: "text", max: 150, required: false },
    { key: "receiver_approver_position", label: "Çalışacağı Saha Yetkilisi — Görevi", type: "text", max: 100, required: false },
  ] as const;
  
  export type AssignmentField = (typeof assignmentFields)[number];
  export type AssignmentValues = Record<AssignmentField["key"], string>;
  export const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  