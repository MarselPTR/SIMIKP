import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import {
  sendReviewRevisionEmail,
  sendRevisionSubmissionAlertEmail,
} from "./services/mail.service";

const TARGET_EMAIL = "ukysclasher1@gmail.com";

async function runTwoWayTests() {
  console.log("==================================================================");
  console.log(`🚀 MENGIRIM UJI COBA 2 ARAH (FOTOGRAFER, VIDEOGRAFER, DESAINER) KE: ${TARGET_EMAIL}`);
  console.log("==================================================================");

  // ─────────────────────────────────────────────────────────────
  // 1. FOTOGRAFER
  // ─────────────────────────────────────────────────────────────
  console.log("\n📸 [1/6] FOTOGRAFER - Arah 1: Catatan Revisi dari Reviewer ke Fotografer...");
  const f1 = await sendReviewRevisionEmail({
    to: TARGET_EMAIL,
    authorName: "Dimas Anggara (Fotografer)",
    activityTitle: "Karnaval Bunga dan Festival Budaya Nusantara 2026",
    contentType: "Foto",
    reviewerName: "Bambang S., S.Kom (Ahli Pertama)",
    feedback: "Foto momen sambutan Pj. Walikota di panggung utama agak gelap (underexposed). Tolong perbaiki pencahayaannya dan pilihkan 3 foto interaksi dekat dengan warga di stan pameran.",
  });
  console.log(`=> Status: ${f1 ? "BERHASIL ✓" : "GAGAL ✗"}`);

  console.log("\n📸 [2/6] FOTOGRAFER - Arah 2: Verifikasi Revisi dari Fotografer ke Ahli Pertama...");
  const f2 = await sendRevisionSubmissionAlertEmail({
    to: TARGET_EMAIL,
    reviewerName: "Bambang S., S.Kom (Ahli Pertama)",
    officerName: "Dimas Anggara (Fotografer)",
    activityTitle: "Karnaval Bunga dan Festival Budaya Nusantara 2026",
    contentType: "Foto",
    workLink: "https://drive.google.com/drive/folders/1A2B3C-FotoRevisiKotaBatu-Final",
    previousNotes: "Foto momen sambutan Pj. Walikota agak gelap dan perlu tambahan foto interaksi dengan warga.",
  });
  console.log(`=> Status: ${f2 ? "BERHASIL ✓" : "GAGAL ✗"}`);

  // ─────────────────────────────────────────────────────────────
  // 2. VIDEOGRAFER
  // ─────────────────────────────────────────────────────────────
  console.log("\n🎥 [3/6] VIDEOGRAFER - Arah 1: Catatan Revisi dari Reviewer ke Videografer...");
  const v1 = await sendReviewRevisionEmail({
    to: TARGET_EMAIL,
    authorName: "Fajar Ramadhan (Videografer)",
    activityTitle: "Peluncuran Program Wisata Petik Apel Ramah Anak",
    contentType: "Video",
    reviewerName: "Bambang S., S.Kom (Ahli Pertama)",
    feedback: "Volume audio backsound terlalu keras sehingga suara wawancara narasumber tenggelam. Turunkan volume musik latar -6dB dan potong bumper pembuka dari 5 detik jadi 2 detik.",
  });
  console.log(`=> Status: ${v1 ? "BERHASIL ✓" : "GAGAL ✗"}`);

  console.log("\n🎥 [4/6] VIDEOGRAFER - Arah 2: Verifikasi Revisi dari Videografer ke Ahli Pertama...");
  const v2 = await sendRevisionSubmissionAlertEmail({
    to: TARGET_EMAIL,
    reviewerName: "Bambang S., S.Kom (Ahli Pertama)",
    officerName: "Fajar Ramadhan (Videografer)",
    activityTitle: "Peluncuran Program Wisata Petik Apel Ramah Anak",
    contentType: "Video",
    workLink: "https://drive.google.com/file/d/1X9Y8Z-ReelsRevisiWisataBatu-v2/view",
    previousNotes: "Volume audio backsound terlalu keras dan potong bumper pembuka.",
  });
  console.log(`=> Status: ${v2 ? "BERHASIL ✓" : "GAGAL ✗"}`);

  // ─────────────────────────────────────────────────────────────
  // 3. DESAINER & EDITOR GRAFIS
  // ─────────────────────────────────────────────────────────────
  console.log("\n🎨 [5/6] DESAINER & EDITOR - Arah 1: Catatan Revisi dari Reviewer ke Desainer...");
  const d1 = await sendReviewRevisionEmail({
    to: TARGET_EMAIL,
    authorName: "Annisa Larasati (Desainer)",
    activityTitle: "Publikasi Jadwal Pelayanan Keliling Dispendukcapil",
    contentType: "Infografis",
    reviewerName: "Bambang S., S.Kom (Ahli Pertama)",
    feedback: "Penempatan Logo Pemkot Batu dan Diskominfo di pojok atas belum presisi/sejajar. Warna teks jadwal tanggal juga kurang kontras dengan background biru tua, tolong ganti warna font jadi putih/kuning terang.",
  });
  console.log(`=> Status: ${d1 ? "BERHASIL ✓" : "GAGAL ✗"}`);

  console.log("\n🎨 [6/6] DESAINER & EDITOR - Arah 2: Verifikasi Revisi dari Desainer ke Ahli Pertama...");
  const d2 = await sendRevisionSubmissionAlertEmail({
    to: TARGET_EMAIL,
    reviewerName: "Bambang S., S.Kom (Ahli Pertama)",
    officerName: "Annisa Larasati (Desainer)",
    activityTitle: "Publikasi Jadwal Pelayanan Keliling Dispendukcapil",
    contentType: "Infografis",
    workLink: "https://www.canva.com/design/DAF123-InfografisPelayananKeliling-Revisi",
    previousNotes: "Logo belum presisi dan warna font tanggal kurang kontras.",
  });
  console.log(`=> Status: ${d2 ? "BERHASIL ✓" : "GAGAL ✗"}`);

  console.log("\n==================================================================");
  console.log("🎉 PENGIRIMAN 6 EMAIL CONTOH DUA ARAH SELESAI!");
  console.log("Silakan periksa kotak masuk (Inbox) email Anda.");
  console.log("==================================================================");
}

runTwoWayTests().catch(console.error);
