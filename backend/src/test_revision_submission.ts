import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { sendRevisionSubmissionAlertEmail } from "./services/mail.service";

const TARGET_EMAIL = "ukysclasher1@gmail.com";

async function main() {
  console.log("Menguji pengiriman notifikasi Verifikasi Revisi ke Ahli Pertama...");

  const revisedArticle = `KOTA BATU – Pemerintah Kota Batu melalui Dinas Koperasi, UMKM, dan Perdagangan secara resmi meluncurkan sentra terpadu produk olahan apel dan hortikultura di Graha Among Tani pada Selasa pagi.\n\nDalam peresmian tersebut, tercatat 45 stan UMKM lokal berpartisipasi memamerkan produk inovasi olahan buah. "Pemerintah Kota Batu berkomitmen penuh memfasilitasi standardisasi higienis dan perluasan pangsa pasar produk lokal hingga ke tingkat mancanegara," tegas Bapak Dr. Aries Agung Paewai, S.STP., M.M. selaku Pj. Walikota Batu.`;

  const success = await sendRevisionSubmissionAlertEmail({
    to: TARGET_EMAIL,
    reviewerName: "Bambang S., S.Kom (Pranata Humas Ahli Pertama)",
    officerName: "Rizky Ramadhan (Prahum)",
    activityTitle: "Peresmian Sentra Terpadu UMKM Apel dan Bunga",
    contentType: "Naskah Berita",
    workLink: revisedArticle,
    previousNotes: "Koreksi penulisan gelar Pj. Walikota Batu dan cantumkan jumlah stan UMKM yang berpartisipasi.",
  });

  console.log(`Status Pengiriman Email Verifikasi Revisi: ${success ? "BERHASIL ✓" : "GAGAL ✗"}`);
}

main().catch(console.error);
