import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export type AssignmentPdfData = {
  id: string;
  employee_full_name: string;
  employee_identity_no: string | null;
  employee_position: string | null;
  employee_phone: string | null;
  destination_name: string;
  start_date: string;
  end_date: string | null;
  work_description: string | null;
  sender_approver_name: string | null;
  sender_approver_position: string | null;
  receiver_approver_name: string | null;
  receiver_approver_position: string | null;
};

// Coordinates are measured from the top-left of the company's A4 template.
export async function createAssignmentPdf(record: AssignmentPdfData) {
  const directory = path.join(process.cwd(), "assets/assignment-templates");
  const [template, fontBytes] = await Promise.all([
    readFile(path.join(directory, "tr-ur-v1.pdf")),
    readFile(path.join(directory, "DejaVuSans.ttf")),
  ]);
  const pdf = await PDFDocument.load(template);
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const page = pdf.getPages()[0];
  const overflow: { label: string; value: string }[] = [];
  const date = (value: string | null) => value ? value.split("-").reverse().join(".") : "";
  const clean = (value: string) => value.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, " ");

  function wrap(value: string, width: number, size: number) {
    const lines: string[] = [];
    for (const paragraph of clean(value).split("\n")) {
      let line = "";
      for (const word of paragraph.split(/\s+/)) {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= width) { line = candidate; continue; }
        if (line) lines.push(line);
        line = "";
        // Split long unbroken identifiers without losing characters.
        for (const character of word) {
          if (line && font.widthOfTextAtSize(line + character, size) > width) {
            lines.push(line); line = "";
          }
          line += character;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  function field(label: string, value: string | null, x: number, top: number, width: number, height = 19) {
    if (!value) return;
    let size = 9;
    let lines = wrap(value, width, size);
    while (size > 7 && lines.length * size * 1.2 > height) {
      size -= 0.5; lines = wrap(value, width, size);
    }
    if (lines.length * size * 1.2 > height) {
      overflow.push({ label, value });
      size = 8; lines = [`Bkz. Ek ${overflow.length}`];
    }
    lines.forEach((line, index) => page.drawText(line, {
      x, y: page.getHeight() - top - size - index * size * 1.2, size, font, color: rgb(0, 0, 0),
    }));
  }

  field("Ad Soyad", record.employee_full_name, 274, 162, 254);
  field("Kimlik No", record.employee_identity_no, 274, 184, 254);
  field("Görevi", record.employee_position, 274, 207, 254);
  field("Geçici Görev Yeri", record.destination_name, 274, 229, 254);
  field("Başlangıç Tarihi", date(record.start_date), 274, 252, 254);
  field("Bitiş Tarihi", date(record.end_date), 274, 274, 254);
  field("Yapacağı İş", record.work_description, 274, 297, 254);
  field("Telefonu", record.employee_phone, 274, 319, 254);
  field("Personel Ad Soyad", record.employee_full_name, 274, 430, 254, 15);
  field("Gönderen Yetkili Ad Soyad", record.sender_approver_name, 140, 601, 128, 21);
  field("Gönderen Yetkili Görevi", record.sender_approver_position, 140, 625, 128, 21);
  field("Çalışacağı Saha Yetkilisi Ad Soyad", record.receiver_approver_name, 405, 601, 124, 21);
  field("Çalışacağı Saha Yetkilisi Görevi", record.receiver_approver_position, 405, 625, 124, 21);

  // Preserve full values on continuation pages when a template cell is too small.
  let appendix = page;
  let top = 800;
  for (let index = 0; index < overflow.length; index++) {
    const item = overflow[index];
    for (const line of wrap(`Ek ${index + 1} — ${item.label}\n${item.value}\n`, 495, 10)) {
      if (top > 755) {
        appendix = pdf.addPage([595.304, 841.89]); top = 90;
        appendix.drawText("Geçici Görevlendirme Formu — Ek Bilgiler", { x: 50, y: 790, font, size: 12 });
        appendix.drawText(`Form: ${record.id}`, { x: 50, y: 773, font, size: 8 });
      }
      appendix.drawText(line, { x: 50, y: appendix.getHeight() - top, font, size: 10 });
      top += 15;
    }
  }
  pdf.getPages().forEach((item, index) => {
    item.drawText(`Form: ${record.id}  |  ${index + 1} / ${pdf.getPageCount()}`, {
      x: 50, y: 30, font, size: 7, color: rgb(0.35, 0.35, 0.35),
    });
  });
  // Keep the template's document-control page count accurate with appendices.
  page.drawRectangle({ x: 470, y: page.getHeight() - 129, width: 60, height: 18, color: rgb(1, 1, 1) });
  page.drawText(`1 / ${pdf.getPageCount()}`, { x: 471, y: page.getHeight() - 124, font, size: 7 });
  pdf.setTitle("Geçici Görevlendirme Formu");
  pdf.setAuthor("ULUOVA İnşaat A.Ş.");
  return pdf.save();
}
