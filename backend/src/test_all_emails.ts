import dotenv from "dotenv";
import path from "path";

// Load backend/.env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import {
  sendWelcomeNewUserEmail,
  sendAssignmentNotificationEmail,
  sendWorkSubmissionAlertEmail,
  sendReviewRevisionEmail,
  sendAssignmentScheduleChangeEmail,
} from "./services/mail.service";

const TARGET_EMAIL = "ukysclasher1@gmail.com";

async function runTest() {
  console.log("=================================================");
  console.log(`🚀 MEMULAI UJI PENGIRIMAN SELURUH EMAIL KE: ${TARGET_EMAIL}`);
  console.log("=================================================");

  // 1. Email Welcome Akun Baru Petugas
  console.log("\n[1/5] Mengirim: Email Welcome Akun Baru (Jabatan Baru PRAHUM)...");
  const res1 = await sendWelcomeNewUserEmail({
    to: TARGET_EMAIL,
    name: "Rizky Ramadhan",
    username: "rizky.prahum",
    temporaryPassword: "BatuSmartCity#2026",
    roleName: "Pranata Humas (Penulis Naskah)",
  });
  console.log(`=> Status Email 1: ${res1 ? "BERHASIL ✓" : "GAGAL ✗"}`);

  // 2. Email Penugasan Biasa (oleh Admin)
  console.log("\n[2/5] Mengirim: Email Penugasan dari Admin (Output Naskah Berita)...");
  const res2 = await sendAssignmentNotificationEmail({
    to: TARGET_EMAIL,
    officerName: "Rizky Ramadhan",
    activityTitle: "Peresmian Sentra UMKM Apel dan Bunga Balai Kota Among Tani",
    activityDate: "2026-09-08",
    startTime: "09:00:00",
    endTime: "12:00:00",
    locationName: "Graha Among Tani Gedung A Lt. 1, Kota Batu",
    opdName: "Dinas Koperasi, UMKM, dan Perdagangan Kota Batu",
    contentType: "Naskah Berita",
    instruction: "Fokus liputan pada wawancara pelaku UMKM lokal dan sambutan Pj. Walikota Batu.",
    assignmentId: "test-assign-01",
  });
  console.log(`=> Status Email 2: ${res2 ? "BERHASIL ✓" : "GAGAL ✗"}`);

  // 3. Email Konfirmasi Self-Claim (Agenda Tersedia)
  console.log("\n[3/5] Mengirim: Email Konfirmasi Ambil Tugas Mandiri (Self-Claim)...");
  const res3 = await sendAssignmentNotificationEmail({
    to: TARGET_EMAIL,
    officerName: "Rizky Ramadhan",
    activityTitle: "Festival Seni Budaya dan Karnaval Bunga Nusantara 2026",
    activityDate: "2026-09-15",
    startTime: "08:00:00",
    endTime: "14:00:00",
    locationName: "Sepanjang Jl. Panglima Sudirman, Kota Batu",
    opdName: "Dinas Pariwisata Kota Batu",
    contentType: "Foto",
    instruction: "Tugas ini berhasil Anda ambil secara mandiri melalui menu Agenda Tersedia.",
    assignmentId: "test-claim-02",
  });
  console.log(`=> Status Email 3: ${res3 ? "BERHASIL ✓" : "GAGAL ✗"}`);

  // 4. Email Alert Draf Naskah Masuk ke Reviewer / Ahli Pertama
  console.log("\n[4/5] Mengirim: Notifikasi Draf Masuk ke Reviewer (Teks Naskah Berita)...");
  const newsDraftText = `KOTA BATU – Pj. Walikota Batu meresmikan gerai produk UMKM apel olahan unggulan di Balai Kota Among Tani pada hari Selasa. Dalam sambutannya, beliau menekankan pentingnya digitalisasi promosi dan standardisasi kemasan bagi para perajin lokal agar mampu menembus pasar ritel nasional.\n\n"Pemerintah Kota Batu berkomitmen penuh memfasilitasi sertifikasi halal dan pelatihan branding bagi seluruh pelaku ekonomi kreatif," ujar Pj. Walikota di hadapan puluhan asosiasi pengusaha kuliner.`;

  const res4 = await sendWorkSubmissionAlertEmail({
    to: TARGET_EMAIL,
    reviewerName: "Bambang S., S.Kom (Pranata Humas Ahli Pertama)",
    officerName: "Rizky Ramadhan",
    activityTitle: "Peresmian Sentra UMKM Apel Balai Kota Among Tani",
    contentType: "Naskah Berita",
    workLink: newsDraftText,
  });
  console.log(`=> Status Email 4: ${res4 ? "BERHASIL ✓" : "GAGAL ✗"}`);

  // 5. Email Catatan Revisi dari Reviewer / Ahli Pertama
  console.log("\n[5/5] Mengirim: Catatan Revisi (Minta Revisi oleh Ahli Pertama)...");
  const res5 = await sendReviewRevisionEmail({
    to: TARGET_EMAIL,
    authorName: "Rizky Ramadhan",
    activityTitle: "Peresmian Sentra UMKM Apel Balai Kota Among Tani",
    contentType: "Naskah Berita",
    reviewerName: "Bambang S., S.Kom (Ahli Pertama)",
    feedback: "Perbaiki typo pada gelar narasumber di paragraf 2 dan tambahkan data kutipan jumlah stan UMKM yang berpartisipasi.",
  });
  console.log(`=> Status Email 5: ${res5 ? "BERHASIL ✓" : "GAGAL ✗"}`);

  console.log("\n=================================================");
  console.log("🎉 SELURUH PENGUJIAN EMAIL SELESAI!");
  console.log("Silakan periksa kotak masuk (Inbox) email Anda.");
  console.log("=================================================");
}

runTest().catch((err) => {
  console.error("Terjadi kesalahan saat pengujian:", err);
});
