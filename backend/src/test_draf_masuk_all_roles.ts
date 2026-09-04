import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { sendWorkSubmissionAlertEmail } from "./services/mail.service";

const TARGET_EMAIL = "ukysclasher1@gmail.com";

async function main() {
  console.log("==================================================================");
  console.log(`Mengirim contoh email DRAF MASUK (Setoran Awal) untuk Foto, Video & Desain ke: ${TARGET_EMAIL}`);
  console.log("==================================================================");

  // 1. Draf Masuk: Foto
  console.log("\n📸 Mengirim: Draf Masuk (Fotografer)...");
  await sendWorkSubmissionAlertEmail({
    to: TARGET_EMAIL,
    reviewerName: "Bambang S., S.Kom (Ahli Pertama)",
    officerName: "Dimas Anggara (Fotografer)",
    activityTitle: "Kunjungan Kerja Kemenparekraf di Desa Wisata Punten",
    contentType: "Foto",
    workLink: "https://drive.google.com/drive/folders/1Foto-Punten-Batu-SetoranAwal",
  });

  // 2. Draf Masuk: Video
  console.log("🎥 Mengirim: Draf Masuk (Videografer)...");
  await sendWorkSubmissionAlertEmail({
    to: TARGET_EMAIL,
    reviewerName: "Bambang S., S.Kom (Ahli Pertama)",
    officerName: "Fajar Ramadhan (Videografer)",
    activityTitle: "Kunjungan Kerja Kemenparekraf di Desa Wisata Punten",
    contentType: "Video Reels",
    workLink: "https://drive.google.com/file/d/1Video-Reels-DesaPunten-v1/view",
  });

  // 3. Draf Masuk: Desainer / Infografis
  console.log("🎨 Mengirim: Draf Masuk (Desainer & Editor)...");
  await sendWorkSubmissionAlertEmail({
    to: TARGET_EMAIL,
    reviewerName: "Bambang S., S.Kom (Ahli Pertama)",
    officerName: "Annisa Larasati (Desainer)",
    activityTitle: "Sosialisasi Pajak Daerah dan Retribusi Wisata",
    contentType: "Infografis",
    workLink: "https://www.canva.com/design/DAF999-InfografisPajakBatu-SetoranAwal/view",
  });

  console.log("\n✓ Seluruh contoh Draf Masuk berhasil dikirim!");
}

main().catch(console.error);
